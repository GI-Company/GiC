# ==============================================================================
# BITVISION-CELL v0.2 — LIVING-PATHOGEN TISSUE SIMULATOR + LEARNED INTERVENTION
# ==============================================================================
# Research simulator only. It does NOT model real disease or predict/design real
# treatments. Every rule below is hand-written and arbitrary; what the policy
# learns is how to exploit THESE rules.
#
# STRUCTURE
#   Disease  = hardcoded living system (no learned parameters):
#              virions spread through the tissue, infect susceptible cells,
#              infected cells produce more virions and die, and the pathogen
#              EVOLVES: hidden resistance to each intervention mechanism rises
#              under selection pressure, and it can evade the immune response.
#   Cells    = hardcoded tissue sites with healthy / infected / dead fractions,
#              regeneration, local spread, and an immune system that ramps up
#              with infection.
#   Learned  = ONE PPO policy (the intervention). Each step it picks WHERE to act
#              (pointer over cells) and HOW MUCH of each of 6 mechanism operators
#              to apply. Operators have decay (pharmacokinetics) and toxicity.
#   Goal     = slow the infection or eradicate it from the host while keeping
#              the tissue alive and toxicity low.
#
# AFTER TRAINING the script runs an ablation analysis: which mechanisms the
# policy uses, and how much outcome drops when each one is removed. (Post-hoc
# ablation without retraining is only a rough indicator of reliance.)
#
# WHERE ALPHAFOLD ENTERS (honest version): the tissue is an abstract tissue whose
# cells are residues of an AlphaFold structure. Cell connectivity comes from the
# 3D contact graph; per-cell susceptibility comes from structural features
# (contact density + pLDDT, via an arbitrary hand-written mapping). This makes
# the structure shape the dynamics, but it is a modeling convenience, not biology.
#
# DATA POLICY: AlphaFold DB structures only (check/carry current attribution
# terms). No AlphaGenome outputs are used. Verify current terms yourself.
# ==============================================================================

import os, sys, json, math, time, random, subprocess, importlib.util
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

def ensure(pkg, import_name=None):
    name = import_name or pkg.split("==")[0].replace("-", "_")
    if importlib.util.find_spec(name) is None:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

ensure("biopython", "Bio")
ensure("requests", "requests")

import numpy as np
import requests
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Normal, Categorical
from Bio.PDB.MMCIF2Dict import MMCIF2Dict

# ------------------------------------------------------------------------------
# 1. CONFIG
# ------------------------------------------------------------------------------
SEED = 403
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
USE_BF16 = DEVICE.type == "cuda" and torch.cuda.is_bf16_supported()
if DEVICE.type == "cuda":
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    torch.set_float32_matmul_precision("high")

UPDATES = 600
SAVE_EVERY = 25
N_ENVS = 32
ROLLOUT_STEPS = 50
PPO_EPOCHS = 3
MINIBATCH = 256
GAMMA = 0.985
GAE_LAMBDA = 0.95
CLIP_EPS = 0.20
ENTROPY_COEF = 0.003
VALUE_COEF = 0.50
MAX_GRAD_NORM = 1.0
LR = 2e-4

EPISODE_STEPS = 100
N_CELLS = 256            # max cells (= residues in a crop)
N_FEAT = 10              # per-cell token features
K_OPS = 6                # intervention mechanisms
DESC_DIM = 8             # structural descriptor
CTX_DIM = DESC_DIM + K_OPS + 4

D_MODEL = 256
HEADS = 4
DEPTH = 4
MLP_MULT = 8 / 3

AF_STREAM_IDS = [
    "P04637", "P00533", "P01116", "P15056",
    "P31749", "P60484", "P38398", "P10275",
]

BASE = Path("/content/drive/MyDrive/BitVision_Cell_v02")   # new folder: does NOT overwrite v0.1.x
try:
    from google.colab import drive
    drive.mount("/content/drive", force_remount=False)
except Exception:
    BASE = Path("/kaggle/working/BitVision_Cell_v02") if Path("/kaggle").exists() else Path("./BitVision_Cell_v02")

CACHE_DIR = BASE / "alphafold_cache"
CKPT_DIR = BASE / "checkpoints"
EP_DIR = BASE / "episodes"
for p in [BASE, CACHE_DIR, CKPT_DIR, EP_DIR]:
    p.mkdir(parents=True, exist_ok=True)

print("=" * 96)
print("BITVISION-CELL v0.2  (living pathogen + tissue, learned intervention)")
print("=" * 96)
print("device:", DEVICE, "| bf16 encoder:", USE_BF16)
if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
print("save dir:", BASE)
print("updates:", UPDATES, "| envs:", N_ENVS, "| rollout:", ROLLOUT_STEPS, "| episode steps:", EPISODE_STEPS)
print()

# ------------------------------------------------------------------------------
# 2. ALPHAFOLD STREAM + PARSER
# ------------------------------------------------------------------------------
AA3 = {
    "ALA":0,"ARG":1,"ASN":2,"ASP":3,"CYS":4,"GLN":5,"GLU":6,"GLY":7,"HIS":8,"ILE":9,
    "LEU":10,"LYS":11,"MET":12,"PHE":13,"PRO":14,"SER":15,"THR":16,"TRP":17,"TYR":18,"VAL":19
}

@dataclass
class ProteinRecord:
    accession: str
    base_features: np.ndarray   # [L,7]: aa_norm, x, y, z, plddt, density, relpos
    coords: np.ndarray          # [L,3] normalized
    plddt: np.ndarray           # [L]
    source_url: str

def _recursive_urls(obj):
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = str(k).lower()
            if isinstance(v, str) and ("cif" in kl or v.lower().endswith(".cif")):
                out.append(v)
            out.extend(_recursive_urls(v))
    elif isinstance(obj, list):
        for x in obj:
            out.extend(_recursive_urls(x))
    return out

def get_alphafold_cif_url(accession: str) -> str:
    r = requests.get(f"https://alphafold.ebi.ac.uk/api/prediction/{accession}", timeout=30)
    r.raise_for_status()
    urls = [u for u in _recursive_urls(r.json()) if isinstance(u, str) and ".cif" in u.lower()]
    if not urls:
        raise RuntimeError(f"No CIF URL returned by AlphaFold DB for {accession}")
    return urls[0]

def download_cif(accession: str) -> Tuple[Path, str]:
    out = CACHE_DIR / f"{accession}.cif"
    meta = CACHE_DIR / f"{accession}.json"
    if out.exists() and meta.exists():
        return out, json.loads(meta.read_text())["source_url"]
    url = get_alphafold_cif_url(accession)
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    out.write_bytes(r.content)
    meta.write_text(json.dumps({"accession": accession, "source_url": url}, indent=2))
    return out, url

def parse_cif(accession: str) -> ProteinRecord:
    path, source_url = download_cif(accession)
    d = MMCIF2Dict(str(path))
    atom = d["_atom_site.label_atom_id"]; comp = d["_atom_site.label_comp_id"]
    seq = d["_atom_site.label_seq_id"]
    xs = d["_atom_site.Cartn_x"]; ys = d["_atom_site.Cartn_y"]; zs = d["_atom_site.Cartn_z"]
    b = d.get("_atom_site.B_iso_or_equiv", ["50"] * len(atom))

    rows, seen = [], set()
    for a, aa, si, x, y, z, bf in zip(atom, comp, seq, xs, ys, zs, b):
        if str(a).strip() != "CA":
            continue
        key = str(si)
        if key in seen:
            continue
        seen.add(key)
        try:
            rows.append((AA3.get(str(aa).upper(), 0), float(x), float(y), float(z), float(bf)))
        except Exception:
            continue
    if len(rows) < 32:
        raise RuntimeError(f"{accession}: only {len(rows)} CA residues parsed")

    arr = np.asarray(rows, dtype=np.float32)
    aa = arr[:, 0]
    raw_xyz = arr[:, 1:4]
    plddt = np.clip(arr[:, 4], 0, 100) / 100.0

    xyz = raw_xyz - raw_xyz.mean(0, keepdims=True)
    scale = np.percentile(np.linalg.norm(xyz, axis=1), 95)
    xyz = np.clip(xyz / max(float(scale), 1e-6), -2.0, 2.0)

    density = np.zeros(len(raw_xyz), dtype=np.float32)
    for s in range(0, len(raw_xyz), 512):
        q = raw_xyz[s:s+512]
        dist2 = ((q[:, None, :] - raw_xyz[None, :, :]) ** 2).sum(-1)
        density[s:s+512] = (dist2 < 100.0).mean(axis=1)      # CA within 10 A
    density = density / max(float(density.max()), 1e-6)

    base = np.stack([aa / 19.0, xyz[:, 0], xyz[:, 1], xyz[:, 2], plddt, density,
                     np.linspace(0, 1, len(arr), dtype=np.float32)], axis=1).astype(np.float32)
    return ProteinRecord(accession, base, xyz.astype(np.float32), plddt.astype(np.float32), source_url)

class ProteinStream:
    def __init__(self, accessions):
        self.accessions = list(accessions)
        self.cache: Dict[str, ProteinRecord] = {}
        self.bad = set()

    def get(self, accession):
        if accession in self.cache:
            return self.cache[accession]
        if accession in self.bad:
            raise RuntimeError(f"Previously failed: {accession}")
        try:
            print(f"[stream] AlphaFold {accession} ...", flush=True)
            rec = parse_cif(accession)
            self.cache[accession] = rec
            print(f"[stream] {accession}: {len(rec.base_features):,} residues")
            return rec
        except Exception:
            self.bad.add(accession)
            raise

    def prefetch_all(self):
        ok = 0
        for acc in self.accessions:
            try:
                self.get(acc); ok += 1
            except Exception as e:
                print(f"[stream warning] {acc}: {type(e).__name__}: {e}")
        if ok == 0:
            raise RuntimeError("No usable AlphaFold structures")
        print(f"[stream] prefetched {ok}/{len(self.accessions)} structures")

    def sample(self):
        order = [a for a in self.accessions if a not in self.bad]
        random.shuffle(order)
        for acc in order:
            try:
                return self.get(acc)
            except Exception as e:
                print(f"[stream warning] {acc}: {type(e).__name__}: {e}")
        raise RuntimeError("No usable AlphaFold structures")

stream = ProteinStream(AF_STREAM_IDS)
stream.prefetch_all()

# ------------------------------------------------------------------------------
# 3. HARDCODED TISSUE + LIVING PATHOGEN + INTERVENTION OPERATORS
# ------------------------------------------------------------------------------
# All parameters here are hand-set and arbitrary. Change them freely; the point
# of the simulator is that the DISEASE and CELL rules are fixed code, and only the
# intervention is learned.

OP_NAMES = ["entry_block", "replication_inhibit", "immune_boost",
            "cell_shield", "virion_clearance", "infected_cull"]
#            global         global               global
#                           local                local          local
EFF = np.array([0.60, 0.60, 0.80, 0.60, 0.60, 0.55])   # max potency
KEEP     = np.array([0.80, 0.80, 0.85, 0.85, 0.75, 0.60])   # per-step retention of drug level
TOX = np.array([0.20, 0.20, 0.30, 0.08, 0.08, 0.24])   # systemic toxicity per unit dose
IS_LOCAL = np.array([0, 0, 0, 1, 1, 1], dtype=bool)         # local ops deposit around the focus cell
KERNEL_SIGMA = 0.22                                         # focus footprint (normalized coords)

# Pathogen / tissue dynamics
BETA0 = 1.6     # infection hazard scale
BURST = 1.2     # virions produced per infected fraction per step
DELTA   = 0.06    # natural lysis of infected cells
VDEC    = 0.25    # virion decay
DV      = 0.35    # virion spread to contact-graph neighbors
K_IMM   = 0.5     # immune kill rate scale
RHO     = 0.03    # tissue regeneration (dead -> healthy)
A_BASE  = 0.05    # baseline immune level
SPARK_P = 0.05 # chance per step of a new virion spark somewhere (reseeding)
MU = 0.06    # resistance evolution rate under selection
RDECAY  = 0.01    # resistance fitness-cost decay per step
KNN     = 6       # contact-graph neighbors per cell

# Reward
BURDEN_W   = 2.0   # per-step penalty on tissue burden
DOSE_COST  = 0.02  # per-step penalty per unit total dose
TOX_COST   = 0.30  # penalty on toxicity above threshold
TOX_THRESH = 0.60
ERAD_BONUS = 5.0   # on eradication (scaled by remaining healthy fraction)
FAIL_PENALTY = 5.0 # on host failure (healthy fraction collapse)
FAIL_H = 0.20
ERAD_TOX_W = 1.0   # discharge penalty: residual toxicity at eradication (else a fast heavy burst is free)

class BitVisionCellEnv:
    def __init__(self, protein_stream):
        self.stream = protein_stream
        self.op_mask = np.ones(K_OPS, dtype=np.float64)    # used by the ablation analysis
        self.reset()

    # ---------------- setup ----------------
    def reset(self):
        self.rng = np.random.default_rng(random.getrandbits(32))
        rec = self.stream.sample()
        self.rec = rec
        L = len(rec.base_features)
        start = 0 if L <= N_CELLS else random.randint(0, L - N_CELLS)
        end = min(L, start + N_CELLS)
        self.crop_start = start
        base = rec.base_features[start:end]
        n = len(base)
        self.n = n

        # Crop-local normalized coordinates.
        c = rec.coords[start:end].astype(np.float64)
        c = c - c.mean(0, keepdims=True)
        sc = np.percentile(np.linalg.norm(c, axis=1), 95)
        self.coords = np.clip(c / max(float(sc), 1e-6), -2.0, 2.0)
        self.plddt = base[:, 4].astype(np.float64)
        density = base[:, 5].astype(np.float64)

        # Cell connectivity = 3D contact graph (kNN), row-normalized.
        diff = self.coords[:, None, :] - self.coords[None, :, :]
        self.D2 = (diff ** 2).sum(-1)
        k = min(KNN + 1, n)
        nn_idx = np.argsort(self.D2, axis=1)[:, 1:k]
        A = np.zeros((n, n))
        rows = np.repeat(np.arange(n), nn_idx.shape[1])
        A[rows, nn_idx.reshape(-1)] = 1.0
        A = np.maximum(A, A.T)
        self.A = A / np.maximum(A.sum(1, keepdims=True), 1e-9)

        # Per-cell susceptibility from structure (arbitrary hand-written mapping).
        z = 3.0 * (density - 0.5) + 2.0 * (self.plddt - 0.7)
        self.s = 0.35 + 0.65 / (1.0 + np.exp(-z))

        # Structural descriptor for the policy context.
        self.desc = np.array([
            math.log(max(L, 2)) / 8.0, self.plddt.mean(), density.mean(), density.std(),
            np.linalg.norm(self.coords, axis=1).mean(), float((self.plddt > 0.9).mean()),
            float(base[:, 0].mean()), float((self.A > 0).sum(1).mean()) / KNN,
        ], dtype=np.float64)

        # Strain (hidden): infectivity, replication, initial resistance per mechanism.
        self.inf_mult = self.rng.uniform(0.85, 1.25) * (0.9 + 0.2 * density.mean())
        self.rep_mult = self.rng.uniform(0.85, 1.25)
        self.r = self.rng.uniform(0.0, 0.12, K_OPS)

        # Tissue state.
        self.h = np.ones(n); self.i = np.zeros(n); self.d = np.zeros(n); self.v = np.zeros(n)
        for f in self.rng.integers(0, n, size=int(self.rng.integers(1, 4))):
            self.i[f] += self.rng.uniform(0.3, 0.6)
            self.v[f] += 0.3
            for nb in np.nonzero(self.A[f])[0]:
                self.i[nb] += 0.08
        self.i = np.clip(self.i, 0, 0.9)
        self.h = 1.0 - self.i

        self.C = np.zeros((K_OPS, n))     # drug levels per cell
        self.imm = A_BASE
        self.T = 0.0
        self.t = 0
        self.cumulative_reward = 0.0
        self.last_info = {}
        return self.observe()

    # ---------------- observation ----------------
    def observe(self):
        n = self.n
        x = np.zeros((N_CELLS, N_FEAT), dtype=np.float32)
        mask = np.zeros(N_CELLS, dtype=bool)
        x[:n, 0] = self.s
        x[:n, 1] = self.h
        x[:n, 2] = self.i
        x[:n, 3] = self.d
        x[:n, 4] = 1.0 - np.exp(-self.v)
        x[:n, 5:8] = self.coords
        x[:n, 8] = self.C.mean(0)
        x[:n, 9] = self.plddt
        mask[:n] = True
        ctx = np.concatenate([
            self.desc,
            self.C.mean(1),
            [self.t / EPISODE_STEPS, self.imm, self.T, self.h.mean()],
        ]).astype(np.float32)
        return x, mask, ctx

    # ---------------- dynamics ----------------
    def step(self, focus, cont):
        """focus: int cell index. cont: [K_OPS] squashed to [-1,1] by the caller.
        dose_k = ((a_k+1)/2)^2 so a zero action is a modest dose, not half-max."""
        n = self.n
        a = np.clip(np.asarray(cont, dtype=np.float64), -1.0, 1.0)
        dose = (((a + 1.0) / 2.0) ** 2) * self.op_mask
        focus = int(np.clip(int(focus), 0, n - 1))

        # --- drug pharmacokinetics: local ops deposit around the focus, global ops everywhere
        kern = np.exp(-0.5 * self.D2[focus] / (KERNEL_SIGMA ** 2))
        dep = np.where(IS_LOCAL[:, None], dose[:, None] * kern[None, :], dose[:, None] * np.ones((1, n)))
        self.C = np.clip(self.C * KEEP[:, None] + dep, 0.0, 1.0)
        self.T = self.T * 0.93 + float((TOX * dose).sum())

        C, r = self.C, self.r
        e = np.clip(EFF[:, None] * C * (1.0 - r[:, None]), 0.0, 0.95)   # effective effect per op per cell
        a_eff = float(np.clip(self.imm + 0.5 * EFF[2] * C[2].mean(), 0.0, 1.5))
        kill_rate = K_IMM * a_eff * (1.0 - r[2])                        # r[2] = immune evasion

        # --- virion spread, infection
        vs = self.v + DV * (self.A @ self.v - self.v)
        lam = BETA0 * self.inf_mult * (1.0 - e[0]) * self.s * vs * (1.0 - e[3])
        lam = lam * self.rng.lognormal(0.0, 0.1, n)
        new_inf = self.h * (1.0 - np.exp(-lam))

        # --- infected-cell loss
        imm_kill = self.i * (1.0 - math.exp(-kill_rate))
        lysis = self.i * DELTA
        cull = self.i * e[5] * 0.6
        loss = imm_kill + lysis + cull
        sc = np.where(loss > self.i, self.i / np.maximum(loss, 1e-12), 1.0)
        imm_kill, lysis, cull = imm_kill * sc, lysis * sc, cull * sc

        coll = self.h * 0.10 * C[5]                                      # cull collateral on healthy tissue
        td = self.h * 0.05 * max(0.0, self.T - TOX_THRESH)               # systemic toxicity damage
        reg = self.d * RHO

        h = self.h - new_inf + 0.5 * imm_kill + reg - coll - td
        i = self.i + new_inf - imm_kill - lysis - cull
        d = self.d + lysis + cull + 0.5 * imm_kill + coll + td - reg
        h, i, d = np.clip(h, 0, None), np.clip(i, 0, None), np.clip(d, 0, None)
        tot = np.maximum(h + i + d, 1e-9)
        self.h, self.i, self.d = h / tot, i / tot, d / tot

        # --- virion production / clearance
        prod = BURST * self.rep_mult * (1.0 - e[1]) * self.i
        v = vs * (1.0 - VDEC) * (1.0 - 0.5 * e[4]) * (1.0 - 0.15 * a_eff * (1.0 - r[2])) + prod - 0.5 * new_inf
        v = np.clip(v, 0.0, 5.0)
        if self.rng.random() < SPARK_P:
            v[int(self.rng.integers(n))] += 0.3
        self.v = v

        # --- immune system ramps with infection
        self.imm = float(np.clip(self.imm + 0.06 * min(1.0, self.i.mean() * 6.0) - 0.04 * (self.imm - A_BASE), 0.0, 1.0))

        # --- pathogen evolution (hidden): resistance rises under selection pressure
        pop = float(np.clip(5.0 * (self.i.mean() + 0.2 * self.v.mean()), 0.0, 1.0))
        w = self.i + 0.02
        w = w / w.sum()
        press = (C * w[None, :]).sum(1)
        press[2] = min(1.0, a_eff)
        self.r = np.clip((r + MU * pop * press * (1.0 - r) * self.rng.uniform(0.5, 1.5, K_OPS)) * (1.0 - RDECAY), 0.0, 0.97)

        # --- reward / termination
        self.t += 1
        mi, md, hf = float(self.i.mean()), float(self.d.mean()), float(self.h.mean())
        vm = float((1.0 - np.exp(-self.v)).mean())
        burden = mi + 0.5 * md + 0.1 * vm
        reward = -BURDEN_W * burden - DOSE_COST * float(dose.sum()) - TOX_COST * max(0.0, self.T - TOX_THRESH)

        eradicated = (mi < 0.003) and (float(self.v.mean()) < 0.01)
        failed = hf < FAIL_H
        terminated = bool(eradicated or failed)
        truncated = self.t >= EPISODE_STEPS
        if eradicated:
            reward += ERAD_BONUS * (1.0 + hf) - ERAD_TOX_W * self.T
        if failed:
            reward -= FAIL_PENALTY
        self.cumulative_reward += reward

        info = {
            "accession": self.rec.accession, "step": self.t, "focus": focus,
            "healthy": hf, "infected": mi, "dead": md, "virion": float(self.v.mean()),
            "burden": burden, "immune": self.imm, "toxicity": self.T,
            "doses": [float(x) for x in dose],
            "drug_level": [float(x) for x in C.mean(1)],
            "resistance": [float(x) for x in self.r],      # hidden state, logged for analysis only
            "eradicated": bool(eradicated), "failed": bool(failed),
        }
        self.last_info = info
        return self.observe(), float(reward), terminated, truncated, info

# ------------------------------------------------------------------------------
# 4. BITVISION-LIKE POLICY (cells as tokens)
# ------------------------------------------------------------------------------
class RMSNorm(nn.Module):
    def __init__(self, d, eps=1e-6):
        super().__init__()
        self.w = nn.Parameter(torch.ones(d)); self.eps = eps
    def forward(self, x):
        z = x.float()
        z = z * torch.rsqrt(z.pow(2).mean(-1, keepdim=True) + self.eps)
        return z.to(x.dtype) * self.w

class SelfAttention(nn.Module):
    def __init__(self, d, heads):
        super().__init__()
        self.heads = heads; self.hd = d // heads
        self.qkv = nn.Linear(d, 3 * d, bias=False)
        self.out = nn.Linear(d, d, bias=False)
    def forward(self, x, mask):
        B, T, C = x.shape
        qkv = self.qkv(x).view(B, T, 3, self.heads, self.hd).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)
        y = F.scaled_dot_product_attention(q, k, v, attn_mask=mask[:, None, None, :], dropout_p=0.0, is_causal=False)
        return self.out(y.transpose(1, 2).contiguous().view(B, T, C))

class SwiGLU(nn.Module):
    def __init__(self, d):
        super().__init__()
        h = int(math.ceil(d * MLP_MULT / 64) * 64)
        self.w1 = nn.Linear(d, h, bias=False); self.w2 = nn.Linear(d, h, bias=False); self.w3 = nn.Linear(h, d, bias=False)
    def forward(self, x):
        return self.w3(F.silu(self.w1(x)) * self.w2(x))

class Block(nn.Module):
    def __init__(self, d, heads):
        super().__init__()
        self.n1 = RMSNorm(d); self.attn = SelfAttention(d, heads)
        self.n2 = RMSNorm(d); self.mlp = SwiGLU(d)
    def forward(self, x, mask):
        x = x + self.attn(self.n1(x), mask)
        x = x + self.mlp(self.n2(x))
        return x * mask.unsqueeze(-1)

class BitGeometryEncoder(nn.Module):
    def __init__(self, feature_count, d):
        super().__init__()
        self.conv = nn.Sequential(nn.Conv1d(feature_count, 64, 3, padding=1), nn.GELU(),
                                  nn.Conv1d(64, 96, 3, padding=1), nn.GELU())
        self.proj = nn.Linear(96 * 8, d, bias=False)
        self.register_buffer("shifts", torch.arange(7, -1, -1, dtype=torch.uint8), persistent=False)
    def forward(self, x):
        B, T, Fd = x.shape
        q = ((x.clamp(-2, 2) + 2.0) / 4.0 * 255.0).round().clamp(0, 255).to(torch.uint8)
        bits = ((q.unsqueeze(-1) >> self.shifts) & 1).float()
        z = self.conv(bits.reshape(B * T, Fd, 8))
        return self.proj(z.reshape(B * T, 96 * 8)).view(B, T, -1)

class CrossFuse(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.gate = nn.Linear(2 * d, d, bias=False)
        self.to_a = nn.Linear(d, d, bias=False); self.to_b = nn.Linear(d, d, bias=False)
        self.aa = nn.Parameter(torch.tensor(.10)); self.ab = nn.Parameter(torch.tensor(.10))
    def forward(self, a, b):
        g = torch.sigmoid(self.gate(torch.cat([a, b], -1)))
        m = g * a + (1 - g) * b
        return a + self.aa * self.to_a(m), b + self.ab * self.to_b(m)

class FinalMixer(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.mix = nn.Sequential(nn.Linear(4 * d, 2 * d, bias=False), nn.SiLU(), nn.Linear(2 * d, d, bias=False))
        self.alpha = nn.Parameter(torch.tensor(.05))
    def forward(self, a, b):
        return .5 * (a + b) + self.alpha * self.mix(torch.cat([a, b, a * b, (a - b).abs()], -1))

class BitVisionCellPolicy(nn.Module):
    def __init__(self):
        super().__init__()
        d = D_MODEL
        self.raw = nn.Sequential(nn.Linear(N_FEAT, d, bias=False), nn.GELU(), nn.Linear(d, d, bias=False))
        self.geo = BitGeometryEncoder(N_FEAT, d)
        self.pos = nn.Parameter(torch.randn(1, N_CELLS, d) * .01)
        self.ctx = nn.Sequential(nn.Linear(CTX_DIM, d), nn.GELU(), nn.Linear(d, d))
        self.a = nn.ModuleList([Block(d, HEADS) for _ in range(DEPTH)])
        self.b = nn.ModuleList([Block(d, HEADS) for _ in range(DEPTH)])
        self.fuse = nn.ModuleList([CrossFuse(d) for _ in range(DEPTH)])
        self.mix = FinalMixer(d)
        self.norm = RMSNorm(d)
        self.focus_head = nn.Sequential(nn.Linear(2 * d, 128), nn.GELU(), nn.Linear(128, 1))
        self.actor = nn.Sequential(nn.Linear(d, 256), nn.GELU(), nn.Linear(256, K_OPS))
        self.critic = nn.Sequential(nn.Linear(d, 256), nn.GELU(), nn.Linear(256, 1))
        self.logstd = nn.Parameter(torch.full((K_OPS,), -0.6))

    def encode_tokens(self, x, mask, ctx):
        mf = mask.float()
        a = self.raw(x) + self.pos[:, :x.size(1)]
        b = self.geo(x) + self.pos[:, :x.size(1)]
        c = self.ctx(ctx).unsqueeze(1)
        a = (a + c) * mf.unsqueeze(-1)
        b = (b + c) * mf.unsqueeze(-1)
        for ba, bb, f in zip(self.a, self.b, self.fuse):
            a = ba(a, mask); b = bb(b, mask)
            a, b = f(a, b)
            a = a * mf.unsqueeze(-1); b = b * mf.unsqueeze(-1)
        return self.norm(self.mix(a, b))

    def forward(self, x, mask, ctx):
        with torch.autocast(device_type=x.device.type, dtype=torch.bfloat16, enabled=USE_BF16):
            tok = self.encode_tokens(x, mask, ctx)
        tok = tok.float()
        mf = mask.float().unsqueeze(-1)
        pooled = (tok * mf).sum(1) / mf.sum(1).clamp_min(1)
        pe = pooled.unsqueeze(1).expand_as(tok)
        focus_logits = self.focus_head(torch.cat([tok, pe], -1)).squeeze(-1).masked_fill(~mask, -1e9)
        mean = self.actor(pooled)
        value = self.critic(pooled).squeeze(-1)
        std = self.logstd.exp().expand_as(mean)
        return focus_logits, mean, std, value

policy = BitVisionCellPolicy().to(DEVICE)
optimizer = torch.optim.AdamW(policy.parameters(), lr=LR, weight_decay=.01)
print("policy parameters:", f"{sum(p.numel() for p in policy.parameters()):,}")

# ------------------------------------------------------------------------------
# 5. PPO HELPERS
# ------------------------------------------------------------------------------
envs = [BitVisionCellEnv(stream) for _ in range(N_ENVS)]
states = [e.observe() for e in envs]

def batch_states(states):
    x = torch.from_numpy(np.stack([s[0] for s in states])).to(DEVICE)
    m = torch.from_numpy(np.stack([s[1] for s in states])).to(DEVICE)
    c = torch.from_numpy(np.stack([s[2] for s in states])).to(DEVICE)
    return x, m, c

def _logp_entropy(focus_logits, mean, std, focus, raw):
    fd = Categorical(logits=focus_logits)
    gd = Normal(mean, std)
    jac = torch.log(1 - torch.tanh(raw).pow(2) + 1e-6).sum(-1)
    return fd.log_prob(focus) + gd.log_prob(raw).sum(-1) - jac, fd.entropy() + gd.entropy().sum(-1)

def act(states, deterministic=False):
    x, m, c = batch_states(states)
    with torch.no_grad():
        fl, mean, std, value = policy(x, m, c)
        if deterministic:
            focus = fl.argmax(-1); raw = mean
        else:
            focus = Categorical(logits=fl).sample(); raw = Normal(mean, std).sample()
        logp, _ = _logp_entropy(fl, mean, std, focus, raw)
    return focus.cpu().numpy(), raw.cpu().numpy(), logp.cpu(), value.cpu()

def evaluate_actions(x, m, c, focus, raw):
    fl, mean, std, value = policy(x, m, c)
    logp, ent = _logp_entropy(fl, mean, std, focus, raw)
    return logp, ent, value

def save_playback(update):
    env = BitVisionCellEnv(stream)
    state = env.observe()
    frames, total = [], 0.0
    for t in range(EPISODE_STEPS):
        f, raw, _, _ = act([state], deterministic=True)
        state, r, term, trunc, info = env.step(int(f[0]), np.tanh(raw[0]))
        total += r
        fr = {**info, "reward": float(r), "cumulative_reward": float(total)}
        if t % 2 == 0:   # cell maps every 2nd step, for replay visualization
            fr["infected_map"] = [round(float(z), 3) for z in env.i]
            fr["dead_map"] = [round(float(z), 3) for z in env.d]
        frames.append(fr)
        if term or trunc:
            break
    payload = {
        "version": "BitVision-Cell-v0.2", "update": update,
        "accession": env.rec.accession, "source_url": env.rec.source_url,
        "op_names": OP_NAMES, "n_cells": env.n,
        "cell_coords": [[round(float(z), 3) for z in row] for row in env.coords],
        "episode_steps": len(frames), "total_reward": float(total),
        "final_healthy": frames[-1]["healthy"], "final_infected": frames[-1]["infected"],
        "eradicated": frames[-1]["eradicated"], "failed": frames[-1]["failed"],
        "frames": frames,
    }
    p = EP_DIR / f"episode_{update:06d}.json"
    p.write_text(json.dumps(payload))
    return payload, p

# ------------------------------------------------------------------------------
# 6. TRAIN
# ------------------------------------------------------------------------------
episode_counter = 0
recent_returns, recent_erad, recent_fail, recent_healthy = [], [], [], []
start_all = time.time()

for update in range(1, UPDATES + 1):
    obs_buf, mask_buf, ctx_buf, foc_buf, act_buf, logp_buf = [], [], [], [], [], []
    rew_buf, done_buf, val_buf = [], [], []

    for t in range(ROLLOUT_STEPS):
        focus, raw, logp, values = act(states, deterministic=False)
        obs_buf.append(np.stack([s[0] for s in states]))
        mask_buf.append(np.stack([s[1] for s in states]))
        ctx_buf.append(np.stack([s[2] for s in states]))
        foc_buf.append(focus); act_buf.append(raw)
        logp_buf.append(logp.numpy()); val_buf.append(values.numpy())

        squashed = np.tanh(raw)
        rews, dones, next_states = [], [], []
        for i, env in enumerate(envs):
            ns, r, term, trunc, info = env.step(int(focus[i]), squashed[i])
            done = term or trunc
            rews.append(r); dones.append(done)
            if done:
                episode_counter += 1
                recent_returns.append(env.cumulative_reward)
                recent_erad.append(float(info["eradicated"]))
                recent_fail.append(float(info["failed"]))
                recent_healthy.append(info["healthy"])
                ns = env.reset()
            next_states.append(ns)
        rew_buf.append(np.asarray(rews, np.float32))
        done_buf.append(np.asarray(dones, np.float32))
        states = next_states

    _, _, _, next_values = act(states, deterministic=True)
    next_values = next_values.numpy()

    rewards = np.stack(rew_buf); dones = np.stack(done_buf)
    values = np.stack(val_buf); old_logp = np.stack(logp_buf)

    adv = np.zeros_like(rewards, np.float32)
    last = np.zeros(N_ENVS, np.float32)
    for t in reversed(range(ROLLOUT_STEPS)):
        nv = next_values if t == ROLLOUT_STEPS - 1 else values[t + 1]
        nonterminal = 1.0 - dones[t]
        delta = rewards[t] + GAMMA * nv * nonterminal - values[t]
        last = delta + GAMMA * GAE_LAMBDA * nonterminal * last
        adv[t] = last
    returns = adv + values
    adv = (adv - adv.mean()) / (adv.std() + 1e-8)

    X = torch.from_numpy(np.concatenate(obs_buf, 0)).to(DEVICE)
    M = torch.from_numpy(np.concatenate(mask_buf, 0)).to(DEVICE)
    C = torch.from_numpy(np.concatenate(ctx_buf, 0)).to(DEVICE)
    FOC = torch.from_numpy(np.concatenate(foc_buf, 0)).long().to(DEVICE)
    A = torch.from_numpy(np.concatenate(act_buf, 0)).to(DEVICE)
    OLDLP = torch.from_numpy(old_logp.reshape(-1)).to(DEVICE)
    ADV = torch.from_numpy(adv.reshape(-1)).to(DEVICE)
    RET = torch.from_numpy(returns.reshape(-1)).to(DEVICE)

    n = X.size(0)
    losses, ratio_dev = [], []
    for _epoch in range(PPO_EPOCHS):
        perm = torch.randperm(n, device=DEVICE)
        for s in range(0, n, MINIBATCH):
            ix = perm[s:s + MINIBATCH]
            lp, ent, v = evaluate_actions(X[ix], M[ix], C[ix], FOC[ix], A[ix])
            ratio = (lp - OLDLP[ix]).exp()
            p1 = ratio * ADV[ix]
            p2 = ratio.clamp(1 - CLIP_EPS, 1 + CLIP_EPS) * ADV[ix]
            loss = -torch.min(p1, p2).mean() + VALUE_COEF * F.smooth_l1_loss(v, RET[ix]) - ENTROPY_COEF * ent.mean()
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(policy.parameters(), MAX_GRAD_NORM)
            optimizer.step()
            losses.append(float(loss.detach().cpu()))
            if _epoch == 0 and s == 0:
                ratio_dev.append(float((ratio.detach() - 1).abs().mean().cpu()))

    recent_returns = recent_returns[-200:]; recent_erad = recent_erad[-200:]
    recent_fail = recent_fail[-200:]; recent_healthy = recent_healthy[-200:]

    if update % 5 == 0 or update == 1:
        nan = float("nan")
        print(
            f"update={update:5d} episodes={episode_counter:6d} loss={np.mean(losses):8.4f} "
            f"return={np.mean(recent_returns) if recent_returns else nan:8.3f} "
            f"erad={100*np.mean(recent_erad) if recent_erad else nan:5.1f}% "
            f"fail={100*np.mean(recent_fail) if recent_fail else nan:5.1f}% "
            f"healthy={100*np.mean(recent_healthy) if recent_healthy else nan:5.1f}% "
            f"|ratio-1|={np.mean(ratio_dev):.4f} elapsed={(time.time()-start_all)/60:6.1f}m",
            flush=True)

    if update % SAVE_EVERY == 0:
        ckpt = {
            "version": "BitVision-Cell-v0.2", "update": update,
            "model": policy.state_dict(), "optimizer": optimizer.state_dict(),
            "config": {"n_cells": N_CELLS, "n_feat": N_FEAT, "k_ops": K_OPS, "ctx_dim": CTX_DIM,
                       "d_model": D_MODEL, "heads": HEADS, "depth": DEPTH,
                       "episode_steps": EPISODE_STEPS, "op_names": OP_NAMES},
            "alphafold_accessions": AF_STREAM_IDS,
            "training_data_note": "AlphaFold structures seed an abstract tissue; hardcoded pathogen/cell rules; "
                                  "no AlphaGenome outputs. Simulator proxies only, not biological efficacy.",
        }
        cp = CKPT_DIR / f"checkpoint_{update:06d}.pt"
        torch.save(ckpt, cp)
        pb, ep_path = save_playback(update)
        print("checkpoint:", cp)
        print("playback:", ep_path)
        print(f"playback result: {pb['accession']} steps={pb['episode_steps']} reward={pb['total_reward']:.2f} "
              f"healthy={pb['final_healthy']*100:.1f}% infected={pb['final_infected']*100:.2f}% "
              f"eradicated={pb['eradicated']} failed={pb['failed']}")

# ------------------------------------------------------------------------------
# 7. ABLATION ANALYSIS: which mechanisms does the learned intervention rely on?
# ------------------------------------------------------------------------------
def run_eval(op_mask=None, treat=True, n_ep=32, seed0=10_000):
    """Paired evaluation: identical seeds (same proteins, strains, foci, noise) across variants."""
    es = []
    for e in range(n_ep):
        random.seed(seed0 + e)
        env = BitVisionCellEnv(stream)
        if op_mask is not None:
            env.op_mask = np.asarray(op_mask, dtype=np.float64)
        es.append(env)
    sts = [env.observe() for env in es]
    done = [False] * n_ep
    dose_sum = np.zeros((n_ep, K_OPS)); steps = np.zeros(n_ep)
    final = [None] * n_ep
    for t in range(EPISODE_STEPS):
        if all(done):
            break
        if treat:
            focus, raw, _, _ = act(sts, deterministic=True)
            cont = np.tanh(raw)
        else:
            focus = np.zeros(n_ep, dtype=int); cont = -np.ones((n_ep, K_OPS))
        for i, env in enumerate(es):
            if done[i]:
                continue
            ns, r, term, trunc, info = env.step(int(focus[i]), cont[i])
            sts[i] = ns
            dose_sum[i] += np.asarray(info["doses"]); steps[i] += 1
            final[i] = info
            if term or trunc:
                done[i] = True
    return {
        "return": float(np.mean([env.cumulative_reward for env in es])),
        "eradicated_pct": 100 * float(np.mean([f["eradicated"] for f in final])),
        "failed_pct": 100 * float(np.mean([f["failed"] for f in final])),
        "final_healthy_pct": 100 * float(np.mean([f["healthy"] for f in final])),
        "final_infected_pct": 100 * float(np.mean([f["infected"] for f in final])),
        "mean_dose_per_step": [float(x) for x in (dose_sum.sum(0) / np.maximum(steps.sum(), 1))],
    }

print()
print("=" * 96)
print("ABLATION ANALYSIS (deterministic policy, paired seeds)")
print("=" * 96)
policy.eval()
results = {"no_treatment": run_eval(treat=False), "full_policy": run_eval()}
for k, name in enumerate(OP_NAMES):
    mask = np.ones(K_OPS); mask[k] = 0.0
    results[f"without_{name}"] = run_eval(op_mask=mask)

def row(label, r):
    return (f"{label:<28s} return={r['return']:8.2f}  erad={r['eradicated_pct']:5.1f}%  "
            f"fail={r['failed_pct']:5.1f}%  healthy={r['final_healthy_pct']:5.1f}%  infected={r['final_infected_pct']:5.2f}%")

print(row("no treatment", results["no_treatment"]))
print(row("full policy", results["full_policy"]))
base_ret = results["full_policy"]["return"]
for k, name in enumerate(OP_NAMES):
    r = results[f"without_{name}"]
    print(row(f"  minus {name}", r) + f"  drop={base_ret - r['return']:+7.2f}")
print()
print("mean dose per step by mechanism (full policy):")
for name, dz in zip(OP_NAMES, results["full_policy"]["mean_dose_per_step"]):
    print(f"  {name:<22s} {dz:.3f}")
(BASE / "ablation_analysis.json").write_text(json.dumps(results, indent=2))

print()
print("=" * 96)
print("TRAINING COMPLETE")
print("=" * 96)
print("checkpoints:", CKPT_DIR); print("episodes:", EP_DIR)
print("analysis:", BASE / "ablation_analysis.json")
print("NOTE: all outcomes are properties of hand-written simulator rules, not biological efficacy.")
