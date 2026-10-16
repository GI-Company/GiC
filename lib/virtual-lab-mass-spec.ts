// Deterministic precursor isotope-envelope calculator. No fragmentation or sample identification.
// Natural-abundance isotope values are approximations suitable for an educational simulation.
export type ElementSymbol = 'C' | 'H' | 'N' | 'O';
export type IsotopePeak = {
  nominal_shift: number;
  mz: number;
  relative_intensity: number;
  probability: number;
};
export type MassSpectrum = {
  formula: string;
  charge: number;
  monoisotopic_mz: number;
  peaks: IsotopePeak[];
  displayed_probability: number;
  method: string;
  epistemic_state: 'SIMULATED';
  limitations: string;
};
const PROTON_MASS = 1.007276466621;
const ISOTOPES: Record<ElementSymbol, ReadonlyArray<{shift:number;mass:number;p:number}>> = {
  C: [{shift:0,mass:12,p:0.9893},{shift:1,mass:13.00335483507,p:0.0107}],
  H: [{shift:0,mass:1.00782503223,p:0.999885},{shift:1,mass:2.01410177812,p:0.000115}],
  N: [{shift:0,mass:14.00307400443,p:0.99636},{shift:1,mass:15.00010889888,p:0.00364}],
  O: [{shift:0,mass:15.99491461957,p:0.99757},{shift:1,mass:16.99913175650,p:0.00038},{shift:2,mass:17.99915961286,p:0.00205}],
};
const ORDER: ElementSymbol[] = ['C','H','N','O'];

export function parseMolecularFormula(value:unknown): Record<ElementSymbol,number> {
  if (typeof value !== 'string' || value.length < 1 || value.length > 80) throw new Error('Enter a CHNO molecular formula, such as C20H28O.');
  const result: Record<ElementSymbol,number> = { C:0,H:0,N:0,O:0 };
  let index=0, total=0;
  const pattern=/([A-Z][a-z]?)([0-9]*)/g;
  for (const match of value.matchAll(pattern)) {
    if (match.index !== index) throw new Error('Invalid formula syntax. Use only unparenthesized C, H, N and O.');
    const symbol=match[1] as ElementSymbol;
    if (!ORDER.includes(symbol)) throw new Error('Only C, H, N and O are supported.');
    const count=match[2] === '' ? 1 : Number(match[2]);
    if (!Number.isSafeInteger(count) || count < 1 || count > 200) throw new Error('Each element count must be an integer from 1 to 200.');
    result[symbol] += count;
    total += count;
    index += match[0].length;
  }
  if (index !== value.length || total === 0 || total > 200) throw new Error('The formula must contain 1–200 total atoms using only C, H, N and O.');
  return result;
}

export function calculateIsotopeEnvelope(formula:unknown, charge:unknown): MassSpectrum {
  const counts=parseMolecularFormula(formula);
  if (!Number.isInteger(charge) || typeof charge !== 'number' || charge < 1 || charge > 5) throw new Error('Charge must be an integer from 1 to 5.');
  // Aggregate isotopologues by integer nominal mass shift, retaining probability-
  // weighted precise mass for a reproducible centroid per isotope cluster.
  let states=new Map<number,{p:number; weightedMass:number}>([[0,{p:1,weightedMass:0}]]);
  for (const element of ORDER) {
    for (let atom=0;atom<counts[element];atom++) {
      const next=new Map<number,{p:number;weightedMass:number}>();
      for (const [shift,old] of states) {
        for (const isotope of ISOTOPES[element]) {
          const key=shift+isotope.shift;
          const state=next.get(key) || {p:0,weightedMass:0};
          state.p += old.p*isotope.p;
          state.weightedMass += (old.weightedMass+old.p*isotope.mass)*isotope.p;
          next.set(key,state);
        }
      }
      states=next;
    }
  }
  const base=Array.from(states.values()).reduce((m,x)=>Math.max(m,x.p),0);
  const all=Array.from(states.entries()).sort((a,b)=>a[0]-b[0]);
  const candidates=all.filter(([,value])=>value.p/base>=0.00001);
  const strongest=candidates.sort((a,b)=>b[1].p-a[1].p).slice(0,40).sort((a,b)=>a[0]-b[0]);
  const peaks=strongest.map(([shift,value])=>({
    nominal_shift:shift,
    mz:(value.weightedMass/value.p+PROTON_MASS*charge)/charge,
    relative_intensity:100*value.p/base,
    probability:value.p,
  }));
  const monoisotopicMass=ORDER.reduce((sum,el)=>sum+counts[el]*ISOTOPES[el][0].mass,0);
  return {
    formula:String(formula), charge,
    monoisotopic_mz:(monoisotopicMass+PROTON_MASS*charge)/charge,
    peaks,
    displayed_probability:peaks.reduce((sum,p)=>sum+p.probability,0),
    method:'CHNO natural-abundance convolution; nominal isotope grouping; [M+zH]z+ precursor',
    epistemic_state:'SIMULATED',
    limitations:'Formula must be known. This is a calculated precursor isotope envelope, not measured mass spectrometry, molecular identification, purity, fragmentation, or a therapeutic prediction. Natural abundances vary by sample.',
  };
}