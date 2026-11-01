#!/usr/bin/env python3
"""Persistent sparse dynamics for the published synthetic BitVision-Cell environment.

Frozen ONNX PPO is the baseline. Sparse world-model parameters are learned from
observed transitions, stored across episodes, and promoted only after a paired
out-of-sample evaluation. This does not train ONNX weights and is not AGI.
"""
import argparse, json, math, random, time
from pathlib import Path
import numpy as np
from benchmark import simulator, structure, load_checkpoint, policy, apply_stress

N_STATE=13
N_ACTION=6
N_FEATURE=1+N_STATE+N_ACTION+3*N_ACTION+15
N_TARGET=N_STATE+1
MODEL_VERSION="bitvision-sparse-dynamics-v1"
OPS=["entry_block","replication_inhibit","immune_boost","cell_shield","virion_clearance","infected_cull"]

def observation_state(obs):
    x,mask,ctx=obs
    active=x[mask.astype(bool)]
    return np.asarray([
        float(active[:,1].mean()), # healthy
        float(active[:,2].mean()), # infected
        float(active[:,3].mean()), # dead
        float(active[:,4].mean()), # virion proxy (bounded)
        *[float(q) for q in ctx[8:14]], # drug load 6
        float(ctx[14]),float(ctx[15]),float(ctx[16]) # time, immune, toxicity
    ],dtype=float)

def phi(state,dose):
    # Bounded structured basis: states, interventions, context-dependent effects
    s=np.asarray(state,dtype=float);d=np.asarray(dose,dtype=float)
    return np.asarray([1.0,*s,*d,
        *[d[k]*s[j] for j in (1,3,12) for k in range(6)],
        *[d[i]*d[j] for i in range(6) for j in range(i+1,6)]],dtype=float)

def doses(cont):
    a=np.clip(np.asarray(cont,dtype=float),-1,1)
    return ((a+1)/2)**2

def next_pred(s,d,coef):
    f=phi(s,d)
    target=f@coef
    nxt=np.asarray(s)+target[:-1]
    nxt[:4]=np.clip(nxt[:4],0,1)
    nxt[4:10]=np.clip(nxt[4:10],0,1)
    nxt[10]=np.clip(nxt[10],0,1.1)
    nxt[11]=np.clip(nxt[11],0,1.5)
    nxt[12]=np.clip(nxt[12],0,20)
    return nxt,float(target[-1])

def variant_actions(base):
    # Stay near the frozen PPO action; sparse planner can abstain.
    vals=[np.asarray(base,dtype=float)]
    for i in range(6):
        for change in (-0.12,0.12):
            a=np.asarray(base,dtype=float).copy()
            a[i]=np.clip(a[i]+change,-1,1)
            vals.append(a)
    return vals

class Memory:
    def __init__(self,path,checkpoint_hash,lam=10.0):
        self.path=Path(path)
        self.sha=checkpoint_hash
        self.lam=float(lam)
        self.xtx=np.zeros((N_FEATURE,N_FEATURE),dtype=float)
        self.xty=np.zeros((N_FEATURE,N_TARGET),dtype=float)
        self.examples=0
        self.episodes=0
        self.champion={"type":"ppo","promotion_step":0}
        self.history=[]
        if self.path.exists():
            data=json.loads(self.path.read_text())
            if data["version"]!=MODEL_VERSION or data["checkpoint_sha256"]!=checkpoint_hash:
                raise ValueError("Persistent learner state is for another model/schema; refusing reuse")
            self.xtx=np.array(data["xtx"],dtype=float)
            self.xty=np.array(data["xty"],dtype=float)
            self.examples=int(data["examples"])
            self.episodes=int(data["episodes"])
            self.champion=data.get("champion",self.champion)
            self.history=data.get("history",[])
            if self.xtx.shape!=(N_FEATURE,N_FEATURE) or self.xty.shape!=(N_FEATURE,N_TARGET):
                raise ValueError("Corrupt persistent state dimensions")
    def add(self,s,act,nxt,reward):
        f=phi(s,doses(act))
        y=np.r_[np.asarray(nxt)-np.asarray(s),float(reward)]
        self.xtx+=np.outer(f,f)
        self.xty+=np.outer(f,y)
        self.examples+=1
    def fit(self):
        # Ridge + sparsification. The intercept is unpenalized; never claim
        # exact structural support from thresholding correlated columns.
        reg=self.lam*np.eye(N_FEATURE);reg[0,0]=0.001
        c=np.linalg.solve(self.xtx+reg,self.xty)
        c[np.abs(c)<0.0005]=0
        return c
    def save(self):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        obj={"version":MODEL_VERSION,"checkpoint_sha256":self.sha,
             "xtx":self.xtx.tolist(),"xty":self.xty.tolist(),
             "examples":self.examples,"episodes":self.episodes,
             "champion":self.champion,"history":self.history[-25:]}
        tmp=self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(obj,separators=(",",":")))
        tmp.replace(self.path)

def choose(base,s,coef,examples,confidence,threshold=0.03):
    if examples<120 or confidence<=0 or coef is None:
        return base,False,0.0
    controls=variant_actions(base)
    base_d=doses(base)
    def estimate(a):
        state=np.asarray(s).copy();total=0.0
        for h in range(3):
            d=doses(a) if h==0 else base_d
            state,reward=next_pred(state,d,coef)
            total+=0.985**h*reward
            # Discourage model exploitation outside seen action manifold.
        return total
    values=np.array([estimate(a) for a in controls])
    idx=int(np.argmax(values))
    improvement=float(values[idx]-values[0])
    # Required advantage scales with model's held-out error.
    min_adv=max(threshold,3*confidence)
    return (controls[idx],True,improvement) if idx and improvement>min_adv else (base,False,improvement)

def rollout(Env,stream,sess,seed,model=None,examples=0,confidence=0,
            stress=True,exploration=0.0,memory=None,max_steps=100):
    random.seed(seed)
    env=Env(stream)
    if stress:apply_stress(env,seed)
    rng=np.random.default_rng(seed+1_000_003)
    record={"seed":seed,"stress":bool(stress),"changes":0,"n_steps":0}
    for step in range(max_steps):
        obs=env.observe()
        state=observation_state(obs)
        focus,base,_=policy(sess,env)
        if exploration:
            control=np.clip(base+rng.normal(0,exploration,6),-1,1)
        elif model is not None:
            control,change,_=choose(base,state,model,examples,confidence)
            record["changes"]+=int(change)
        else:
            control=base
        nxt,reward,term,trunc,info=env.step(focus,control)
        if memory is not None:
            memory.add(state,control,observation_state(nxt),reward)
        record["n_steps"]+=1
        if term or trunc:break
    record.update({"return":float(env.cumulative_reward),"failed":bool(info["failed"]),
        "eradicated":bool(info["eradicated"]),"healthy":float(info["healthy"]),
        "toxicity":float(info["toxicity"])})
    return record

def evaluate(Env,stream,sess,coef,examples,confidence,seeds):
    results=[]
    for seed in seeds:
        base=rollout(Env,stream,sess,seed,stress=True)
        agent=rollout(Env,stream,sess,seed,model=coef,examples=examples,
                      confidence=confidence,stress=True)
        results.append({"seed":seed,"ppo":base,"learner":agent,
                        "delta":agent["return"]-base["return"]})
    deltas=np.array([r["delta"] for r in results])
    lower=float(deltas.mean()-(2.262 if len(seeds)==10 else 1.96)*deltas.std(ddof=1)/np.sqrt(len(seeds)))
    failures0=sum(r["ppo"]["failed"] for r in results)
    failures1=sum(r["learner"]["failed"] for r in results)
    promotion=bool(lower>0 and failures1<=failures0 and
                   any(r["learner"]["changes"]>0 for r in results))
    return {"mean_delta":float(deltas.mean()),"lower_bound":lower,
        "baseline_failures":failures0,"learner_failures":failures1,
        "promote":promotion,"pairs":results}

def heldout_error(memory,Env,stream,sess,seed):
    # Truly separate probes: collect independent transitions without updating memory.
    random.seed(seed);env=Env(stream);apply_stress(env,seed)
    rng=np.random.default_rng(seed+2)
    coef=memory.fit()
    errors=[]
    for _ in range(35):
        obs=env.observe();s=observation_state(obs)
        focus,base,_=policy(sess,env)
        a=np.clip(base+rng.normal(0,0.08,6),-1,1)
        nxt,reward,term,trunc,_=env.step(focus,a)
        _,pred=next_pred(s,doses(a),coef)
        errors.append((pred-reward)**2)
        if term or trunc:break
    return float(np.sqrt(np.mean(errors))) if errors else float("inf")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--memory",default="bitvision_learner_memory.json")
    p.add_argument("--report",default="bitvision_continual_report.json")
    p.add_argument("--train-episodes",type=int,default=20)
    p.add_argument("--eval-seeds",type=int,default=10)
    p.add_argument("--epoch",type=int,default=0)
    a=p.parse_args()
    Env=simulator();stream=structure();sess,sha=load_checkpoint()
    memory=Memory(a.memory,sha)
    before={"episodes":memory.episodes,"examples":memory.examples,"champion":memory.champion}
    for k in range(a.train_episodes):
        seed=50_000+memory.episodes
        e=rollout(Env,stream,sess,seed,stress=True,exploration=0.07,memory=memory)
        memory.episodes+=1
        if (k+1)%5==0:
            memory.save()
            print("learned episodes",memory.episodes,"examples",memory.examples,flush=True)
    coeff=memory.fit()
    conf=heldout_error(memory,Env,stream,sess,seed=87_000+a.epoch*100)
    seeds=list(range(80_000+a.epoch*1000,80_000+a.epoch*1000+a.eval_seeds))
    verdict=evaluate(Env,stream,sess,coeff,memory.examples,conf,seeds)
    if verdict["promote"]:
        memory.champion={"type":"sparse_mpc","promotion_step":memory.episodes,
          "heldout_rmse":conf,"mean_delta":verdict["mean_delta"],
          "lower_bound":verdict["lower_bound"]}
    # Failed candidates keep frozen PPO as champion; still retain learned
    # experience for future improvement attempts.
    memory.history.append({"epoch":a.epoch,"episodes":memory.episodes,
       "examples":memory.examples,"rmse":conf,"mean_delta":verdict["mean_delta"],
       "lower_bound":verdict["lower_bound"],"promoted":verdict["promote"]})
    memory.save()
    report={"status":"SIMULATED_ONLY","model":"BitVision-Cell real update-500 ONNX",
      "checkpoint_sha256":sha,"before":before,
      "after":{"episodes":memory.episodes,"examples":memory.examples,
               "champion":memory.champion,"nonzero_coefficients":int(np.count_nonzero(coeff)),
               "total_coefficients":int(coeff.size)},
      "heldout_one_step_rmse":conf,"evaluation":verdict,
      "design":"Persistent sparse ridge dynamics; 3-step model-based candidate lookahead; cautious promotion based on independent paired episodes.",
      "caveats":["Published P28482 geometry used with approximate amino acid feature in standalone simulator",
         "Short-horizon aggregate model is not a full POMDP or the complete G++ architecture",
         "Evaluation has correlated same-seed branching and small sample size",
         "Training uses safe-magnitude random intervention perturbations, synthetic simulator only",
         "No guarantee of continual performance improvement; failed candidates are rejected",
         "The ONNX policy remains frozen."]}
    Path(a.report).write_text(json.dumps(report,indent=2))
    print("RESULT",json.dumps({k:report[k] for k in ("before","after","heldout_one_step_rmse")}),flush=True)
    print("EVAL",json.dumps({k:verdict[k] for k in ("mean_delta","lower_bound","baseline_failures","learner_failures","promote")}),flush=True)
if __name__=="__main__":main()
