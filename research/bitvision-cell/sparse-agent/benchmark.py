#!/usr/bin/env python3
"""Real BitVision-Cell v0.2 ONNX policy versus sparse residual agent. SIMULATED ONLY."""
import ast, copy, hashlib, json, math, random, re, time, urllib.request
from pathlib import Path
from types import SimpleNamespace
import numpy as np

ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/"research/bitvision-cell/v0.2/bitvision_cell_v02.py"
HTML=ROOT/"public/bitvision-cell-live.html"
URL="https://geksacqthxorbnrygxul.supabase.co/storage/v1/object/public/bitvision-models/bitvision-cell/v02/bitvision_cell_v02_update500_fp32.onnx"
HASH="8f95be67f3e27355bcde14a7696453459578ab75520153df0ac0b3444457fb3f"
TERMS=[()]+[(i,) for i in range(6)]+[(i,j) for i in range(6) for j in range(i+1,6)]

def simulator():
    tree=ast.parse(SOURCE.read_text())
    chosen=[];active=False; klass=None
    config={"EPISODE_STEPS","N_CELLS","N_FEAT","K_OPS","DESC_DIM","CTX_DIM"}
    for node in tree.body:
        if isinstance(node,ast.Assign):
            names=[t.id for t in node.targets if isinstance(t,ast.Name)]
            if "OP_NAMES" in names: active=True
            if active or any(x in config for x in names):chosen.append(node)
        if isinstance(node,ast.ClassDef) and node.name=="BitVisionCellEnv":
            klass=node;break
    if klass is None:raise RuntimeError("Missing real simulator implementation")
    ns={"np":np,"math":math,"random":random}
    exec(compile(ast.fix_missing_locations(ast.Module(body=chosen+[klass],type_ignores=[])),str(SOURCE),"exec"),ns)
    return ns["BitVisionCellEnv"]

def structure():
    data=HTML.read_text()
    match=re.search(r"const STRUCT=(\{[^\n]*\});",data)
    if match is None:raise RuntimeError("No P28482 browser geometry")
    s=json.loads(match.group(1));n=s["n"]
    features=np.zeros((n,10),dtype=np.float64)
    features[:,0]=0.5 # original amino acid encoding unavailable in browser artifact
    features[:,4]=s["plddt"];features[:,5]=s["density"]
    record=SimpleNamespace(base_features=features,coords=np.asarray(s["coords"],dtype=np.float64),
      accession=s["accession"],source_url="Published P28482 browser geometry")
    class Stream:
        def sample(self):return record
    return Stream()

def load_checkpoint():
    import onnxruntime as ort
    path=Path("/tmp/gic-bitvision-cell-update500.onnx")
    if not path.exists():
        with urllib.request.urlopen(URL,timeout=90) as resp,open(path,"wb") as out:
            while True:
                block=resp.read(1024*1024)
                if not block:break
                out.write(block)
    sha=hashlib.sha256(path.read_bytes()).hexdigest()
    if sha!=HASH:raise RuntimeError("ONNX checksum mismatch "+sha)
    sess=ort.InferenceSession(str(path),providers=["CPUExecutionProvider"])
    if set(i.name for i in sess.get_inputs())!={"x","mask","ctx"}:raise RuntimeError("Unexpected ONNX inputs")
    return sess,sha

def policy(sess,env):
    x,mask,ctx=env.observe()
    logits,means,value=sess.run(["focus_logits","action_mean","value"],{
      "x":x[None].astype(np.float32),"mask":mask[None].astype(bool),"ctx":ctx[None].astype(np.float32)})
    return int(np.argmax(logits[0])),np.tanh(means[0].astype(float)),float(np.ravel(value)[0])

def basis(mask):
    return np.array([np.prod([1-2*((mask>>i)&1) for i in S]) for S in TERMS],dtype=float)

def omp(X,y,maximum=8):
    selected=[0];beta=np.linalg.lstsq(X[:,selected],y,rcond=None)[0]
    while len(selected)<maximum:
        residual=y-X[:,selected]@beta
        corr=np.abs(X.T@residual);corr[selected]=-1
        idx=int(np.argmax(corr))
        if corr[idx]<1e-10:break
        selected.append(idx)
        beta=np.linalg.lstsq(X[:,selected],y,rcond=None)[0]
    return selected,beta

def action(base,mask):
    return np.clip(base+0.45*np.array([1 if mask>>i&1 else -1 for i in range(6)]),-1,1)

def counterfactual(env,focus,cont):
    duplicate=copy.deepcopy(env)
    return float(duplicate.step(focus,cont)[1])

def calibrate(env,focus,base,seed):
    rng=np.random.default_rng(seed)
    masks=rng.choice(64,size=40,replace=False)
    X=np.stack([basis(int(k)) for k in masks])
    y=np.array([counterfactual(env,focus,action(base,int(k))) for k in masks])
    chosen,beta=omp(X[:30],y[:30])
    pred=X[30:,chosen]@beta
    rmse=float(np.sqrt(np.mean((pred-y[30:])**2)))
    const_rmse=float(np.sqrt(np.mean((y[:30].mean()-y[30:])**2)))
    scores=np.stack([basis(k) for k in range(64)])[:,chosen]@beta
    best=int(np.argmax(scores))
    true_base=counterfactual(env,focus,base)
    true_best=counterfactual(env,focus,action(base,best))
    return {"mask":best,"baseline_one_step":true_base,"best_one_step":true_best,
      "holdout_rmse":rmse,"constant_rmse":const_rmse,"terms":len(chosen),
      "sparse_message":{"basis":"walsh_residual_action","n_train":30,"n_test":10,
        "coeffs":[{"S":list(TERMS[i]),"c":round(float(c),7)} for i,c in zip(chosen,beta)]}}

def run(Env,stream,sess,seed,use_sparse,max_steps=100):
    random.seed(seed);env=Env(stream)
    scans=[];changes=0;probe_steps=0;last=None
    start=time.time()
    for t in range(max_steps):
        focus,base,_=policy(sess,env)
        chosen=base
        if use_sparse and t%20==0:
            fit=calibrate(env,focus,base,seed*1000+t)
            scans.append({"step":t,**fit})
            probe_steps+=42
            # PRIVILEGED one-step counterfactual gate: research diagnostic only!
            if fit["best_one_step"]>fit["baseline_one_step"]+0.02:
                chosen=action(base,fit["mask"]);changes+=1
        _,_,term,trunc,info=env.step(focus,chosen)
        last=info
        if term or trunc:break
    return {"variant":"sparse_residual" if use_sparse else "frozen_ppo",
      "seed":seed,"return":round(float(env.cumulative_reward),6),"steps":env.t,
      "eradicated":bool(last["eradicated"]),"failed":bool(last["failed"]),
      "healthy":float(last["healthy"]),"toxicity":float(last["toxicity"]),
      "changes":changes,"probe_env_steps":probe_steps,
      "elapsed_seconds":round(time.time()-start,2),"calibrations":scans}

def main():
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument("--seeds",type=int,default=3)
    ap.add_argument("--max-steps",type=int,default=100)
    ap.add_argument("--out",default="bitvision_sparse_results.json")
    a=ap.parse_args()
    Env=simulator();stream=structure();session,sha=load_checkpoint()
    runs=[]
    for j in range(a.seeds):
        seed=31001+j
        for sparse in [False,True]:
            row=run(Env,stream,session,seed,sparse,a.max_steps)
            runs.append(row)
            print(row["variant"],seed,"return",row["return"],"steps",row["steps"],"changes",row["changes"],flush=True)
    deltas=[runs[2*i+1]["return"]-runs[2*i]["return"] for i in range(a.seeds)]
    report={"status":"SIMULATED","model":"real GIC BitVision-Cell v0.2 update-500 ONNX",
      "sha256":sha,"seeds":a.seeds,"paired_return_deltas":deltas,
      "mean_paired_delta":float(np.mean(deltas)),"episodes":runs,
      "protocol":"Real ONNX PPO vs sparse Walsh OMP one-step residual, 30 train/10 heldout, 8 terms, calibrate every 20 steps; 3 paired initial seeds.",
      "limitations":["Synthetic simulator only, not biological evidence.",
        "Published P28482 browser geometry reused; missing original amino-acid feature approximated as 0.5.",
        "Counterfactual simulator queries and an exact one-step gate are PRIVILEGED ORACLE access: this is NOT a deployable general agent.",
        "Identical initial seeds do not force identical future stochastic trajectories after policy actions diverge.",
        "Probe calls cost environment computation and are counted separately; this is not an online-regret guarantee."]}
    Path(a.out).write_text(json.dumps(report,indent=2))
    print("RESULT_FILE="+str(Path(a.out).resolve()),flush=True)
    print("MEAN_PAIRED_DELTA="+str(report["mean_paired_delta"]),flush=True)
if __name__=="__main__":main()
