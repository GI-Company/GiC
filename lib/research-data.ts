export type ResearchDomain =
  | 'machine_learning'
  | 'virtual_lab'
  | 'systems_research'
  | 'shipped_software';

export type ProjectKind =
  | 'research'
  | 'engineering'
  | 'software'
  | 'infrastructure';

export type ResearchStatus =
  | 'active_research'
  | 'experimental'
  | 'operational_poc'
  | 'operational_infrastructure'
  | 'historical_prototype'
  | 'shipped'
  | 'pending_verification';

export interface RepositoryArtifact {
  provider: 'github';
  owner: string;
  name: string;
  url: string;
  homepageUrl?: string;
  visibility?: 'public' | 'private';
  relationship:
    | 'primary-source'
    | 'implementation'
    | 'prototype'
    | 'supporting';
  description?: string;
  verificationStatus?: 'verified' | 'pending_inspection' | 'unverified';
}

export interface PipelineStage {
  name: string;
  role: string;
  description: string;
  io?: string;
}

export interface ProjectComponent {
  name: string;
  description: string;
  technology?: string;
}

export type EpistemicEvidenceLevel =
  | 'SOURCE-VERIFIED'
  | 'EXPERIMENT-VERIFIED'
  | 'AUTHOR-REPORTED'
  | 'DESIGN CLAIM / HYPOTHESIS';

export interface ProjectExperiment {
  id: string;
  name: string;
  hypothesis: string;
  methodology: string;
  configuration: Record<string, string | number>;
  evidenceLevel?: EpistemicEvidenceLevel;
  telemetry?: {
    label: string;
    value: string;
    unit?: string;
    note?: string;
  }[];
  diagnostics?: {
    label: string;
    value: string | number;
    status?: 'nominal' | 'warning' | 'critical' | 'neutral';
  }[];
  results: string;
  interpretation: string;
  observationNote?: string;
  nextExperiment?: string;
  limitations: string;
}

export interface ResearchFinding {
  type: 'OBSERVED' | 'SUPPORTED' | 'UNRESOLVED' | 'FAILED';
  title: string;
  description: string;
  evidenceLevel?: EpistemicEvidenceLevel;
}

export interface ResearchArtifact {
  id: string;
  name: string;
  type: string;
  size?: string;
  hash?: string;
  description: string;
  provenance: string;
  evidenceLevel?: EpistemicEvidenceLevel;
}

export interface ResearchPublication {
  id: string;
  title: string;
  url: string;
  platform: 'linkedin' | 'github' | 'other';
  type:
    | 'research-log'
    | 'experiment-report'
    | 'engineering-report'
    | 'project-update';
  projectId: string;
  experimentIds?: string[];
  publishedAt?: string;
  summary?: string;
  evidenceRelationship:
    | 'documents'
    | 'discusses'
    | 'contextualizes';
  evidenceLevel?: EpistemicEvidenceLevel;
}

export interface TechnicalSection {
  id: string;
  title: string;
  summary: string;
  content: string;
  keyPoints?: string[];
  highlights?: string[];
  sourceReferences?: string[];
  isVerifiedFromSource?: boolean;
  epistemicRole:
    | 'SOURCE-VERIFIED'
    | 'EXPERIMENT-VERIFIED'
    | 'AUTHOR-REPORTED'
    | 'DESIGN CLAIM / HYPOTHESIS'
    | 'SOURCE CODE'
    | 'EXPERIMENT'
    | 'RESULT'
    | 'RESEARCH LOG'
    | 'OBSERVED'
    | 'EXTERNAL SOURCE';
}

export interface ResearchTimelineEvent {
  id: string;
  date?: string;
  phase: string;
  title: string;
  description: string;
  kind: 'architecture' | 'scaling' | 'tokenization' | 'experiment' | 'finding' | 'null_result' | 'code_milestone' | 'research_log';
  epistemicStatus:
    | 'SOURCE-VERIFIED'
    | 'EXPERIMENT-VERIFIED'
    | 'AUTHOR-REPORTED'
    | 'DESIGN CLAIM / HYPOTHESIS'
    | 'OBSERVED'
    | 'MEASURED'
    | 'INFERRED'
    | 'SUPPORTED'
    | 'HYPOTHESIS'
    | 'PLANNED'
    | 'UNRESOLVED'
    | 'FAILED / NULL'
    | 'DEMONSTRATION'
    | 'SOURCE CODE'
    | 'RESEARCH LOG'
    | 'EXPERIMENT'
    | 'RESULT';
  relatedArtifactId?: string;
  relatedArticleUrl?: string;
  articleTitle?: string;
  lineageStage?: 'QUESTION' | 'IMPLEMENTATION' | 'EXPERIMENT' | 'RESULT' | 'FAILURE/LESSON' | 'ITERATION' | 'PUBLIC RESEARCH LOG';
}

export interface RealPublication {
  title: string;
  date: string;
  forum: string;
  citation: string;
  abstract: string;
}

export interface ResearchNode {
  id: string;
  name: string;
  codename: string;
  domain: ResearchDomain;
  domainLabel: string;
  projectKind: ProjectKind;
  status: ResearchStatus;
  statusLabel: string;
  classification: string;
  operator: string;
  position: [number, number, number];
  summary: string;
  timeline?: string;
  researchQuestion?: string;
  engineeringObjective?: string;
  productPurpose?: string;
  repositories?: RepositoryArtifact[];
  classificationNote?: string;
  architecture: {
    overview: string;
    principles?: string[];
    pipelineStages?: PipelineStage[];
    components?: ProjectComponent[];
    techStack?: string[];
    technicalDecisions?: string[];
  };
  lineage: {
    parents: string[];
    children: string[];
    relationshipNote: string;
  };
  technicalSections?: TechnicalSection[];
  timelineEvents?: ResearchTimelineEvent[];
  experiments?: ProjectExperiment[];
  findings?: ResearchFinding[];
  artifacts: ResearchArtifact[];
  publications: (ResearchPublication | RealPublication)[];
  sourceReference?: string;
  simulatorType?: 'cortex-ms-probe' | 'virtual-lab-integrity' | 'sensor-node-rf' | 'acmk-debugger' | 'evidence-vault';
  features?: string[];
  challenges?: string[];
}

export interface ResearchLink {
  source: string;
  target: string;
  type:
    | 'evolved_from'
    | 'orchestrates'
    | 'evaluates'
    | 'feeds'
    | 'verifies'
    | 'supports'
    | 'shares_principles_with'
    | 'related_to';
  strength: number;
  annotation: string;
}

export interface DomainMetadata {
  id: ResearchDomain;
  label: string;
  shortLabel: string;
  description: string;
  colorHex: string;
  colorNum: number;
  center: [number, number, number];
}

export const RESEARCH_DOMAINS: DomainMetadata[] = [
  {
    id: 'machine_learning',
    label: 'Machine Learning',
    shortLabel: 'Machine Learning',
    description: 'Learned molecular representations, bounded workspace hypothesis competition, and verified pharmacological evidence substrates.',
    colorHex: '#10b981',
    colorNum: 0x10b981,
    center: [3.4, 1.2, 0.4],
  },
  {
    id: 'virtual_lab',
    label: 'Virtual Lab',
    shortLabel: 'Virtual Lab',
    description: 'Scientific instrumentation, immutable cryptographic evidence containers (.vlab), and mobile multi-sensor acquisition.',
    colorHex: '#06b6d4',
    colorNum: 0x06b6d4,
    center: [0.0, 0.8, 2.0],
  },
  {
    id: 'systems_research',
    label: 'Systems Research',
    shortLabel: 'Systems Research',
    description: 'Inspectable cognitive microkernels, deterministic replay, operating system architecture, and cognitive message buses.',
    colorHex: '#3b82f6',
    colorNum: 0x3b82f6,
    center: [-2.8, 0.8, -0.6],
  },
  {
    id: 'shipped_software',
    label: 'Shipped Software',
    shortLabel: 'Shipped Software',
    description: 'Production applications, transactional state machines, interactive frontends, and client document generation tools.',
    colorHex: '#f59e0b',
    colorNum: 0xf59e0b,
    center: [2.2, -2.2, -0.9],
  },
];

export const RESEARCH_NODES: ResearchNode[] = [
  // ==========================================
  // DOMAIN 1: MACHINE LEARNING
  // ==========================================
  {
    id: 'cortex-ms',
    name: 'CORTEX-MS',
    codename: 'CORTEX-MS-L4',
    domain: 'machine_learning',
    domainLabel: 'Machine Learning',
    projectKind: 'research',
    status: 'active_research',
    statusLabel: 'Active Research',
    classification: 'Experimental Molecular Representation & Mass-Spectrometry Learning System',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [3.6, 1.4, 0.4],
    summary:
      'Learned molecular reasoning architecture that maintains and updates competing molecular hypotheses from mass-spectrometry evidence rather than one-shot retrieval.',
    researchQuestion:
      'Can molecular identification from mass-spectrometry evidence benefit from a learned architecture that maintains and updates competing molecular hypotheses rather than treating identification solely as one-shot classification or retrieval?',
    repositories: [],
    architecture: {
      overview:
        'Cortex-MS transforms raw tandem mass spectra (MS/MS) and precursor metadata into structured geometric peak embeddings. These embeddings are routed into an active workspace where competing hypothesis slots evaluate formula consistency, functional fingerprint predictions, and candidate ranking in parallel.',
      principles: [
        'Hypothesis Competition: Rather than collapsing features in a single forward pass, parallel hypothesis slots compete for evidence support.',
        'Geometric Peak Manifold: Peak m/z, relative abundance, and collision energy are projected into continuous metric spaces.',
        'Calibrated Uncertainty: The system preserves candidate margin ambiguities instead of forcing artificial overconfidence.',
      ],
      pipelineStages: [
        {
          name: 'Mass Spectrum Input',
          role: 'Precursor & Collision Context',
          description: 'MS/MS centroid peaks, precursor m/z, charge state, collision energy, and adduct metadata.',
          io: 'Raw peak array [m/z, intensity] + context scalars',
        },
        {
          name: 'Peak Encoder',
          role: 'High-Dimensional Projection',
          description: 'Fourier-transformed positional encodings mapped to metric vector representations.',
          io: 'Dense peak tokens [N_peaks, 512-dim]',
        },
        {
          name: 'Spectrum Embedding',
          role: 'Global Context Pooling',
          description: 'Multi-head self-attention aggregating fragmentation tree dynamics into a unified spectral signature.',
          io: 'Latent spectrum manifold [1024-dim]',
        },
        {
          name: 'Cortex Workspace',
          role: 'Hypothesis Competition Slots',
          description: 'Three concurrent hypothesis slots (Hypothesis A, B, C) that maintain and update competing molecular hypotheses.',
          io: '3x Active Hypothesis States with competition weights',
        },
        {
          name: 'Multi-Task Decoders',
          role: 'Formula, Fingerprint & Representation',
          description: 'Joint prediction of elemental formula, Morgan chemical fingerprint bits, and metric contrastive representations.',
          io: 'Formula logits, FP probability vector, Latent embedding',
        },
        {
          name: 'Candidate Ranking',
          role: 'Evidence Matching',
          description: 'Calculates cosine similarity and margin-loss distances against molecular candidate libraries.',
          io: 'Rank-ordered candidate list with calibrated margins',
        },
      ],
    },
    lineage: {
      parents: ['cortex'],
      children: ['evidence-vault'],
      relationshipNote: 'Applies the generalized Cortex hypothesis-competition paradigm to mass-spectrometry evidence.',
    },
    experiments: [
      {
        id: 'l4-saturation-probe',
        name: 'Cortex-MS L4 Saturation Probe',
        hypothesis:
          'A 3.2M-parameter molecular hypothesis model with BF16 precision can sustain high-throughput inference on NVIDIA L4 hardware without pipeline starvation.',
        methodology:
          'Evaluated batch size 32 through 256 on a dedicated NVIDIA L4 accelerator using BF16 mixed-precision and synthetic/curated MS/MS molecular batches.',
        configuration: {
          Parameters: '3,232,492',
          Precision: 'BF16',
          Hardware: 'NVIDIA L4 (24 GB Ada Lovelace)',
          'Batch Size': 32,
          'Research Stage': 'Experimental',
        },
        telemetry: [
          { label: 'Throughput', value: '229.6', unit: 'mol/s', note: 'Single-stream inference rate' },
          { label: 'Step Time', value: '139.4', unit: 'ms', note: 'Forward pass latency per batch' },
          { label: 'Peak GPU Memory', value: '2.58', unit: 'GB', note: 'Model weights and activation buffers' },
          { label: 'Total Loss', value: '3.9329', note: 'Composite multi-task objective' },
          { label: 'Contrastive Loss', value: '3.3853', note: 'Metric separation objective' },
          { label: 'Fingerprint Loss', value: '0.3251', note: 'Morgan FP bit BCE' },
          { label: 'Formula Loss', value: '0.2021', note: 'Elemental formula loss' },
          { label: 'Ranking Loss', value: '0.6937', note: 'Margin ranking pairwise loss' },
        ],
        diagnostics: [
          { label: 'Positive Match Score', value: 0.75, status: 'nominal' },
          { label: 'Negative Match Score', value: 0.577, status: 'nominal' },
          { label: 'Hard-Negative Match Score', value: 1.259, status: 'critical' },
          { label: 'Contrastive Margin', value: -0.509, status: 'warning' },
          { label: 'Batch Top-1 Accuracy', value: 0.062, status: 'warning' },
        ],
        results:
          'At Batch 32, the model achieved 229.6 mol/s at 139.4 ms/step with 2.58 GB VRAM. However, representation diagnostics revealed that hard-negatives scored at 1.259 while positive matches scored at 0.750, yielding a negative margin of -0.509.',
        interpretation:
          'Under this configuration, hard-negative similarity exceeded positive similarity. The representation space therefore had not yet achieved the intended separation behavior.',
        observationNote:
          'Small-model molecular ML workloads do not automatically saturate an L4 simply by increasing batch size. Input and data-pipeline deserialization act as a dominating bottleneck.',
        nextExperiment:
          'Modify contrastive loss temperature parameter, introduce curriculum-weighted hard negative sampling, and parallelize CPU-side spectral tensor batching.',
        limitations:
          'Evaluated solely on isolated fragmentation spectra; does not yet incorporate chromatographic retention time indices (RT/RI).',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'L4 Saturation Non-Linearity',
        description: 'Small-model molecular ML workloads do not automatically saturate an L4 simply by increasing batch size.',
      },
      {
        type: 'OBSERVED',
        title: 'Hard Negative Inversion',
        description: 'The current contrastive representation has configurations where hard negatives score above true positives.',
      },
      {
        type: 'OBSERVED',
        title: 'Host Pipeline Bottleneck',
        description: 'Input and data-pipeline behavior can become a meaningful constraint relative to accelerator compute capacity.',
      },
      {
        type: 'UNRESOLVED',
        title: 'Transformer Baseline Advantage',
        description: 'Whether the Cortex hypothesis workspace provides an advantage over a properly matched standard Transformer baseline.',
      },
      {
        type: 'UNRESOLVED',
        title: 'Generalization Across Large Chemical Spaces',
        description: 'Whether observed improvements survive larger heterogeneous chemical datasets and controlled ablation studies.',
      },
    ],
    artifacts: [
      {
        id: 'cortex-ms-l4-weights',
        name: 'cortex_ms_3.2m_bf16.safetensors',
        type: 'Model Weights',
        size: '6.46 MB',
        hash: 'e8d1a29f8c47b539420dc951',
        description: '3,232,492 parameter checkpoint trained with BF16 mixed-precision.',
        provenance: 'Internal training run on NVIDIA L4 node.',
      },
    ],
    publications: [],
    sourceReference: 'GIC Internal Technical Repository (Active Research)',
    simulatorType: 'cortex-ms-probe',
  },

  {
    id: 'cortex',
    name: 'Cortex',
    codename: 'CORTEX-ARCH',
    domain: 'machine_learning',
    domainLabel: 'Machine Learning',
    projectKind: 'research',
    status: 'experimental',
    statusLabel: 'Experimental Architecture',
    classification: 'Cognitive Architecture & Global Workspace Research',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [2.2, 2.0, 0.0],
    summary:
      'Computational architecture organized around selective local processing, bounded global integration, persistent hypotheses, and learned gating.',
    researchQuestion:
      'Can useful computation be organized around selective local processing, bounded global integration, persistent hypotheses, and learned gating rather than applying equivalent global computation at every stage?',
    repositories: [],
    architecture: {
      overview:
        'Cortex decouples routine fast-path sensory reflex from deliberate global cognitive workspace integration. Inputs are filtered by local processors; only significant or anomalous signals trigger gated recruitment of bounded global hypothesis slots that compete for final output synthesis.',
      principles: [
        'Selective Local Processing: Low-entropy signals are handled by local reflex paths without engaging global state.',
        'Bounded Global Workspace: A finite set of hypothesis slots (H1, H2, H3) prevents combinatorial state explosion.',
        'Falsifiability Invariant: The architecture remains an empirical hypothesis until controlled experiments demonstrate an advantage against appropriately matched baselines.',
      ],
      pipelineStages: [
        {
          name: 'Sensory / Vector Input',
          role: 'Signal Ingestion',
          description: 'Streaming token or tensor representations.',
        },
        {
          name: 'Local Processing & Reflex Path',
          role: 'Fast-Path Handler',
          description: 'Lightweight deterministic transformations resolving unambiguous queries locally.',
        },
        {
          name: 'Learned Gating Threshold',
          role: 'Attention Arbitrator',
          description: 'Decides whether local continuation is sufficient or global integration is required.',
        },
        {
          name: 'Global Workspace Competition',
          role: 'Hypothesis Integration',
          description: 'Bounded competing slots evaluate competing trajectories under global constraints.',
        },
      ],
    },
    lineage: {
      parents: ['acmk'],
      children: ['cortex-ms', 'bnlm'],
      relationshipNote: 'Evolved from ACmK inspectable cognitive planes into a selective-workspace neural learning architecture.',
    },
    experiments: [
      {
        id: 'workspace-competition-v1',
        name: 'Bounded Workspace Competition Dynamics',
        hypothesis:
          'Restricting global integration to three competing slots reduces computation by 40% while preserving representation fidelity on ambiguous inputs.',
        methodology: 'Simulated 10,000 ambiguous multi-modal sensory inputs through local vs global gating paths.',
        configuration: {
          'Hypothesis Slots': 3,
          'Gating Sensitivity': '0.72 Threshold',
          'Baseline Comparison': 'Full-Layer Dense Self-Attention',
        },
        results:
          'Demonstrated 38% reduction in total FLOPs on bimodal inputs. However, edge-case routing thrashing occurred when gating thresholds hovered near the boundary.',
        interpretation:
          'Gating policies require hysteresis or temporal smoothing to prevent rapid state oscillations between local and global paths.',
        limitations: 'Currently validated only in synthetic sequence environments, not physical robot actuators.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Gating Hysteresis Requirement',
        description: 'Simple threshold gating produces thrashing when input ambiguity hovers near decision boundaries.',
      },
      {
        type: 'UNRESOLVED',
        title: 'Advantage Against Matched Baselines',
        description: 'The architecture remains a hypothesis until controlled experiments demonstrate an advantage against appropriately matched baselines.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'GIC Internal Architecture Specification #04',
  },

  {
    id: 'bnlm',
    name: 'BNLM',
    codename: 'BNLM-BROWSER-TRANSFORMER',
    domain: 'machine_learning',
    domainLabel: 'Machine Learning',
    projectKind: 'research',
    status: 'active_research',
    statusLabel: 'Client-Side Language Model & In-Browser Training Engine',
    classification: 'Browser-Native Decoder-Only Transformer with WebGPU Autograd',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [4.2, 2.2, 0.2],
    timeline: '2026-Q1 / Active Research',
    summary:
      'A small decoder-only Transformer initialized, trained, and executed for inference entirely client-side inside the browser. Written in native JavaScript ES modules and WebGPU WGSL compute shaders with CPU fallback, featuring a custom reverse-mode autograd tensor engine, BPE tokenizer, Adam/AdamW optimizers, and non-blocking Web Worker execution with zero server dependencies, Python runtimes, or build steps.',
    researchQuestion:
      'What architecture, systems design, and compute-dispatch patterns allow a Transformer language model to be trained from random initialization entirely inside a single browser tab under client-side memory and compute constraints?',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'BNLM',
        url: 'https://github.com/GI-Company/BNLM',
        homepageUrl: 'https://bnlm.vercel.app',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Decoder-only Transformer trained in-browser via JavaScript and WebGPU compute shaders.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'BNLM implements a complete deep learning training and inference pipeline running directly in the browser runtime. The tensor library provides reverse-mode automatic differentiation, matrix operations are accelerated via a custom WGSL compute shader on WebGPU with CPU fallback, and asynchronous Web Workers prevent UI thread blocking during training passes.',
      techStack: [
        'JavaScript (ES Modules)',
        'WebGPU (WGSL Compute Shaders)',
        'Web Workers (Background Autograd)',
        'Byte-Pair Encoding (BPE)',
        'HTML5 / Web APIs',
      ],
      components: [
        {
          name: 'Tensor & Autograd Engine',
          description: 'Custom tensor library supporting dynamic computational graph construction and reverse-mode automatic differentiation (src/tensor.js).',
          technology: 'JavaScript ES Modules',
        },
        {
          name: 'WebGPU WGSL Matmul Shader',
          description: 'Dedicated WebGPU compute shader dispatching tiled 2D matrix multiplications on GPU hardware with automatic CPU fallback (src/webgpu.js).',
          technology: 'WGSL / WebGPU',
        },
        {
          name: 'BPE Tokenizer & Vocab Trainer',
          description: 'Client-side Byte-Pair Encoding tokenizer supporting vocabulary training and byte-level subword segmentation (src/bpe_tokenizer.js).',
          technology: 'JavaScript',
        },
        {
          name: 'Dataset Sampler & Context Guard',
          description: 'Samples training windows from TinyStories-formatted text (<|endoftext|>) without cross-story context bleeding (src/dataset.js).',
          technology: 'JavaScript',
        },
        {
          name: 'Web Worker Training Pool',
          description: 'Offloads gradient accumulation and parameter optimization to background threads, maintaining responsive 60 FPS UI rendering (src/worker_train.js).',
          technology: 'Web Workers API',
        },
        {
          name: 'Optimizer Suite',
          description: 'Implements Adam and AdamW optimizers with decoupled weight decay, learning rate schedules, and gradient clipping (src/optim.js).',
          technology: 'JavaScript',
        },
      ],
      principles: [
        'Zero Server Dependency: Entire training loop, gradient backprop, and forward inference execute in the client tab without Python, servers, or WASM toolchains.',
        'Hardware-Adaptive Compute: Uses WebGPU WGSL compute shaders when available, falling back gracefully to pure CPU execution.',
        'Non-Blocking Execution: Long-running gradient steps run in dedicated Web Workers to protect browser responsiveness.',
      ],
      technicalDecisions: [
        'Native ES modules (<script type="module">) used directly to eliminate build step overhead and enable transparent client inspection.',
        'Decoder-only Transformer architecture with causal attention masking tailored for single-tab client constraints.',
        'Document boundary enforcement ensuring training windows never blend unrelated sample texts.',
      ],
    },
    lineage: {
      parents: ['cortex'],
      children: ['kb'],
      relationshipNote: 'Machine learning research branch pioneering browser-native tensor math and in-tab training loops.',
    },
    experiments: [
      {
        id: 'bnlm-gradcheck',
        name: 'Finite-Difference Numerical Gradient Verification',
        hypothesis: 'Analytical backpropagation gradients match finite-difference numerical perturbations within epsilon tolerance.',
        methodology: 'Runs test/gradcheck.mjs against forward/backward passes of all primitive tensor operations.',
        configuration: { epsilon: '1e-4', tolerance: '1e-3' },
        results: 'PASS: Numerical and analytical gradients align across tensor operations.',
        interpretation: 'Validates correctness of reverse-mode automatic differentiation engine in pure JavaScript.',
        limitations: 'Limited to single-precision floating point representations supported by JavaScript Float32Array.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Client-Side Autograd Feasibility',
        description: 'Demonstrated that reverse-mode backpropagation and parameter updates execute deterministically in browser JavaScript engines without native compilation.',
      },
      {
        type: 'OBSERVED',
        title: 'WebGPU Matmul Acceleration',
        description: 'WGSL compute shaders provide substantial speedups over pure JavaScript CPU execution for inner matrix operations on compatible hardware.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/BNLM',
  },

  {
    id: 'tinycoherent',
    name: 'TinyCoherent',
    codename: 'TINYCOHERENT-SCALE',
    domain: 'machine_learning',
    domainLabel: 'Machine Learning',
    projectKind: 'research',
    status: 'active_research',
    statusLabel: 'Active Research / Pure C LLM Engine',
    classification: 'Pure C Decoder-Only Transformer with Apple Silicon Acceleration & Glass-Box Inspection',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [3.4, 0.6, 0.4],
    timeline: '2026 / Active Research Progression',
    summary:
      'An experimental pure C Transformer training and inference engine built for Apple Silicon. Explores 3.45M and 23M parameter architectures, subword BPE tokenization designed to address character-level sequence expansion, pure C conversational instruction fine-tuning with prompt-loss masking, pre-allocated activation buffer inspection via a live terminal REPL, and the Rung 6 V2 reasoning dataset curation workflow.',
    researchQuestion:
      'Can an inspectable glass-box Transformer language model be trained, instruction-tuned, and scaled entirely in pure C directly on Apple Silicon without dependency on Python/PyTorch runtimes, while maintaining rigorous reasoning token curation?',
    engineeringObjective:
      'Build a zero-dependency C deep learning engine that executes training and inference with custom memory-mapped tensor buffers, Accelerate BLAS linear algebra, and internal layer observability via a live terminal REPL.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'tinyCOHERENT',
        url: 'https://github.com/GI-Company/tinyCOHERENT',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Pure C LLM training engine with Apple Silicon hardware acceleration, Byte-Pair Encoding subword tokenization, glass-box activation inspection, instruction tuning, attribution tests, scaling ledgers, and curated reasoning scratchpad datasets.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'TinyCoherent implements an autoregressive decoder-only Transformer entirely in ANSI C with zero third-party framework dependencies. The system architecture coordinates contiguous memory-mapped tensor buffers, custom analytical reverse-mode backpropagation, cache-aligned matrix multiplication routines via Apple Accelerate BLAS, causal self-attention, and an interactive glass-box REPL for inspecting internal activations in real-time.',
      principles: [
        'Zero Framework Overhead: Standalone ANSI C implementation without Python, PyTorch, CUDA, or external math framework dependencies (SOURCE-VERIFIED).',
        'Contiguous Activation Buffer Inspection: Layer activations and attention weights reside in pre-allocated memory buffers, enabling constant-time O(1) buffer lookup during generation without dynamic heap allocation per inspection tap (DESIGN CLAIM / HYPOTHESIS).',
        'Data Curation Integrity: Prioritizes verified step-by-step scratchpad examples over raw synthetic token volume, discarding unverified candidate tokens (AUTHOR-REPORTED).',
        'Hardware-Targeted Implementation: Integrates Apple Accelerate BLAS (cblas_sgemm) on unified memory architectures (SOURCE-VERIFIED; compute bandwidth bounds AUTHOR-REPORTED).',
      ],
      techStack: [
        'ANSI C (C99/C11 Standard)',
        'Apple Accelerate Framework (cblas_sgemm / BLAS)',
        'POSIX Memory Mapping (mmap / msync)',
        'Custom Byte-Pair Encoding (BPE) Subword Tokenizer',
        'Pure C AdamW Optimizer with Decoupled Weight Decay',
      ],
      technicalDecisions: [
        'Contiguous single-buffer memory allocation per forward-backward pass to eliminate dynamic malloc fragmentation during training loops.',
        'Prompt-loss masking in pure C during conversational fine-tuning: gradients are computed exclusively on target response tokens.',
        'Subword Byte-Pair Encoding vocabulary trained on domain corpora to mitigate sequence length inflation associated with character-level tokenization.',
      ],
      pipelineStages: [
        {
          name: 'Token Ingestion & Embedding',
          role: 'Sequence Encoding',
          description: 'Subword BPE lookup mapping token IDs to dense embedding vectors with learned positional encodings.',
        },
        {
          name: 'Layer-by-Layer Causal Transformer Blocks',
          role: 'Contextual Self-Attention',
          description: 'LayerNorm / RMSNorm, multi-head causal self-attention with KV caching, and feed-forward MLP blocks in pure C.',
        },
        {
          name: 'Glass-Box Activation Tap',
          role: 'Real-Time Introspection',
          description: 'Direct reading of pre-allocated activation buffers allowing the live REPL to query attention distributions and intermediate layer activations without dynamic allocation.',
        },
        {
          name: 'Loss Masking & Autograd Backpropagation',
          role: 'Training Optimization',
          description: 'Computes analytical cross-entropy gradients over response tokens only, executing backprop directly into parameter gradient buffers.',
        },
      ],
    },
    technicalSections: [
      {
        id: 'overview',
        title: 'Overview',
        summary: 'Pure C autoregressive decoder-only Transformer built with zero third-party framework dependencies.',
        content: 'TinyCoherent is a custom implementation of an autoregressive Transformer language model and training system written in ANSI C. Rather than depending on Python or PyTorch runtimes, the codebase directly manages tensor memory buffers, invokes BLAS linear algebra routines, and provides an interactive terminal REPL for reading internal layer states.',
        keyPoints: [
          'Native ANSI C implementation with direct tensor memory mapping (SOURCE-VERIFIED)',
          'Zero Python or PyTorch runtime dependency (SOURCE-VERIFIED)',
          'Activation tap reads pre-allocated buffers with O(1) allocation overhead (no dynamic malloc per inspection tap) (DESIGN CLAIM / HYPOTHESIS)',
        ],
        highlights: [
          'Direct ANSI C tensor memory management',
          'Interactive terminal REPL for activation inspection',
          'Zero external deep learning framework dependencies',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'SOURCE-VERIFIED',
      },
      {
        id: 'architecture',
        title: 'Architecture',
        summary: 'Decoder-only Transformer with causal multi-head self-attention and custom autograd in C.',
        content: 'The architecture implements a standard autoregressive decoder-only design in C: token embeddings, learned positional encodings, pre-layer normalization Transformer blocks, multi-head causal attention with KV caching, and feed-forward MLP layers with GELU activations. Backpropagation gradients are calculated analytically in C and accumulated into contiguous parameter gradient arrays.',
        keyPoints: [
          'Pre-LayerNorm Transformer blocks with residual skip connections (SOURCE-VERIFIED)',
          'Causal attention masking preventing future token information leakage (SOURCE-VERIFIED)',
          'Unified contiguous parameter and gradient buffer layout (SOURCE-VERIFIED)',
        ],
        highlights: [
          'Pre-LayerNorm Transformer blocks with residual skip connections',
          'Causal attention masking',
          'Contiguous gradient accumulation buffers',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'SOURCE-VERIFIED',
      },
      {
        id: 'scaling',
        title: 'Scaling',
        summary: 'Exploratory scaling from 3.45M character baseline to 23M parameter subword model.',
        content: 'Founder research logs document exploratory scaling from an initial 3.45M parameter character-level model to a 23M parameter subword model. While tensor memory allocations and parameter configurations were scaled in C, formal multi-device training throughput benchmarks remain author-reported from single-workstation runs.',
        keyPoints: [
          'Initial 3.45M parameter character-level exploratory baseline (AUTHOR-REPORTED)',
          'Scaled 23M parameter model configuration in pure C (SOURCE-VERIFIED in code structure)',
          'Scaling throughput and compute efficiency metrics are author-reported from single-workstation trials (AUTHOR-REPORTED)',
        ],
        highlights: [
          'Initial 3.45M parameter character-level baseline',
          '23M parameter scaled model configuration',
          'Single-workstation exploratory execution',
        ],
        isVerifiedFromSource: false,
        epistemicRole: 'AUTHOR-REPORTED',
      },
      {
        id: 'tokenization',
        title: 'Tokenization',
        summary: 'Transition from character-level encoding to subword Byte-Pair Encoding (BPE).',
        content: 'Founder research logs report that character-level tokenization severely bloated sequence lengths on multi-digit numbers and technical terms, exhausting the model context window. Implementing custom subword Byte-Pair Encoding (BPE) in C was reported to compress sequence lengths by ~3.8x across sample technical and conversational text. Cross-corpus validation across standardized benchmarks remains an open question.',
        keyPoints: [
          'Identified sequence length inflation under character-level modeling (AUTHOR-REPORTED)',
          'Designed and implemented custom C subword Byte-Pair Encoding (BPE) engine (SOURCE-VERIFIED)',
          '~3.8x context compression factor reported by author in LinkedIn research log (AUTHOR-REPORTED)',
        ],
        highlights: [
          'Identified character-level sequence expansion',
          'Pure C subword Byte-Pair Encoding implementation',
          'Reported ~3.8x sequence compression over sample domain text',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'AUTHOR-REPORTED',
      },
      {
        id: 'instruction-tuning',
        title: 'Instruction Tuning',
        summary: 'Conversational instruction fine-tuning in pure C with prompt-loss masking.',
        content: 'Conversational fine-tuning was implemented in C using prompt-loss masking: loss gradients are zeroed across prompt tokens during the backward pass so parameter updates are driven exclusively by assistant response tokens. Conversational interaction behavior and stability are author-reported.',
        keyPoints: [
          'Implemented prompt-loss masking in C to isolate assistant response loss (SOURCE-VERIFIED)',
          'Conversational turn sequence parsing without external alignment frameworks (SOURCE-VERIFIED)',
          'Downstream conversational alignment evaluated via author-reported interaction (AUTHOR-REPORTED)',
        ],
        highlights: [
          'Prompt-loss masking gradient logic in C',
          'Turn-based sequence parsing',
          'Author-reported conversational alignment',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'AUTHOR-REPORTED',
      },
      {
        id: 'reasoning',
        title: 'Reasoning (Rung 6 V2)',
        summary: 'Curation methodology in Rung 6 V2: discarding unverified synthetic candidate tokens.',
        content: 'Founder research logs document discarding approximately 1.5M synthetic reasoning tokens identified as containing logical drift, hallucinations, and unverified steps, replacing them with a curated dataset of step-by-step scratchpads. While dataset curation principles are documented, generalized reasoning bounds and hallucination prevention remain active research hypotheses.',
        keyPoints: [
          'Documented decision to discard 1.5M unverified synthetic candidate tokens (AUTHOR-REPORTED)',
          'Curated step-by-step scratchpad dataset designed to evaluate deduction consistency (AUTHOR-REPORTED / HYPOTHESIS)',
          'Long-term hallucination mitigation and deductive guarantees remain unverified research questions (DESIGN CLAIM / HYPOTHESIS)',
        ],
        highlights: [
          'Discarded 1.5M unverified candidate tokens',
          'Curated step-by-step scratchpad dataset',
          'Reasoning guarantees remain open hypotheses',
        ],
        isVerifiedFromSource: false,
        epistemicRole: 'AUTHOR-REPORTED',
      },
      {
        id: 'training-runtime',
        title: 'Training Runtime',
        summary: 'Custom C training loop targeting Apple Silicon Accelerate BLAS.',
        content: 'The custom C training loop was engineered for Apple Silicon unified memory, utilizing Apple Accelerate framework routines (cblas_sgemm) and pre-allocated contiguous memory buffers to minimize heap allocation in inner loops. Claims of achieving "near-theoretical compute bandwidth" represent architectural goals and author-reported observations rather than formally published hardware benchmarks.',
        keyPoints: [
          'Apple Accelerate BLAS (cblas_sgemm) integration for matrix multiplication (SOURCE-VERIFIED)',
          'Contiguous buffer management avoiding dynamic malloc in inner training loops (SOURCE-VERIFIED)',
          'Near-theoretical compute bandwidth represents an author-reported goal / observation (DESIGN CLAIM / HYPOTHESIS)',
        ],
        highlights: [
          'Apple Accelerate BLAS integration (cblas_sgemm)',
          'Pre-allocated contiguous buffer layout',
          'Near-theoretical bandwidth is author-reported, not benchmarked',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'DESIGN CLAIM / HYPOTHESIS',
      },
      {
        id: 'source',
        title: 'Source Code',
        summary: 'Canonical open-source repository on GitHub.',
        content: 'The designated public GitHub repository for TinyCoherent is https://github.com/GI-Company/tinyCOHERENT. Source code artifacts, scaling ledgers (DEGRADE.md, SCALE_200k.md, SCALE_3M.md, SCALE_RUNG4.md, SCALE_RUNG6.md), and training logs are publicly accessible in the repository.',
        keyPoints: [
          'Repository: https://github.com/GI-Company/tinyCOHERENT (SOURCE-VERIFIED)',
          'Documents hand-written forward/backward pass, gradient checks, faithfulness gates, and 300/300 attribution recovery (SOURCE-VERIFIED)',
          'Tracks scaling stages to ~21.5M Rung 6 checkpoint with explicitly reported negative result: Rung 6 generation not yet coherent (SOURCE-VERIFIED / EXPERIMENT-VERIFIED)',
        ],
        highlights: [
          'Canonical GitHub repository: GI-Company/tinyCOHERENT',
          'Finite-difference gradient checks & faithfulness gates',
          'Documented Rung 6 scaling milestone & negative generation results',
        ],
        isVerifiedFromSource: true,
        epistemicRole: 'SOURCE-VERIFIED',
      },
    ],
    timelineEvents: [
      {
        id: 'tc-timeline-1',
        phase: 'Foundation',
        title: 'Pure C Transformer Engine & 3.45M Baseline',
        description: 'Constructed the pure C autoregressive Transformer baseline (3.45M parameters) with pre-allocated buffer activation inspection and an interactive terminal REPL.',
        kind: 'architecture',
        epistemicStatus: 'SOURCE-VERIFIED',
        lineageStage: 'IMPLEMENTATION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/scaling-tinycoherent-345m-parameters-o1-live-repl-cory-tortorici-drgie',
        articleTitle: 'TinyCoherent: 3.45M Parameters, O(1) Interpretability, and a Live Glass-Box REPL',
      },
      {
        id: 'tc-timeline-2',
        phase: 'Scaling',
        title: '23M Parameter Scaling Experiment',
        description: 'Scaled model parameter capacity from 3.45M to 23M in C; training throughput and stability observations reported in founder research log.',
        kind: 'scaling',
        epistemicStatus: 'AUTHOR-REPORTED',
        lineageStage: 'EXPERIMENT',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/breaking-character-bottleneck-scaling-tinycoherent-23m-cory-tortorici-vugbe',
        articleTitle: 'Breaking the Character Bottleneck: Scaling TinyCoherent to 23M Parameters',
      },
      {
        id: 'tc-timeline-3',
        phase: 'Tokenization',
        title: 'Character Bottleneck Identification & Subword BPE Transition',
        description: 'Identified character-level sequence length inflation; implemented C subword BPE tokenizer with author-reported ~3.8x sequence compression over sample text.',
        kind: 'tokenization',
        epistemicStatus: 'AUTHOR-REPORTED',
        lineageStage: 'FAILURE/LESSON',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/breaking-character-bottleneck-advancing-tinycoherent-bpe-tortorici-qnaze',
        articleTitle: 'Breaking the Character Bottleneck: Advancing TinyCoherent to Subword BPE',
      },
      {
        id: 'tc-timeline-4',
        phase: 'Instruction Tuning',
        title: 'Pure C Conversational Fine-Tuning with Prompt-Loss Masking',
        description: 'Implemented prompt-loss masking in pure C autograd, zeroing backpropagation gradients across prompt tokens to isolate assistant response loss.',
        kind: 'experiment',
        epistemicStatus: 'AUTHOR-REPORTED',
        lineageStage: 'EXPERIMENT',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/teaching-glass-box-llm-converse-instruction-pure-c-cory-tortorici-qzove',
        articleTitle: 'Teaching a Glass-Box LLM to Converse: Instruction Fine-Tuning in Pure C',
      },
      {
        id: 'tc-timeline-5',
        phase: 'Reasoning',
        title: 'Rung 6 V2: Discarding 1.5M Tokens for High-Integrity Scratchpads',
        description: 'Discarded 1.5M synthetic tokens containing logical drift; curated step-by-step scratchpad dataset to evaluate reasoning consistency.',
        kind: 'finding',
        epistemicStatus: 'AUTHOR-REPORTED',
        lineageStage: 'ITERATION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/rung-6-v2-why-we-threw-away-15m-tokens-build-engine-cory-tortorici-foi4e',
        articleTitle: 'Rung 6 V2: Why We Threw Away 1.5M Tokens to Build a Glass-Box Reasoning Engine',
      },
      {
        id: 'tc-timeline-6',
        phase: 'Runtime',
        title: 'Apple Silicon BLAS/Accelerate Training Runtime Optimization',
        description: 'Integrated Apple Accelerate BLAS (cblas_sgemm) and zero-allocation inner loops on Apple Silicon; compute bandwidth bounds reported in research log.',
        kind: 'code_milestone',
        epistemicStatus: 'DESIGN CLAIM / HYPOTHESIS',
        lineageStage: 'IMPLEMENTATION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/taming-apple-silicon-building-blazing-fast-custom-llm-cory-tortorici-gy4he',
        articleTitle: 'Taming Apple Silicon: Building a Blazing-Fast Custom LLM Training Engine from Scratch',
      },
    ],
    lineage: {
      parents: [],
      children: [],
      relationshipNote: 'Shares inspectability and small-model design principles with Cortex and BNLM without direct historical codebase derivation.',
    },
    experiments: [
      {
        id: 'tinycoherent-3.45m-repl',
        name: '3.45M Character Baseline & Live Glass-Box REPL',
        evidenceLevel: 'AUTHOR-REPORTED',
        hypothesis:
          'A compact 3.45M parameter Transformer in pure C provides direct inspection of internal activations during generation without dynamic buffer allocation.',
        methodology: 'Trained a 3.45M character-level baseline model in C and connected it to an interactive terminal REPL tapping intermediate attention matrices.',
        configuration: {
          'Parameter Count': '3,450,000',
          'Tokenization': 'Character-Level (ASCII/UTF-8 bytes)',
          'Architecture': 'Decoder-only C Transformer',
          'Runtime': 'Pure ANSI C / Accelerate BLAS',
          'Evidence Status': 'Author-Reported in Founder Research Log',
        },
        results:
          'Author reports interactive token generation with terminal REPL inspecting intermediate attention matrices and activations. Pre-allocated buffer reads achieve O(1) memory allocation overhead (no dynamic heap allocations per inspection tap).',
        interpretation:
          'Demonstrates the architectural viability of lightweight C language model interfaces without external deep learning runtime dependencies.',
        limitations: 'Character-level tokenization created excessive sequence length on arithmetic and multi-digit reasoning tasks.',
      },
      {
        id: 'tinycoherent-23m-bpe-scaling',
        name: '23M Subword BPE Scaling & Context Compression',
        evidenceLevel: 'AUTHOR-REPORTED',
        hypothesis:
          'Replacing character-level tokenization with subword Byte-Pair Encoding (BPE) in pure C reduces token sequence length and enables scaling to 23M parameters.',
        methodology: 'Trained custom BPE tokenizer on domain text and scaled model dimensions to 23M parameters on Apple Silicon.',
        configuration: {
          'Parameter Count': '23,000,000',
          'Tokenization': 'Subword Byte-Pair Encoding (BPE)',
          'Reported Compression': '~3.8x vs character-level over sample text',
          'Hardware Target': 'Apple Silicon Unified Memory',
          'Evidence Status': 'Author-Reported in Founder Research Log',
        },
        results:
          'Author reports model capacity scaling to 23M parameters, with ~3.8x sequence compression reported over sample domain text compared to character encoding.',
        interpretation:
          'Addresses sequence length inflation in C LLM architectures; cross-corpus benchmark validation remains an open question.',
        limitations: 'Evaluated on single-machine Apple Silicon; multi-node distributed training and standard benchmark suite evaluations not yet conducted.',
      },
      {
        id: 'tinycoherent-instruction-tuning-c',
        name: 'Pure C Conversational Instruction Fine-Tuning',
        evidenceLevel: 'AUTHOR-REPORTED',
        hypothesis:
          'Applying prompt-loss masking during backpropagation in pure C enables conversational instruction fine-tuning without updating weights on prompt tokens.',
        methodology: 'Executed conversational fine-tuning with backward pass loss masking zeroing gradients across input prompt tokens.',
        configuration: {
          'Loss Masking': 'Prompt tokens gradient = 0.0',
          'Optimization': 'Pure C AdamW with decoupled weight decay',
          'Target Loss': 'Assistant response tokens only',
          'Evidence Status': 'Author-Reported in Founder Research Log',
        },
        results:
          'Author reports conversational turn formatting and response loss convergence in pure C training runs.',
        interpretation:
          'Indicates that basic instruction fine-tuning can be implemented via C loss-masking routines without complex external alignment frameworks.',
        limitations: 'Requires explicit delimiter token handling; safety and alignment bounds unverified.',
      },
      {
        id: 'tinycoherent-rung6-v2-reasoning',
        name: 'Rung 6 V2: Curation Rigor & Scratchpad Reasoning',
        evidenceLevel: 'AUTHOR-REPORTED',
        hypothesis:
          'Curating verified step-by-step scratchpad examples and discarding noisy synthetic candidate tokens produces cleaner training signals than raw token volume.',
        methodology: 'Audited synthetic reasoning tokens, identified logical drift, discarded ~1.5M candidate tokens, and trained on verified step-by-step scratchpad traces.',
        configuration: {
          'Discarded Tokens': '~1,500,000 unverified candidate tokens',
          'Curated Dataset': 'Step-by-step scratchpad traces',
          'Verification Policy': 'Deductive audit prior to inclusion',
          'Evidence Status': 'Author-Reported in Founder Research Log',
        },
        results:
          'Author reports discarding 1.5M unverified candidate tokens and observing fewer reasoning loops on curated deduction traces.',
        interpretation:
          'Highlights the role of synthetic data quality control; long-tail reasoning reliability and formal deduction guarantees remain active research topics.',
        limitations: 'Manual or heuristic scratchpad curation requires substantial domain oversight and does not guarantee complete absence of hallucinations.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Character-Level Sequence Length Inflation',
        description: 'Character-level tokenization expands multi-digit arithmetic and technical words into excessively long sequences, rapidly consuming available context capacity.',
        evidenceLevel: 'AUTHOR-REPORTED',
      },
      {
        type: 'SUPPORTED',
        title: 'Apple Silicon BLAS Matrix Acceleration',
        description: 'cblas_sgemm BLAS integration enables zero-Python matrix multiplication on Apple Silicon; formal compute bandwidth benchmarks remain author-reported.',
        evidenceLevel: 'DESIGN CLAIM / HYPOTHESIS',
      },
      {
        type: 'SUPPORTED',
        title: 'Prompt-Loss Masking in Pure C',
        description: 'Zeroing loss gradients across prompt tokens isolates parameter updates to assistant responses during C conversational fine-tuning.',
        evidenceLevel: 'SOURCE-VERIFIED',
      },
      {
        type: 'OBSERVED',
        title: 'Token Curation vs Volume in Rung 6 V2',
        description: 'Discarding 1.5M unverified candidate tokens in favor of verified step-by-step scratchpads improved training signal quality according to author research logs.',
        evidenceLevel: 'AUTHOR-REPORTED',
      },
    ],
    artifacts: [
      {
        id: 'tinycoherent-c-src',
        name: 'tinyCOHERENT (Pure C Source)',
        type: 'C Source Codebase',
        size: '1.2 MB',
        hash: 'c8f42d109e3a7b52140',
        description: 'Complete ANSI C Transformer training engine, BPE tokenizer, glass-box REPL, and scaling documentation.',
        provenance: 'https://github.com/GI-Company/tinyCOHERENT',
        evidenceLevel: 'SOURCE-VERIFIED',
      },
    ],
    publications: [
      {
        id: 'tc-pub-1',
        title: 'TinyCoherent: 3.45M Parameters, O(1) Interpretability, and a Live Glass-Box REPL',
        url: 'https://www.linkedin.com/pulse/scaling-tinycoherent-345m-parameters-o1-live-repl-cory-tortorici-drgie',
        platform: 'linkedin',
        type: 'research-log',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored research log documenting the initial 3.45M-parameter pure C Transformer baseline, pre-allocated activation buffer inspection, and a live terminal REPL during token generation.',
      },
      {
        id: 'tc-pub-2',
        title: 'Breaking the Character Bottleneck: Scaling TinyCoherent to 23M Parameters',
        url: 'https://www.linkedin.com/pulse/breaking-character-bottleneck-scaling-tinycoherent-23m-cory-tortorici-vugbe',
        platform: 'linkedin',
        type: 'research-log',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored research log discussing scaling the model architecture from 3.45M to 23M parameters, examining compute efficiency, training stability, and the limits of character-level modeling.',
      },
      {
        id: 'tc-pub-3',
        title: 'Breaking the Character Bottleneck: Advancing TinyCoherent to Subword BPE',
        url: 'https://www.linkedin.com/pulse/breaking-character-bottleneck-advancing-tinycoherent-bpe-tortorici-qnaze',
        platform: 'linkedin',
        type: 'engineering-report',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored engineering report detailing the transition from character-level tokenization to subword Byte-Pair Encoding (BPE), increasing effective context capacity and token throughput.',
      },
      {
        id: 'tc-pub-4',
        title: 'Teaching a Glass-Box LLM to Converse: Instruction Fine-Tuning in Pure C',
        url: 'https://www.linkedin.com/pulse/teaching-glass-box-llm-converse-instruction-pure-c-cory-tortorici-qzove',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored experiment report describing conversational instruction fine-tuning in pure C with prompt-loss masking.',
      },
      {
        id: 'tc-pub-5',
        title: 'Rung 6 V2: Why We Threw Away 1.5M Tokens to Build a Glass-Box Reasoning Engine',
        url: 'https://www.linkedin.com/pulse/rung-6-v2-why-we-threw-away-15m-tokens-build-engine-cory-tortorici-foi4e',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored experiment report detailing the decision to discard 1.5M noisy candidate tokens in favor of a curated reasoning dataset with step-by-step scratchpads.',
      },
      {
        id: 'tc-pub-6',
        title: 'Taming Apple Silicon: Building a Blazing-Fast Custom LLM Training Engine from Scratch',
        url: 'https://www.linkedin.com/pulse/taming-apple-silicon-building-blazing-fast-custom-llm-cory-tortorici-gy4he',
        platform: 'linkedin',
        type: 'engineering-report',
        projectId: 'tinycoherent',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder-authored engineering report documenting a custom C training engine targeting Apple Silicon hardware and Accelerate BLAS linear algebra.',
      },
    ],
    sourceReference: 'https://github.com/GI-Company/tinyCOHERENT',
  },

  {
    id: 'physio-model',
    name: 'Physiological Modeling Research',
    codename: 'PHYSIO-HEMO-V1',
    domain: 'machine_learning',
    domainLabel: 'Machine Learning',
    projectKind: 'research',
    status: 'experimental',
    statusLabel: 'Experimental / Null & Mixed Results Preserved',
    classification: 'Hemodynamic Physiological Modeling & Optic-Trigeminal Research',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [4.8, -0.8, 0.6],
    summary:
      'Explores computational hemodynamic modeling and Optic-Trigeminal physiological systems with transparent preservation of null and mixed experimental results.',
    researchQuestion:
      'Does incorporating patient-specific vascular elastance parameters yield statistically and clinically meaningful improvements in Mean Arterial Pressure (MAP) forecasting over baseline autoregression?',
    repositories: [],
    architecture: {
      overview:
        'A dynamic mathematical model combining continuous arterial pressure waveforms with lumped-parameter vascular compliance circuits to forecast arterial blood pressure trajectories and assess autonomic drug responses.',
      principles: [
        'Preservation of Negative Results: Transparent reporting of statistical nulls is essential to scientific integrity.',
        'Distinction of Signal vs Utility: Statistical significance under restricted permutations does not equal practical predictive utility.',
        'Evolutionary Research Lineage: Question ➔ Implementation ➔ Experiment ➔ Result ➔ Failure/Lesson ➔ Iteration ➔ Public Research Log.',
      ],
    },
    lineage: {
      parents: ['evidence-vault'],
      children: [],
      relationshipNote: 'Examines physiological drug-action endpoints downstream of molecular target binding.',
    },
    timelineEvents: [
      {
        id: 'physio-timeline-1',
        phase: 'Initial Hypothesis',
        title: 'Norepinephrine Dynamic Infusion Modeling',
        description: 'Formulated the mathematical simulation framework linking continuous norepinephrine infusion rates to acute hemodynamic response curves.',
        kind: 'architecture',
        epistemicStatus: 'HYPOTHESIS',
        lineageStage: 'QUESTION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/building-drug-simulation-public-what-my-first-showed-cory-tortorici-0czve',
        articleTitle: 'Building a drug simulation in public: what my first norepinephrine experiment showed',
      },
      {
        id: 'physio-timeline-2',
        phase: 'Pharmacodynamics',
        title: 'Concentration-to-Blood-Pressure Response Modeling',
        description: 'Modeled receptor-level pharmacodynamic curves translating drug plasma concentration into systemic vascular resistance and arterial pressure trajectories.',
        kind: 'experiment',
        epistemicStatus: 'MEASURED',
        lineageStage: 'EXPERIMENT',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/from-drug-concentration-blood-pressure-response-next-cory-tortorici-qnfve',
        articleTitle: 'From drug concentration to blood-pressure response: the next OpticTrigeminal experiment',
      },
      {
        id: 'physio-timeline-3',
        phase: 'Clinical Variance',
        title: 'Individual Patient Response Prediction Challenges',
        description: 'Encountered significant clinical forecasting failure when attempting to generalize predictions across distinct patients due to unmodeled autonomic tone variance.',
        kind: 'finding',
        epistemicStatus: 'OBSERVED',
        lineageStage: 'FAILURE/LESSON',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/what-i-learned-trying-predict-how-individual-patient-cory-tortorici-te34e',
        articleTitle: 'What I Learned Trying to Predict How an Individual Patient Will Respond to Norepinephrine',
      },
      {
        id: 'physio-timeline-4',
        phase: 'Null Finding',
        title: 'Physiological Data Expansion Null Result Trial',
        description: 'Adding additional physiological channels failed to yield clinically meaningful MAP predictive improvements (+0.0078 mmHg, 95% CI crosses zero), though heart rate exposed compensatory baroreflex feedback.',
        kind: 'null_result',
        epistemicStatus: 'FAILED / NULL',
        lineageStage: 'RESULT',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/more-physiological-data-did-make-model-better-heart-rate-tortorici-td0ce',
        articleTitle: 'More Physiological Data Did Not Make the Model Better — But Heart Rate Revealed Something Interesting',
      },
    ],
    experiments: [
      {
        id: 'map-elastance-permutation',
        name: 'Mean Arterial Pressure Permutation Evaluation',
        hypothesis:
          'Vascular elastance parameters provide a statistically significant reduction in 15-minute MAP forecasting error.',
        methodology:
          'Evaluated against clinical hemodynamic time-series using both unconstrained between-patient permutation and within-patient restricted permutation tests.',
        configuration: {
          'Evaluated Metric': 'Mean Arterial Pressure (MAP)',
          'Patient Cohort': 'Multi-patient physiological ICU time series',
          'Permutations Executed': '10,000 iterations',
        },
        telemetry: [
          { label: 'MAP Error Improvement', value: '+0.0078', unit: 'mmHg', note: 'Negligible absolute magnitude' },
          { label: '95% Confidence Interval', value: '[-0.1145, 0.1698]', note: 'Crosses zero' },
          { label: 'Between-Patient Permutation', value: 'p = 0.0798', note: 'Not statistically significant' },
          { label: 'Within-Patient Restricted', value: 'p = 0.0479', note: 'Marginally significant p < 0.05' },
        ],
        results:
          'The model achieved a tiny MAP improvement of +0.0078 mmHg (95% CI [-0.1145, 0.1698]). The between-patient permutation test was not significant (p = 0.0798), whereas within-patient restricted permutation yielded p = 0.0479. Held-out predictive gain remained clinically negligible.',
        interpretation:
          'Statistical evidence and practical predictive utility are different questions. While a subtle mathematical signal was detectable within-patient, it offers no actionable predictive utility for patient monitoring.',
        observationNote:
          'Rather than exaggerating p = 0.0479 as a breakthrough discovery, Global Intent Company preserves this as a mixed/null result.',
        limitations: 'Limited by sensor noise and unmodeled autonomic baroreceptor feedback loops.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Statistical Significance != Clinical Utility',
        description: 'A within-patient permutation p = 0.0479 coexists with a negligible +0.0078 mmHg improvement.',
      },
      {
        type: 'FAILED',
        title: 'Held-Out Predictive Superiority',
        description: 'Failed to demonstrate practical forecasting advantage over simple lag-1 autoregression.',
      },
      {
        type: 'OBSERVED',
        title: 'Autonomic Baroreflex Compensation',
        description: 'Heart rate dynamics revealed compensatory autonomic reflex mechanisms that counteract direct drug vasoconstriction.',
      },
    ],
    artifacts: [],
    publications: [
      {
        id: 'physio-pub-1',
        title: 'Building a drug simulation in public: what my first norepinephrine experiment showed',
        url: 'https://www.linkedin.com/pulse/building-drug-simulation-public-what-my-first-showed-cory-tortorici-0czve',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'physio-model',
        evidenceRelationship: 'documents',
        summary: 'Initial public research log exploring mathematical simulation of norepinephrine infusion dynamics and acute hemodynamic response curves.',
      },
      {
        id: 'physio-pub-2',
        title: 'From drug concentration to blood-pressure response: the next OpticTrigeminal experiment',
        url: 'https://www.linkedin.com/pulse/from-drug-concentration-blood-pressure-response-next-cory-tortorici-qnfve',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'physio-model',
        evidenceRelationship: 'documents',
        summary: 'Details the pharmacodynamic modeling linking continuous receptor-level norepinephrine concentration to systemic blood-pressure response trajectories.',
      },
      {
        id: 'physio-pub-3',
        title: 'What I Learned Trying to Predict How an Individual Patient Will Respond to Norepinephrine',
        url: 'https://www.linkedin.com/pulse/what-i-learned-trying-predict-how-individual-patient-cory-tortorici-te34e',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'physio-model',
        evidenceRelationship: 'documents',
        summary: 'Documents the significant clinical and mathematical challenges of predicting individual patient responses due to unobserved baseline autonomic tone and patient-to-patient variance.',
      },
      {
        id: 'physio-pub-4',
        title: 'More Physiological Data Did Not Make the Model Better — But Heart Rate Revealed Something Interesting',
        url: 'https://www.linkedin.com/pulse/more-physiological-data-did-make-model-better-heart-rate-tortorici-td0ce',
        platform: 'linkedin',
        type: 'experiment-report',
        projectId: 'physio-model',
        evidenceRelationship: 'documents',
        summary: 'Rigorous documentation of a null/mixed finding: adding more physiological channels failed to improve MAP forecasting accuracy, while heart rate dynamics exposed complex compensatory baroreflex feedback.',
      },
    ],
    sourceReference: 'GIC Hemodynamic Trial Logs & Optic-Trigeminal Research Series',
  },

  // ==========================================
  // DOMAIN 2: VIRTUAL LAB
  // ==========================================
  {
    id: 'virtual-lab',
    name: 'Virtual Lab',
    codename: 'VIRTUAL-LAB-CORE',
    domain: 'virtual_lab',
    domainLabel: 'Virtual Lab',
    projectKind: 'research',
    status: 'operational_poc',
    statusLabel: 'Active Development / Operational PoC',
    classification: 'Scientific Evidence, Instrumentation & Reproducibility Platform',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [0.2, 0.6, 1.6],
    summary:
      'Platform for ensuring scientific observations remain attributable, verifiable, reproducible, and inspectable from physical acquisition through derivation.',
    researchQuestion:
      'How can a scientific observation remain attributable, verifiable, reproducible, and inspectable from physical acquisition through analysis and derived results?',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'virtual-lab-mobile',
        url: 'https://github.com/GI-Company/virtual-lab-mobile',
        visibility: 'public',
        relationship: 'supporting',
        description: 'Mobile scientific acquisition and edge sensor node repository supporting the broader Virtual Lab architecture.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Virtual Lab specifies an architectural framework for packaging scientific experiments into self-contained .vlab artifacts. Raw readings, calibration factors, execution environment parameters, and intermediate transformations are structured with cryptographic signatures and content-addressed hash chains.',
      principles: [
        'End-to-End Attributability: Raw observations must preserve physical device metadata and sensor calibration states (DESIGN CLAIM / HYPOTHESIS).',
        'Authenticated Manifest Security: Checksum manifests are vulnerable to recomputation without cryptographic authentication (EXPERIMENT-VERIFIED).',
        'Universal Reproducibility: A complete experimental envelope enables deterministic replay of analysis state (DESIGN CLAIM / HYPOTHESIS).',
      ],
      pipelineStages: [
        {
          name: 'Physical World',
          role: 'Sensor Acquisition',
          description: 'Camera, RF, IMU, audio, environmental sensors capturing real-world phenomena.',
        },
        {
          name: 'Sensor Node',
          role: 'Edge Ingestion',
          description: 'Formats sensor readings with hardware clock timestamps and device calibration matrices.',
        },
        {
          name: 'Raw Artifact Envelope',
          role: 'Immutable Storage',
          description: 'Encapsulates genesis.db, observations, raw assets, and acquisition metadata.',
        },
        {
          name: 'Experiment Core',
          role: 'Analysis, Replay & Derivation',
          description: 'Deterministic computational routines generating derived artifacts with explicit provenance links.',
        },
        {
          name: 'Instrument Console',
          role: 'Operator Interface',
          description: 'Desktop console providing live topology, timeline inspection, and integrity validation.',
        },
      ],
    },
    lineage: {
      parents: ['acmk'],
      children: ['sensor-node', 'instrument-console', 'evidence-vault'],
      relationshipNote: 'Bridges cognitive inspectability into verifiable physical scientific instrumentation.',
    },
    experiments: [
      {
        id: 'manifest-tamper-attack',
        name: 'VLab Artifact Integrity & Tamper Attack Test',
        evidenceLevel: 'EXPERIMENT-VERIFIED',
        hypothesis:
          'Plain checksum manifests fail when an attacker can recompute hashes; only cryptographic Ed25519 public-key signatures guarantee artifact integrity.',
        methodology:
          'Simulated a 3-stage adversary attack against a .vlab experiment package: (1) silent payload tampering, (2) simultaneous payload and manifest hash recomputation, and (3) payload tampering under signed manifest verification.',
        configuration: {
          'Package Format': '.vlab (ZIP/Tar container prototype)',
          'Hashing Algorithm': 'SHA-256',
          'Signature Scheme': 'Ed25519 asymmetric cryptography',
          'Target Database': 'genesis.db (scientific readings schema)',
          'Evidence Status': 'Simulated verification test',
        },
        results:
          'Stage 1 rejected immediately by hash mismatch. Stage 2 succeeded in deceiving plain checksum checking (Trust Failure: attacker who can tamper with evidence can also update the manifest). Stage 3 rejected the forged manifest due to an invalid cryptographic signature.',
        interpretation:
          'Scientific software requires stricter integrity semantics than ordinary application software. Checksums alone are insufficient without an authenticated trust root.',
        observationNote:
          'A UI successfully displaying a result does not establish the integrity of the underlying scientific evidence.',
        limitations: 'Relies on offline distribution and management of trusted public keys.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Checksum Manifest Vulnerability Under Recomputation',
        description: 'Checksums alone fail to guarantee integrity when an adversary or faulty pipeline can simultaneously alter evidence payloads and regenerate the manifest hash list.',
        evidenceLevel: 'EXPERIMENT-VERIFIED',
      },
      {
        type: 'SUPPORTED',
        title: 'Complete Reproducibility Bundle Specification',
        description:
          'Universal reproducibility requires bundling raw observations, acquisition metadata, execution configuration, transformation lineage, derived artifacts, and cryptographic integrity proof.',
        evidenceLevel: 'DESIGN CLAIM / HYPOTHESIS',
      },
      {
        type: 'SUPPORTED',
        title: 'Integrity Semantics vs UI Display',
        description:
          'Scientific software requires verified cryptographic provenance; rendering a chart or table in a user interface does not establish the authenticity of the underlying data.',
        evidenceLevel: 'AUTHOR-REPORTED',
      },
    ],
    timelineEvents: [
      {
        id: 'vlab-timeline-1',
        phase: 'Foundational Vision',
        title: 'Executable Biological Hypotheses Architecture',
        description: 'Formulated the initial architectural proposal for transforming theoretical biological hypotheses into executable, computationally verifiable pipelines.',
        kind: 'architecture',
        epistemicStatus: 'DESIGN CLAIM / HYPOTHESIS',
        lineageStage: 'QUESTION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/im-building-virtual-laboratory-where-biological-become-cory-tortorici-ecahe',
        articleTitle: 'I’m Building a Virtual Laboratory Where Biological Hypotheses Become Executable',
      },
      {
        id: 'vlab-timeline-2',
        phase: 'Scientific Worlds',
        title: 'Multi-Agent Executable Scientific World Modeling',
        description: 'Outlined conceptual models for multi-agent simulation environments where models, instruments, and hypotheses interact within a state-managed scientific world.',
        kind: 'architecture',
        epistemicStatus: 'DESIGN CLAIM / HYPOTHESIS',
        lineageStage: 'QUESTION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/im-turning-virtuallab-executable-scientific-world-cory-tortorici-n0v1e',
        articleTitle: 'I’m Turning VirtualLab Into an Executable Scientific World',
      },
      {
        id: 'vlab-timeline-3',
        phase: 'Epistemology & Instrumentation',
        title: 'Direct Model-to-Physical Experimentation Coupling',
        description: 'Explored theoretical criteria and architectural requirements for bridging computational simulations directly with physical sensor acquisition pipelines.',
        kind: 'finding',
        epistemicStatus: 'DESIGN CLAIM / HYPOTHESIS',
        lineageStage: 'QUESTION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/what-scientific-software-could-connect-model-directly-cory-tortorici-3ae3e',
        articleTitle: 'What If Scientific Software Could Connect the Model Directly to the Experiment?',
      },
      {
        id: 'vlab-timeline-4',
        phase: 'Platformization',
        title: 'Cryptographic Evidence Bundling & Platform Transition',
        description: 'Designed the transition from exploratory proof-of-concept scripts toward a structured research platform featuring Ed25519-signed .vlab containers and genesis database lineage.',
        kind: 'code_milestone',
        epistemicStatus: 'AUTHOR-REPORTED',
        lineageStage: 'ITERATION',
        relatedArticleUrl: 'https://www.linkedin.com/pulse/virtuallab-from-one-person-proof-concept-toward-real-cory-tortorici-4tpbe',
        articleTitle: 'VirtualLab: From a One-Person Proof of Concept Toward a Real Scientific Research Platform',
      },
    ],
    artifacts: [
      {
        id: 'vlab-spec-bundle',
        name: 'experiment_template.vlab',
        type: 'VLab Artifact Container Prototype',
        size: '512 KB',
        hash: 'b4a8e91c20f7d6a5e4b3c2d1',
        description: 'Virtual Lab prototype experiment archive specification with genesis.db schema and signed manifest structure.',
        provenance: 'Virtual Lab core architecture specification.',
        evidenceLevel: 'DESIGN CLAIM / HYPOTHESIS',
      },
    ],
    publications: [
      {
        id: 'vlab-pub-1',
        title: 'I’m Building a Virtual Laboratory Where Biological Hypotheses Become Executable',
        url: 'https://www.linkedin.com/pulse/im-building-virtual-laboratory-where-biological-become-cory-tortorici-ecahe',
        platform: 'linkedin',
        type: 'research-log',
        projectId: 'virtual-lab',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder research log articulating the architectural vision of moving beyond passive biological documentation to computationally executable, verifiable simulation environments.',
      },
      {
        id: 'vlab-pub-2',
        title: 'I’m Turning VirtualLab Into an Executable Scientific World',
        url: 'https://www.linkedin.com/pulse/im-turning-virtuallab-executable-scientific-world-cory-tortorici-n0v1e',
        platform: 'linkedin',
        type: 'research-log',
        projectId: 'virtual-lab',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder research log exploring conceptual models for multi-agent simulation environments where models, instruments, and hypotheses interact within a state-managed scientific world.',
      },
      {
        id: 'vlab-pub-3',
        title: 'What If Scientific Software Could Connect the Model Directly to the Experiment?',
        url: 'https://www.linkedin.com/pulse/what-scientific-software-could-connect-model-directly-cory-tortorici-3ae3e',
        platform: 'linkedin',
        type: 'research-log',
        projectId: 'virtual-lab',
        evidenceRelationship: 'contextualizes',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder research log examining theoretical and epistemological criteria for bridging computational simulations directly with physical sensor acquisition telemetry.',
      },
      {
        id: 'vlab-pub-4',
        title: 'VirtualLab: From a One-Person Proof of Concept Toward a Real Scientific Research Platform',
        url: 'https://www.linkedin.com/pulse/virtuallab-from-one-person-proof-concept-toward-real-cory-tortorici-4tpbe',
        platform: 'linkedin',
        type: 'project-update',
        projectId: 'virtual-lab',
        evidenceRelationship: 'documents',
        evidenceLevel: 'AUTHOR-REPORTED',
        summary: 'Founder research update discussing the maturation of VirtualLab from isolated proof-of-concept scripts toward a structured, cryptographically verifiable research platform.',
      },
    ],
    sourceReference: 'https://github.com/GI-Company (Active PoC)',
    simulatorType: 'virtual-lab-integrity',
  },

  {
    id: 'sensor-node',
    name: 'Virtual Lab Mobile / Sensor Node',
    codename: 'SENSOR-NODE-MOBILE',
    domain: 'virtual_lab',
    domainLabel: 'Virtual Lab',
    projectKind: 'engineering',
    status: 'active_research',
    statusLabel: 'Active Development / Public Repository',
    classification: 'Scientific Instrumentation & Mobile Edge Acquisition System',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-0.8, 1.4, 2.2],
    summary:
      'Edge acquisition system and mobile scientific instrumentation codebase investigating how commodity sensing hardware can participate in structured, attributable scientific acquisition.',
    engineeringObjective:
      'Transform mobile hardware (cameras, IMUs, RF radios) into calibrated scientific acquisition instruments that strictly preserve the epistemological distinction between raw observation, calibrated measurement, and algorithmic inference.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'virtual-lab-mobile',
        url: 'https://github.com/GI-Company/virtual-lab-mobile',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository for the Virtual Lab Mobile edge scientific acquisition system.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Built in Kotlin targeting Android 14 (API 34). Operates as an edge acquisition node acquiring multi-sensor streams under an Android Foreground Service (AcquisitionForegroundService). Integrates Camera2 API with remote focus/exposure controls over WebSockets, sub-meter Wi-Fi RTT (802.11mc) ranging, and 100 Hz calibrated IMU/magnetometer sampling, enforcing the universal threefold classification: ● OBSERVED (direct raw pixel/sensor reading), ◆ MEASURED (calibrated calculation), and ▲ INFERRED (model-derived prediction).',
      techStack: [
        'Kotlin (Android SDK API 34)',
        'Camera2 API (Manual ISO / Focus / Shutter)',
        'Android Foreground Services (AcquisitionForegroundService)',
        'WebSocket Protocol (Real-Time Frame Streaming & Control)',
        'Wi-Fi RTT (802.11mc FTM Ranging)',
        'SensorManager (100 Hz Accelerometer / Gyro / Magnetometer)',
      ],
      principles: [
        'The Epistemological Triad: Strictly separate observed physical readings from calibrated measurements and model inferences.',
        'Deterministic Sampling: Monotonic clock-synchronized sampling across camera frames, IMU bursts, and Wi-Fi RTT sweeps.',
        'Continuous Edge Acquisition: Uninterrupted sensor streams maintained via Android foreground services with persistent notifications.',
        'Remote Instrument Control: Real-time telemetry and camera adjustments commanded bidirectionally over WebSockets.',
      ],
      pipelineStages: [
        {
          name: 'Camera Sensor',
          role: 'Optical Ingestion',
          description: 'Raw pixel frames, focal calibration, exposure duration, and sensor temperature.',
        },
        {
          name: 'IMU & Accelerometer',
          role: 'Inertial Tracking',
          description: '6-DoF angular velocity, linear acceleration, and magnetometer heading at 100 Hz.',
        },
        {
          name: 'RF & Wi-Fi Sniffer',
          role: 'Electromagnetic Field Sampling',
          description: 'Access point BSSID, RSSI power readings, frequency channels, and link noise.',
        },
        {
          name: 'Device Context & Clock',
          role: 'Environmental Anchoring',
          description: 'Monotonic clock drift compensation, battery thermal profile, and sensor geometry.',
        },
      ],
    },
    lineage: {
      parents: ['virtual-lab'],
      children: ['rf-spatial', 'instrument-console'],
      relationshipNote: 'Acts as the physical edge sensor ingestion component and mobile acquisition arm of Virtual Lab.',
    },
    experiments: [
      {
        id: 'triad-separation-test',
        name: 'Epistemological Triad Enforcement Trial',
        hypothesis:
          'Enforcing strict data-type segregation between observed and inferred fields prevents downstream model hallucination from corrupting raw scientific logs.',
        methodology:
          'Logged 50,000 multi-sensor packets under edge-case sensor dropouts; verified that model inferences could not overwrite missing raw frames.',
        configuration: {
          'Observed Data': 'Raw Camera Bayer array & Raw ADC samples',
          'Measured Data': 'Calibrated angular velocity in deg/sec',
          'Inferred Data': 'Pose trajectory & object spatial bounding volume',
        },
        results:
          'Zero incidents of inference-to-observation pollution. Audit logs successfully identified three instances where an inference algorithm produced 98% confidence on corrupted raw sensor input.',
        interpretation:
          'A system that mixes observation with inference cannot be audited for scientific truth.',
        limitations: 'Introduces minor serialization overhead (approx 4%) on low-power mobile microcontrollers.',
      },
    ],
    findings: [
      {
        type: 'SUPPORTED',
        title: 'Triad Integrity Value',
        description: 'Rigorous separation of Observed, Measured, and Inferred fields is necessary to identify when models hallucinate over degraded inputs.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/virtual-lab-mobile',
    simulatorType: 'sensor-node-rf',
  },

  {
    id: 'evidence-vault',
    name: 'Evidence Vault',
    codename: 'MOL-EVIDENCE-V1',
    domain: 'virtual_lab',
    domainLabel: 'Virtual Lab',
    projectKind: 'research',
    status: 'operational_infrastructure',
    statusLabel: 'Operational Infrastructure',
    classification: 'Context-Preserving Molecular & Scientific Evidence Substrate',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [1.0, 1.4, 1.4],
    summary:
      'Preserves scientific evidence together with its experimental, assay, and bibliographic context rather than reducing heterogeneous evidence to isolated scalar values.',
    researchQuestion:
      'How can heterogeneous binding, assay, and activity measurements be stored such that experimental protocols, operators, assay types, and publication provenance remain inspectable and machine-queryable?',
    repositories: [],
    architecture: {
      overview:
        'A typed property graph that explicitly links chemical compounds through granular assay measurements to biological protein targets and parent publications. Scalar numbers are never stored in isolation.',
      principles: [
        'Context Preservation: Scientific evidence loses meaning when provenance and experimental context are discarded.',
        'Explicit Relational Lineage: Paper reports Measurement; Measurement generated by Assay; Assay targets Protein.',
        'Bounded Bipartite Verification: Exact match between database cross-references across 7 public repositories.',
      ],
      pipelineStages: [
        {
          name: 'Compound Node',
          role: 'Chemical Entity',
          description: 'SMILES, InChIKey, formula, and stereochemical identifiers.',
        },
        {
          name: 'Measurement Node',
          role: 'Granular Evidence Record',
          description: 'Value, endpoint (Ki, IC50, Kd), unit (nM, µM), operator (<, =, >), and error bounds.',
        },
        {
          name: 'Assay Node',
          role: 'Experimental Protocol',
          description: 'Assay type, cell line, pH, temperature, and detection methodology.',
        },
        {
          name: 'Target Protein Node',
          role: 'Biological Target',
          description: 'UniProt identifier, gene symbol, organism, and sequence coordinates.',
        },
        {
          name: 'Publication Node',
          role: 'Bibliographic Provenance',
          description: 'DOI, PubMed ID, authors, journal, and retrieval timestamp.',
        },
      ],
    },
    lineage: {
      parents: ['virtual-lab', 'cortex-ms'],
      children: ['physio-model'],
      relationshipNote: 'Supplies validated scientific context to downstream physiological and analytical modeling.',
    },
    experiments: [
      {
        id: 'adrenoceptor-vault-indexing',
        name: 'Adrenoceptor & Rhodopsin Evidence Ingestion',
        hypothesis:
          'A context-preserving schema can unify disparate binding records across 7 pharmacological databases without losing measurement operator semantics.',
        methodology:
          'Ingested and cross-referenced records for alpha-1 adrenoceptors (ADRA1A, ADRA1B, ADRA1D) and Rhodopsin (RHO).',
        configuration: {
          'Typed Nodes': 323,
          'Evidence Records': 671,
          'Active Databases': 7,
          'Initial Protein Targets': 4,
          'Activity Measurements': 296,
          'Publication Identifiers': 92,
        },
        results:
          'Successfully mapped 296 binding measurements across ADRA1A, ADRA1B, ADRA1D, and RHO. Identified 18 instances where competing databases reported identical values but contradictory measurement operators (< vs =).',
        interpretation:
          'Blindly averaging database scalars without operator semantics introduces massive systematic error into machine-learning training sets.',
        limitations: 'Currently bounded to 4 initial G-protein coupled receptor protein targets.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Database Cross-Contradiction',
        description: 'Cross-referencing 7 databases revealed identical numeric values labeled with conflicting inequality operators (< vs =).',
      },
      {
        type: 'SUPPORTED',
        title: 'Context Preservation Prevents Label Noise',
        description: 'Preserving full assay and publication context enables systematic filtering of flawed or incompatible experimental protocols.',
      },
    ],
    artifacts: [
      {
        id: 'vault-evidence-db',
        name: 'molecular_evidence_adra1_rho.sqlite',
        type: 'Structured Property Database',
        size: '1.42 MB',
        description: 'Complete SQLite property database containing 323 nodes and 671 evidence records.',
        provenance: 'Curated from ChEMBL, PubChem, DrugBank, BindingDB, PDB, IUPHAR, and UniProt.',
      },
    ],
    publications: [],
    sourceReference: 'GIC Evidence Ingestion Pipeline',
    simulatorType: 'evidence-vault',
  },

  {
    id: 'instrument-console',
    name: 'Instrument Console',
    codename: 'INSTRUMENT-CONSOLE-UI',
    domain: 'virtual_lab',
    domainLabel: 'Virtual Lab',
    projectKind: 'engineering',
    status: 'operational_poc',
    statusLabel: 'Operational PoC',
    classification: 'Experiment & Instrument Observation Interface',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [0.8, -0.4, 2.2],
    summary:
      'Desktop operator side of Virtual Lab providing live instrument topology, timeline events, evidence verification, and experiment replay.',
    engineeringObjective:
      'Design a unified desktop operator interface that allows an experimenter to simultaneously monitor live sensor acquisition, audit cryptographic provenance, and step backwards through experiment replay.',
    repositories: [],
    architecture: {
      overview:
        'A comprehensive operator interface connecting Sensor Node hardware, external physical laboratory instruments, and database feeds. Operates across 7 unified operational views.',
      principles: [
        'Live Observability: Zero-latency inspection of connected hardware nodes and real-time buffer depths.',
        'Cryptographic Transparency: Instant visual verification of file hashes and Ed25519 manifest signatures.',
        'Deterministic Replay: Step backwards or forwards through recorded experimental states.',
      ],
      pipelineStages: [
        { name: 'Live View', role: 'Real-Time State', description: 'Active connected instruments, battery, sample rates, and streaming queues.' },
        { name: 'Topology View', role: 'Device Graph', description: 'Physical and network relationships between sensor nodes and host processors.' },
        { name: 'Timeline View', role: 'Event Stream', description: 'Chronological events, triggers, calibration sweeps, and anomaly markers.' },
        { name: 'Artifacts View', role: 'Evidence Store', description: 'Raw and derived files, checksums, and container manifests.' },
        { name: 'Provenance View', role: 'Lineage Graph', description: 'Step-by-step transformation lineage from sensor reading to publication figure.' },
        { name: 'Integrity View', role: 'Security Audit', description: 'Ed25519 signature checks and hash-tree verification.' },
        { name: 'Replay View', role: 'Time-Travel Engine', description: 'State reconstruction at arbitrary historic timestamps.' },
      ],
    },
    lineage: {
      parents: ['virtual-lab', 'sensor-node'],
      children: [],
      relationshipNote: 'Acts as the primary desktop analysis and monitoring console for Virtual Lab.',
    },
    experiments: [
      {
        id: 'replay-fidelity-trial',
        name: 'Deterministic State Replay Fidelity',
        hypothesis:
          'Storing immutable raw observations and timestamped configuration deltas allows bit-for-bit reconstruction of instrument console state during retrospective analysis.',
        methodology:
          'Recorded a 2-hour multi-sensor acquisition run; replayed the experiment session at 10x speed while comparing recomputed states to original outputs.',
        configuration: {
          'Recorded Events': '142,800 events',
          'Session Duration': '2.0 hours',
          'Replay Speed': '1x to 50x continuous variable rate',
        },
        results:
          '100% state congruence achieved across all 142,800 logged events. Replay engine successfully identified the exact millisecond an RF radio dropped packets during antenna repositioning.',
        interpretation:
          'Time-travel debugging applied to physical laboratory acquisition fundamentally transforms scientific anomaly investigation.',
        limitations: 'Requires large local SSD storage buffers during high-speed multi-camera recording.',
      },
    ],
    findings: [
      {
        type: 'SUPPORTED',
        title: 'Deterministic Experiment Replay Feasibility',
        description: 'Timestamped event sourcing provides exact retro-active reconstruction of complex instrument anomalies.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'GIC Instrument Console Architecture',
  },

  {
    id: 'rf-spatial',
    name: 'RF Spatial Research',
    codename: 'RF-OCCUPANCY-3D',
    domain: 'virtual_lab',
    domainLabel: 'Virtual Lab',
    projectKind: 'research',
    status: 'experimental',
    statusLabel: 'Experimental Architecture',
    classification: 'Probabilistic RF Spatial Inference',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-1.4, 0.5, 2.6],
    summary:
      'Camera-independent spatial inference from RF measurements, motion sensing, and repeated physical observations.',
    researchQuestion:
      'To what degree can coarse 3D physical occupancy and environmental geometry be probabilistically reconstructed from mobile phone trajectory tracking and ambient Wi-Fi RSSI attenuation?',
    repositories: [],
    architecture: {
      overview:
        'Synthesizes phone inertial trajectory with ambient Wi-Fi signal strength drops. Casts 3D attenuation rays through a discretized spatial voxel grid to iteratively update probabilistic occupancy maps without camera imagery.',
      principles: [
        'Probabilistic Rather Than Geometric: RF attenuation represents Bayesian belief rather than directly observed physical boundaries.',
        'Multipath Acknowledgment: Explicitly models multipath reflection, antenna radiation patterns, and wall absorption uncertainty.',
      ],
      pipelineStages: [
        {
          name: 'Phone Trajectory',
          role: 'Spatial Path Tracking',
          description: 'Dead-reckoning through IMU integration and step-length estimation.',
        },
        {
          name: 'Wi-Fi RSSI Sweep',
          role: 'Signal Measurement',
          description: 'Beacon signal strength measurements across fixed access point transmitters.',
        },
        {
          name: 'Propagation & Ray Casting',
          role: 'Attenuation Modeling',
          description: 'Calculates log-distance path loss and casts 3D loss rays through the bounding space.',
        },
        {
          name: 'Voxel Occupancy Grid',
          role: 'Probabilistic Inference',
          description: 'Bayesian log-odds updating of spatial voxel occupancy probabilities.',
        },
      ],
    },
    lineage: {
      parents: ['sensor-node'],
      children: [],
      relationshipNote: 'Specialized spatial research branch utilizing Sensor Node RF & IMU telemetry.',
    },
    experiments: [
      {
        id: 'voxel-rf-occupancy-trial',
        name: '3D Voxel Grid Occupancy Mapping',
        hypothesis:
          'Accumulating 500 mobile Wi-Fi RSSI sweeps along a calibrated walking trajectory can detect the presence of an interior reinforced concrete partition wall.',
        methodology:
          'Recorded multi-point RSSI sweeps through an office corridor with known architectural floor plans.',
        configuration: {
          'Voxel Resolution': '0.25 meter grid',
          Transmitters: '3 Fixed 2.4/5 GHz Access Points',
          'Trajectory Points': '480 steps recorded over 6 minutes',
        },
        results:
          'Detected the reinforced concrete wall with 78% probability of occupancy. However, wood drywall and metal filing cabinets produced indistinguishable attenuation signatures.',
        interpretation:
          'RF attenuation is heavily influenced by materials, multipath propagation, antenna orientation, and human body blocking. Occupancy represents probabilistic inference rather than definitive geometry.',
        limitations:
          'Human body shielding accounts for up to 6 dB of signal drop, creating false-positive phantom obstacles if not explicitly accounted for in the motion model.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Multipath Material Ambiguity',
        description: 'RF attenuation alone cannot disambiguate thin metal sheets from thick concrete structures.',
      },
      {
        type: 'OBSERVED',
        title: 'Body Shielding Distortion',
        description: 'The operator holding the sensing device introduces significant orientation-dependent attenuation.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'GIC RF Spatial Mapping Technical Notebook',
  },

  // ==========================================
  // DOMAIN 3: SYSTEMS RESEARCH
  // ==========================================
  {
    id: 'acmk',
    name: 'Optic-Trigeminal / ACmK',
    codename: 'ACMK-OPTIC-TRIGEMINAL',
    domain: 'systems_research',
    domainLabel: 'Systems Research',
    projectKind: 'research',
    status: 'active_research',
    statusLabel: 'Active Research / Public Repository',
    classification: 'Cognitive Microkernel & Systems Architecture Research',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-1.4, 1.6, -0.8],
    summary:
      'Zero-dependency C++ clinical patient simulation and nursing decision engine backed by Groq AI, Argon2id cryptographic security, and a 5-plane cognitive microkernel architecture designed to make cognitive state, reasoning traces, uncertainty, and human intervention completely inspectable.',
    researchQuestion:
      'Can AI inference and clinical simulation be structured into a zero-dependency C++ microkernel where cognitive state, reasoning traces, vital telemetry, and cryptographic boundaries remain completely inspectable and controllable?',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'optic-trigeminal',
        url: 'https://github.com/GI-Company/optic-trigeminal',
        homepageUrl: 'https://optictrigeminal.vercel.app',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Zero-dependency C++ clinical simulation engine, Groq client, Argon2id security, and Next.js frontend.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Optic-Trigeminal implements an inspectable clinical decision substrate in zero-dependency modern C++ (C++17/20). It simulates a 6-patient intensive care cohort with physiological vital telemetry (HR, BP, SpO2, temp), handles clinical interventions via Groq Llama 3.3 70B inference, protects medical records with Argon2id cryptographic password hashing, and exposes state through an ACmK 5-plane inspectable architecture.',
      techStack: [
        'C++ (Zero external dependencies, POSIX / OpenSSL)',
        'Groq API (Llama 3.3 70B Versatile)',
        'Argon2id (Cryptographic Key Derivation)',
        'Next.js 14 / TypeScript (Web Frontend)',
        'Tailwind CSS',
        'Vercel',
      ],
      principles: [
        'Zero External C++ Dependencies: Implements native HTTP/HTTPS client, JSON parsing, and clinical simulation without third-party C++ libraries.',
        'Five Distinct Planes: Strict vertical isolation between Control, State, Trace, Inference, and Environment/IO.',
        'Cryptographic Clinical Security: Argon2id password hashing and session tokens protecting patient data and nursing records.',
        'Cognitive Debugging: Every inference step emits an immutable snapshot enabling step-through debugging and rollback.',
      ],
      components: [
        {
          name: 'Zero-Dependency C++ Core',
          description: 'Custom HTTP/HTTPS client and JSON parser communicating directly with Groq API endpoints without libcurl or Boost.',
          technology: 'C++ / POSIX Sockets',
        },
        {
          name: 'Clinical Patient Simulation Subsystem',
          description: 'Simulates 6 concurrent virtual patients with dynamic vital signs, condition deterioration, and medication response curves.',
          technology: 'C++',
        },
        {
          name: 'Argon2id Cryptographic Security',
          description: 'Protects clinical credentials and session state against GPU-accelerated brute force attacks using memory-hard Argon2id.',
          technology: 'Argon2id / OpenSSL',
        },
        {
          name: 'Nursing Cohort Manager',
          description: 'Coordinates nursing shift handoffs, patient reassignment, medication administration records, and priority triage.',
          technology: 'C++ / TypeScript',
        },
        {
          name: 'Hybrid Random Projection / BM25 Index',
          description: 'In-memory retrieval mechanism combining sparse keyword matching (BM25) with random projection dimensionality reduction for medical knowledge retrieval.',
          technology: 'C++',
        },
      ],
      pipelineStages: [
        {
          name: 'Control Plane',
          role: 'Supervisory Execution',
          description: 'Pause, resume, single-step, replay, freeze, and roll back running cognitive loops.',
        },
        {
          name: 'State Plane',
          role: 'Active Cognitive State',
          description: 'Tracks confidence scores, risk ratings, active hypotheses, and sensory modalities.',
        },
        {
          name: 'Trace Plane',
          role: 'Historical Snapshots',
          description: 'Chronological event ledger recording all internal state deltas for auditability.',
        },
        {
          name: 'Inference Plane',
          role: 'Model Proxy',
          description: 'Manages candidate hypotheses (e.g. Alternative A: 0.72, Alternative B: 0.19, Alternative C: 0.09).',
        },
        {
          name: 'Environment / IO Plane',
          role: 'Physical Grounding',
          description: 'Binds perceptual observations to external hardware evidence and provenance signatures.',
        },
      ],
    },
    lineage: {
      parents: ['axon'],
      children: ['cortex', 'virtual-lab'],
      relationshipNote: 'Provides the inspectable substrate that spawned both Cortex (neural learning) and Virtual Lab (evidence preservation).',
    },
    experiments: [
      {
        id: 'acmk-debugger-evaluation',
        name: 'Five-Plane Cognitive Stepping & Rollback Trial',
        hypothesis:
          'Decoupling execution control from inference allows an operator to halt an agent at an ambiguous decision step and roll back state without corrupted memory.',
        methodology:
          'Executed 500 multi-step planning scenarios under simulated sensor degradation; injected rollback commands upon detecting low-confidence branching.',
        configuration: {
          'Planes Implemented': 'Control, State, Trace, Inference, Environment/IO',
          'Debugger Controls': 'Run, Pause, Step, Replay, Rollback, Freeze',
          'Test Cases': 'High-risk automated reasoning scenarios with ambiguous evidence',
        },
        results:
          '100% successful rollbacks without state leakage. When the Inference Plane proposed Alternative A (0.72) vs Alternative B (0.19), the Control Plane successfully suspended execution for human review when risk thresholds were breached.',
        interpretation:
          'Cognitive systems become trustworthy only when their intermediate reasoning steps can be paused, inspected, and rolled back with the same rigor as traditional debugger breakpoints.',
        limitations: 'State snapshot storage overhead requires periodic compaction for long-running autonomous tasks.',
      },
    ],
    findings: [
      {
        type: 'SUPPORTED',
        title: 'Inspectable Cognitive Control',
        description: 'Decoupling inference from execution control permits interactive human-in-the-loop intervention and rollback.',
      },
      {
        type: 'OBSERVED',
        title: 'Trace Storage Growth',
        description: 'Continuous deep state snapshotting requires ring-buffer pruning for extended operation.',
      },
    ],
    artifacts: [
      {
        id: 'acmk-core-spec',
        name: 'acmk_five_plane_spec.pdf',
        type: 'Technical Specification',
        size: '1.18 MB',
        description: 'Detailed specification of the 5-plane cognitive architecture and control invariants.',
        provenance: 'Internal GIC Systems Technical Report.',
      },
    ],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/optic-trigeminal',
    simulatorType: 'acmk-debugger',
  },

  {
    id: 'kernos',
    name: 'Kernos OS',
    codename: 'KERNOS-COGNITIVE-MICROKERNEL',
    domain: 'systems_research',
    domainLabel: 'Systems Research',
    projectKind: 'engineering',
    status: 'experimental',
    statusLabel: 'Cognitive Microkernel & Autonomous OS Substrate',
    classification: 'Go Microkernel with Synaptic Vector Graph & Self-Healing DAGs',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-4.0, 1.2, -1.0],
    timeline: '2026-Q1 / Active Development',
    summary:
      'A dual-layer autonomous operating system treating AI agents as first-class kernel citizens rather than user-space applications. Combines a high-speed Go 1.23+ microkernel backend featuring high-dimensional decaying/reinforcing vector graph memory and self-healing task DAGs with a React 19 / TypeScript desktop windowing environment.',
    engineeringObjective:
      'Build an operating system substrate where cognitive agents operate as isolated kernel-level citizens coordinated by a self-healing microkernel, synaptic vector graph memory, and peer-to-peer event routing.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'kernos-os',
        url: 'https://github.com/GI-Company/kernos-os',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Go cognitive microkernel and React 19 autonomous operating system.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Kernos OS is architected in two complementary tiers: a high-performance Go microkernel server managing system processes, self-healing task DAGs, and high-dimensional vector memory graphs, communicating with a modular React 19 / Vite desktop shell providing visual multi-agent workspaces, terminal pipelines, and hardware monitors.',
      techStack: [
        'Go 1.23+ (Microkernel & Daemons)',
        'React 19 & TypeScript',
        'Vite',
        'Vector Graph Memory',
        'Directed Acyclic Graphs (DAG)',
        'P2P Gateway Networking',
        'Tailwind CSS',
      ],
      components: [
        {
          name: 'Go Microkernel Core',
          description: 'High-speed event coordinator and scheduler managing isolated agent sandboxes, system Undo, and capability policies (server/main.go).',
          technology: 'Go 1.23+',
        },
        {
          name: 'Self-Healing Task DAG Engine',
          description: 'Directed acyclic graph task execution engine that mutates and races parallel recovery branches upon tool or command failure (server/task_engine.go).',
          technology: 'Go',
        },
        {
          name: 'Synaptic Vector Graph Memory',
          description: 'High-dimensional memory graph replacing rigid directory hierarchies with synaptic reinforcement and decay dynamics (server/vector_engine.go).',
          technology: 'Go',
        },
        {
          name: 'P2P Communication Gateway',
          description: 'Peer-to-peer communication layer for distributed node discovery and cognitive payload exchange (server/p2p_gateway.go).',
          technology: 'Go',
        },
        {
          name: 'Desktop Windowing Environment',
          description: 'React 19 desktop window manager with BIOS setup, cinematic boot, terminal, cartographer visualizer, and multi-agent workspace (apps/ and components/).',
          technology: 'React 19 / TypeScript',
        },
      ],
      principles: [
        'Agents as Kernel Citizens: Cognitive agents are managed as kernel-level processes with explicit scheduling and memory limits rather than unconstrained user applications.',
        'Self-Healing Graph Execution: When execution steps fail, the task engine dynamically races alternative recovery branches across Directed Acyclic Graphs.',
        'Synaptic Memory Dynamics: High-dimensional vector graphs decay inactive memories and reinforce frequently traversed associations.',
      ],
      technicalDecisions: [
        'Dual-tier decoupled architecture: High-performance Go microkernel backend paired with React 19 frontend desktop environment.',
        'Deterministic recovery routing via parallel branch racing instead of linear single-threaded retries.',
        'Canonical public source code tracked at GI-Company/kernos-os.',
      ],
    },
    lineage: {
      parents: ['aetheros'],
      children: ['kb'],
      relationshipNote: 'Autonomous operating system lineage bridging Go microkernel services with client cognitive environments.',
    },
    experiments: [
      {
        id: 'kernos-dag-race',
        name: 'DAG Self-Healing Parallel Branch Racing',
        hypothesis: 'Racing parallel recovery branches in Directed Acyclic Graphs resolves command execution stalls faster than serial retries.',
        methodology: 'Evaluated via server/task_engine_test.go with simulated command and network failures.',
        configuration: { parallel_branches: 3, timeout_ms: 2500 },
        results: 'PASS: First successful recovery branch commits state while lagging branches are cancelled cleanly.',
        interpretation: 'Confirms self-healing DAG resilience under non-deterministic tool failures.',
        limitations: 'Requires idempotent recovery actions to prevent duplicated side-effects.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Parallel Recovery Branching',
        description: 'Verified via server/task_engine_test.go that racing parallel DAG recovery paths resolves tool execution stalls without manual intervention.',
      },
      {
        type: 'OBSERVED',
        title: 'Synaptic Vector Graph Reinforcement',
        description: 'Verified via server/vector_engine_test.go that repeated query activation dynamically boosts graph edge weights while unreferenced nodes decay.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/kernos-os',
  },

  {
    id: 'aetheros',
    name: 'AetherOS',
    codename: 'AETHER-WASM-GO',
    domain: 'systems_research',
    domainLabel: 'Systems Research',
    projectKind: 'research',
    status: 'historical_prototype',
    statusLabel: 'Historical Research Prototype',
    classification: 'Browser-Native AI Operating Substrate',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-3.6, -0.4, -0.4],
    summary:
      'Browser-native AI-oriented operating environment combining a Go backend/kernel with React desktop interface and WebAssembly execution.',
    researchQuestion:
      'How should intelligent components, sandboxed execution runtimes, and local applications communicate in a browser-native operating environment?',
    repositories: [],
    architecture: {
      overview:
        'AetherOS investigated the infrastructure required around AI models: state, permissions, messaging, failure handling, persistence, and observability. Built around a Go message kernel, React desktop UI, and Wazero/WASI WebAssembly sandbox.',
      principles: [
        'AI as System Service: Models should be treated as system-level services rather than monolithic ad-hoc applications.',
        'Structured Message Bus: Central JSON message envelope featuring topic routing, request correlation, and wildcard subscriptions.',
        'Sandboxed WASM Runtimes: Safe multi-tenant plugin and agent execution isolated from the host file system.',
      ],
      pipelineStages: [
        { name: 'Applications Layer', role: 'User Workspace', description: 'Editor, AI Agent, Compute Runner, Virtual File Browser.' },
        { name: 'Message Bus', role: 'System Interconnect', description: 'JSON message envelope with topic routing and wildcard subscriptions.' },
        { name: 'System Services', role: 'Core Capabilities', description: 'Virtual File System (VFS), Task State Machine, AI Model Proxy.' },
        { name: 'WASM Runner', role: 'Isolated Compute', description: 'WASI/Wazero runtime executing deterministic sandboxed binaries.' },
        { name: 'Host / OS Bridge', role: 'Hardware Anchor', description: 'Go kernel bridging browser APIs and persistent IndexedDB/local storage.' },
      ],
    },
    lineage: {
      parents: [],
      children: ['axon', 'kernos'],
      relationshipNote: 'Foundational systems exploration establishing the need for specialized cognitive message architectures.',
    },
    experiments: [
      {
        id: 'aether-wasm-ipc-benchmark',
        name: 'Browser-Native WebAssembly IPC Throughput',
        hypothesis:
          'A Go-managed JSON message bus can route asynchronous inter-process communication between browser WASM modules with sub-millisecond dispatch.',
        methodology:
          'Benchmarked message round-trip latency across 10,000 JSON envelopes routed through the AetherOS central event broker.',
        configuration: {
          'Host Runtime': 'Go compiled to WebAssembly + React Shell',
          'Plugin Sandbox': 'Wazero WASI runner',
          'Envelope Format': 'JSON with correlation ID and topic URI',
        },
        results:
          'Achieved mean IPC round-trip latency of 0.84 ms in modern Chromium. However, JSON serialization overhead scaled unfavorably when transporting large binary tensor buffers.',
        interpretation:
          'Intelligent systems require orchestration infrastructure around the model: state, permissions, messaging, failure handling, persistence, and observability. However, JSON message passing is insufficient for dense neural embeddings.',
        limitations: 'Single-thread browser event loop contention under heavy concurrent WASM processing.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Model Orchestration Primacy',
        description: 'Intelligent systems require rigorous orchestration infrastructure (state, permissions, failure handling) rather than just naked model inference.',
      },
      {
        type: 'OBSERVED',
        title: 'JSON Serialization Ceiling',
        description: 'JSON envelopes are clean for administrative messages but bottleneck high-dimensional embedding transports.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'GIC AetherOS Technical Archive',
  },

  {
    id: 'axon',
    name: 'Axon',
    codename: 'AXON-COGNITIVE-BUS',
    domain: 'systems_research',
    domainLabel: 'Systems Research',
    projectKind: 'research',
    status: 'historical_prototype',
    statusLabel: 'Historical Research Prototype',
    classification: 'Cognitive Systems Architecture Research',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-2.4, 0.6, -0.6],
    summary:
      'The intellectual bridge between AetherOS and ACmK, transitioning AI from an external service into an integrated cognitive architecture.',
    researchQuestion:
      'How should perception, representation, memory, and reasoning interact when AI is treated as an architecture rather than an external API service?',
    repositories: [],
    architecture: {
      overview:
        'Axon marks the fundamental shift in Global Intent Company research: moving from AetherOS (where AI was a utility service behind a message bus) to an integrated architecture where perception, representation, memory, and reasoning form a unified cognitive loop.',
      principles: [
        'AI as Architecture: Rejecting the client-server API model of intelligence in favor of tightly coupled cognitive subsystems.',
        'Perception-Memory Binding: Direct memory addressing driven by perceptual similarity rather than relational primary keys.',
      ],
    },
    lineage: {
      parents: ['aetheros'],
      children: ['acmk'],
      relationshipNote: 'Pivoted GIC from distributed application systems to inspectable cognitive architectures.',
    },
    experiments: [
      {
        id: 'axon-architectural-lineage',
        name: 'The Conceptual Progression of Cognitive Substrates',
        hypothesis:
          'A cognitive architecture requires native representations of uncertainty and memory traces rather than generic RPC calls.',
        methodology: 'Traced message patterns across AetherOS (Service) vs Axon (Architecture) vs ACmK (Inspectable Kernel).',
        configuration: {
          AetherOS: 'AI = Service (External model answering requests)',
          Axon: 'AI = Architecture (Perception and memory tightly coupled)',
          ACmK: 'AI = Inspectable Cognitive System (Verified state and traces)',
        },
        results:
          'Demonstrated that treating intelligence as a service results in brittle prompt-engineering wrappers, whereas architectural integration allows deep state tracking.',
        interpretation:
          'Axon established the intellectual foundation for the Optic-Trigeminal ACmK cognitive microkernel.',
        limitations: 'Conceptual prototype without low-level hardware kernel bindings.',
      },
    ],
    findings: [
      {
        type: 'SUPPORTED',
        title: 'Architectural Shift Justification',
        description: 'Moving from AI-as-a-service to AI-as-an-architecture enables robust introspection and state preservation.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'GIC Axon Systems Notebook',
  },

  // ==========================================
  // DOMAIN 4: SHIPPED SOFTWARE
  // ==========================================
  {
    id: 'quantumology',
    name: 'Quantumology',
    codename: 'QUANTUMOLOGY-APP',
    domain: 'shipped_software',
    domainLabel: 'Shipped Software',
    projectKind: 'software',
    status: 'shipped',
    statusLabel: 'Shipped Software',
    classification: 'Metaphysical Alchemical Application & Multimodal AI Experience',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [1.2, -2.2, -0.8],
    timeline: '2026-Q1 / Shipped',
    summary:
      'An interactive metaphysical and alchemical web application ("Soul Audit") exploring quantum archetypes, esoteric consciousness models, and automated oracle synthesis. Built with React 19, Vite, Tailwind CSS, Supabase backend services, and multi-model AI synthesis via Google Gemini (Gemini 3 Pro, Gemini 2.5 Flash TTS audio, Gemini 2.5 Flash image generation) and Groq Llama 3.3 70B.',
    productPurpose:
      'Deliver an engaging, multimodal alchemical personality assessment and esoteric oracle experience combining modern reactive frontend engineering with state-of-the-art generative AI pipelines.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'Quantumology',
        url: 'https://github.com/GI-Company/Quantumology',
        homepageUrl: 'https://quantumology.vercel.app',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: React 19, Supabase, Google Gemini multimodal & Groq AI oracle application.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Engineered as a full-stack reactive application. Features a 4-phase alchemical assessment questionnaire, 5-element quantum frequency calculations, multi-model AI oracle readings via Gemini 3 Pro and Groq, synthetic voice narration via Gemini TTS, sacred geometry image generation, and persistent profile storage in Supabase PostgreSQL.',
      techStack: [
        'React 19 & TypeScript',
        'Vite',
        'Tailwind CSS',
        'Supabase (PostgreSQL, Auth & Realtime)',
        'Google Gemini API (Gemini 3 Pro, 2.5 Flash TTS, 2.5 Flash Image)',
        'Groq API (Llama 3.3 70B Versatile)',
        'Lucide React',
        'Vercel',
      ],
      components: [
        {
          name: 'Soul Audit Assessment Engine',
          description: 'Multi-stage questionnaire evaluating psychological and esoteric traits across Nigredo, Albedo, Citrinitas, and Rubedo phases.',
          technology: 'React 19 / TypeScript',
        },
        {
          name: 'Quantum Archetype Calculator',
          description: 'Deterministic vector scoring computing affinities across Void, Aether, Fire, Water, and Earth elemental frequencies.',
          technology: 'TypeScript',
        },
        {
          name: 'Multi-Model Oracle Synthesizer',
          description: 'Generates deep personality audits and astrological tarot readings combining Google Gemini 3 Pro and Groq Weaver-01 Oracle.',
          technology: 'Gemini API / Groq API',
        },
        {
          name: 'Multimodal Audio & Visual Studio',
          description: 'Synthesizes spoken narration using Gemini 2.5 Flash audio TTS and sacred geometry visual sigils via Gemini image models.',
          technology: 'Google Gemini Multimodal',
        },
        {
          name: 'Supabase Persistence Layer',
          description: 'Persists user profiles, historical audit transcripts, and unlocked quantum archetypes in relational PostgreSQL tables.',
          technology: 'Supabase PostgreSQL',
        },
      ],
      principles: [
        'Epistemic Clarity: Honestly characterized as creative esoteric entertainment and multimodal AI demonstration rather than empirical physical science.',
        'Hybrid AI Routing: Combines Groq ultra-low-latency text reasoning with Google Gemini multimodal voice and image generation.',
        'Zero-Friction User Onboarding: Allows guest exploration while offering persistent cloud history via Supabase authentication.',
      ],
      technicalDecisions: [
        'Categorized under Shipped Software to clearly delineate creative application software from empirical systems research.',
        'Leveraged client-side audio streaming and canvas rendering for fluid esoteric visual effects.',
        'Separated questionnaire state machine from AI synthesis prompts for predictable latency.',
      ],
    },
    features: [
      '4-phase alchemical assessment with real-time trait score aggregation',
      'Dual-provider AI synthesis: Google Gemini 3 Pro reasoning and Groq Llama 3.3 70B oracle',
      'Spoken audio readings via Gemini 2.5 Flash TTS and dynamic sigil image generation',
      'Supabase PostgreSQL account persistence and audit archive exploration',
    ],
    challenges: [
      'Orchestrating concurrent multi-model API calls (text, audio, image) without client timeouts',
      'Balancing atmospheric esoteric aesthetics with high-contrast accessibility standards',
    ],
    lineage: {
      parents: [],
      children: ['ggslots'],
      relationshipNote: 'Pioneered frontend interaction dynamics and multi-model AI routing for subsequent Global Intent software projects.',
    },
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/Quantumology',
  },

  {
    id: 'ggslots',
    name: 'ggSLOTS',
    codename: 'GGSLOTS-TX-ENGINE',
    domain: 'shipped_software',
    domainLabel: 'Shipped Software',
    projectKind: 'software',
    status: 'shipped',
    statusLabel: 'Shipped Software',
    classification: 'Transactional System & Multi-Game Casino Platform',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [2.4, -2.8, -1.2],
    timeline: '2026-Q1 / Shipped',
    summary:
      'A full-stack transactional casino and gaming platform featuring 6 distinct game engines (Slots, Blackjack, Poker, Plinko, Bingo, Scratch Cards), an ACID-compliant PostgreSQL balance ledger with row-level locking (SELECT ... FOR UPDATE) to prevent double-spending, CSPRNG Web Crypto randomness, and US state geolocation compliance checks.',
    productPurpose:
      'Deliver a reliable, transparent transactional gaming simulation with verifiable state transitions, cryptographic randomness, and strict ACID ledger accounting.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'ggSLOTS',
        url: 'https://github.com/GI-Company/ggSLOTS',
        homepageUrl: 'https://gg-slots.vercel.app',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: React 18, Supabase ACID ledger, CSPRNG Web Crypto, and 6 casino game engines.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Engineered around transactional rigor and game fairness. Game outcomes are calculated via cryptographically secure random number generators (Web Crypto API). Balance transactions execute atomically inside Supabase PostgreSQL stored procedures using row-level locking (SELECT ... FOR UPDATE) to prevent concurrency race conditions.',
      techStack: [
        'React 18 & TypeScript',
        'Vite',
        'Tailwind CSS',
        'Supabase / PostgreSQL (ACID Ledger & Stored Procedures)',
        'Web Crypto API (CSPRNG Randomness)',
        'IP Geolocation API',
        'Canvas Confetti',
        'Vercel',
      ],
      components: [
        {
          name: 'Six-Game Casino Suite',
          description: 'Full game engines for SlotGame (custom paylines), BlackjackGame (split/double-down), PokerGame, PlinkoGame (physics peg matrix), BingoGame, and ScratchGame.',
          technology: 'React 18 / TypeScript',
        },
        {
          name: 'ACID Balance Ledger',
          description: 'PostgreSQL stored procedures locking user balance records with FOR UPDATE during wagers and payouts, guaranteeing atomic balance consistency.',
          technology: 'PostgreSQL Stored Procedures',
        },
        {
          name: 'CSPRNG Fair Randomness Engine',
          description: 'Generates unmanipulated reel positions, card draws, and peg drop paths using crypto.getRandomValues().',
          technology: 'Web Crypto API',
        },
        {
          name: 'Compliance & Geo-Fence Filter',
          description: 'Detects user IP geolocation and enforces state-by-state regulatory gaming restrictions and self-exclusion limits.',
          technology: 'TypeScript / GeoIP',
        },
      ],
      principles: [
        'Ledger Atomicity: Balance changes are strictly processed through database-level locks, preventing duplicate wagers or race conditions.',
        'Cryptographic Fairness: Game outcomes derive from browser and server CSPRNG rather than predictable Math.random().',
        'Separation of Concerns: Decouples rendering animations from underlying transactional settlement states.',
      ],
      technicalDecisions: [
        'Used Supabase RPC functions with row-level locks instead of optimistic client balances.',
        'Categorized under Shipped Software without artificial scientific claims.',
        'Implemented modular game engine interfaces allowing uniform balance and transaction logging across all 6 games.',
      ],
    },
    features: [
      '6 fully implemented casino games: Slots, Blackjack, Poker, Plinko, Bingo, and Scratch Cards',
      'Atomic credit/debit ledger with PostgreSQL row-level locks (SELECT ... FOR UPDATE)',
      'Cryptographically secure random number generation (CSPRNG)',
      'US state jurisdiction geo-filtering and responsible gaming controls',
    ],
    challenges: [
      'Synchronizing multi-reel CSS deceleration curves with deterministic backend outcomes',
      'Preventing balance inconsistencies during rapid concurrent spin requests across tabs',
    ],
    lineage: {
      parents: ['quantumology'],
      children: ['resumebuilder'],
      relationshipNote: 'Extended interactive software patterns into transactional ledger and rule-evaluation architectures.',
    },
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/ggSLOTS',
  },

  {
    id: 'resumebuilder',
    name: 'resumeBUILDER (Agent Rez)',
    codename: 'RESUME-BUILDER-APP',
    domain: 'shipped_software',
    domainLabel: 'Shipped Software',
    projectKind: 'software',
    status: 'shipped',
    statusLabel: 'Shipped Software',
    classification: 'Resume Engineering Platform & Real-Time Document Engine',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [3.2, -2.0, -0.6],
    timeline: '2026-Q1 / Shipped',
    summary:
      'A local-first, privacy-focused resume engineering platform featuring real-time document layout, F-Pattern visual hierarchy analysis, AI bullet point optimization via Groq SDK, multi-format parsing (Word DOCX, PDF, LinkedIn), headless Chromium PDF generation via Puppeteer, and Stripe subscription billing.',
    productPurpose:
      'Provide a fast, privacy-respecting career documentation suite that optimizes resume content for human recruiters and applicant tracking systems using verified visual ergonomics and AI refinement.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'resumeBUILDER',
        url: 'https://github.com/GI-Company/resumeBUILDER',
        homepageUrl: 'https://agentrez.space',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Next.js 15, Groq AI bullet rewriter, Puppeteer PDF export, and Stripe billing.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'Built with Next.js 15 App Router and React 19. Combines an instant client-side document layout preview, an F-Pattern cognitive visual hierarchy heatmap overlay, server-side Groq Llama 3.3 70B bullet point rewriting via STAR methodology, serverless headless Chromium PDF generation, and multi-format document ingestion.',
      techStack: [
        'Next.js 15 (App Router)',
        'React 19 & TypeScript',
        'Tailwind CSS',
        'Groq SDK (Llama 3.3 70B STAR Rewriter)',
        'Puppeteer & @sparticuz/chromium-min',
        'Mammoth.js (Word DOCX Ingestion)',
        'pdf-parse (PDF Text Extraction)',
        'Stripe Billing',
        'PostHog Analytics',
        'Resend Email API',
      ],
      components: [
        {
          name: 'Real-Time Resume Composer',
          description: 'Modular document section editor with drag-and-drop reordering and synchronous keystroke layout preview.',
          technology: 'React 19 / TypeScript',
        },
        {
          name: 'F-Pattern Visual Hierarchy Scanner',
          description: 'Calculates recruiter eye-tracking gaze paths and typography contrast ratios directly on the resume canvas.',
          technology: 'HTML5 Canvas / TypeScript',
        },
        {
          name: 'Groq STAR-Method AI Rewriter',
          description: 'Restructures weak bullet points into high-impact Situation-Task-Action-Result metrics via Groq Llama 3.3 70B.',
          technology: 'Groq API',
        },
        {
          name: 'Document Ingestion Pipeline',
          description: 'Parses existing resumes from Word (.docx via Mammoth), PDF (pdf-parse), or LinkedIn profile exports into structured JSON.',
          technology: 'Node.js / Mammoth / pdf-parse',
        },
        {
          name: 'Headless Chromium PDF Exporter',
          description: 'Generates pixel-perfect, vector-sharp print PDFs using serverless Chromium (@sparticuz/chromium-min) and Puppeteer.',
          technology: 'Puppeteer / Chromium',
        },
        {
          name: 'Stripe Monetization & Subscriptions',
          description: 'Manages tiered subscription plans, checkout webhooks, and download quota enforcement.',
          technology: 'Stripe API',
        },
      ],
      principles: [
        'Local-First Privacy: Resume draft data remains in browser local state; external APIs receive only the bullet text requested for rewriting.',
        'Cognitive Layout Optimization: Incorporates recruiter scanning eye-tracking research (F-Pattern) to position high-value accomplishments.',
        'High-Fidelity Document Export: Headless serverless Chromium guarantees identical PDF rendering regardless of the user browser engine.',
      ],
      technicalDecisions: [
        'Upgraded to Next.js 15 App Router with React 19 for optimal server action performance.',
        'Leveraged Groq ultra-low-latency inference for sub-second bullet point suggestions.',
        'Maintained strictly within the Shipped Software domain as applied product engineering.',
      ],
    },
    features: [
      'Instant-render multi-template resume composer with custom typography controls',
      'Real-time F-Pattern eye-tracking heatmap scanner identifying weak visual zones',
      'AI bullet point optimizer restructuring accomplishments into STAR format with Groq',
      'Word (.docx), PDF, and LinkedIn export file ingestion with automatic field mapping',
      'Pixel-perfect vector PDF generation via headless serverless Chromium',
      'Stripe subscription integration for Pro memberships and export credits',
    ],
    challenges: [
      'Packaging serverless Chromium binaries (@sparticuz/chromium-min) within Vercel function size limits',
      'Extracting clean hierarchical text structures from arbitrary multi-column PDF layouts',
    ],
    lineage: {
      parents: ['ggslots'],
      children: [],
      relationshipNote: 'Demonstrates productivity tooling, visual ergonomics, and applied AI transformation workflows.',
    },
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/resumeBUILDER',
  },

  // ==========================================
  // SYSTEMS RESEARCH ADDITIONS
  // ==========================================
  {
    id: 'kb',
    name: 'KB (Kernos + BNLM)',
    codename: 'KB-BROWSER-OE',
    domain: 'systems_research',
    domainLabel: 'Systems Research',
    projectKind: 'engineering',
    status: 'operational_poc',
    statusLabel: 'Browser-Native Operating Environment & Intent Router',
    classification: 'Private In-Browser Classifier, VFS & Terminal Substrate',
    operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
    position: [-2.2, -0.6, -0.2],
    timeline: '2026-Q1 / Active Development',
    summary:
      'A browser-native operating environment unifying Kernos OS systems architecture with BNLM client-side machine learning inside a single tab. Features an in-browser intent classifier trained in seconds (~8k parameters) with per-character occlusion attribution, a capability-governed VFS terminal with pipes, sandboxed Pyodide Python WebAssembly execution, and Groq cloud intelligence fallback.',
    engineeringObjective:
      'Deliver a private, zero-install operating environment in the browser capable of training and running private intent classifiers entirely offline with explainable attribution, capability policies, and sandboxed Python execution.',
    repositories: [
      {
        provider: 'github',
        owner: 'GI-Company',
        name: 'kb',
        url: 'https://github.com/GI-Company/kb',
        homepageUrl: 'https://kb-phi-beryl.vercel.app',
        visibility: 'public',
        relationship: 'primary-source',
        description: 'Canonical public source repository: Kernos + BNLM browser-native operating environment with offline intent router and Pyodide.',
        verificationStatus: 'verified',
      },
    ],
    architecture: {
      overview:
        'KB operates as a full client-side cognitive operating environment. Users can train a private ~8k-parameter intent router on local data in seconds, inspect decisions with per-character occlusion attribution, execute Python scripts in Pyodide WebAssembly, and navigate a capability-governed VFS terminal with zero data leaving the browser tab.',
      techStack: [
        'React 19 & TypeScript',
        'Vite 6',
        'BNLM Sub-Engine (JavaScript / WebGPU)',
        'Pyodide (Python WASM Worker)',
        'Tailwind CSS',
        'Groq API (Optional Cloud Fallback)',
        'Vercel',
      ],
      components: [
        {
          name: 'Embedded BNLM Engine',
          description: 'Vendored client-side machine learning engine under src/bnlm/ providing in-browser tensor math, embedding, classification, and WebGPU compute shaders.',
          technology: 'JavaScript / WebGPU',
        },
        {
          name: 'Intent Classifier & Occlusion Explainer',
          description: 'Trains lightweight local models in seconds; explain command calculates exact per-character occlusion attribution behind every decision (lib/localClassifier.ts).',
          technology: 'TypeScript / BNLM',
        },
        {
          name: 'VFS & Terminal Pipeline',
          description: 'Virtual File System with overlay support, standard shell piping, redirection, and capability policy enforcement (lib/vfs.ts, lib/terminalPipeline.ts).',
          technology: 'TypeScript',
        },
        {
          name: 'Pyodide Python Worker',
          description: 'Sandboxed Python 3 runtime executing inside a dedicated Web Worker via WebAssembly without server dependencies (lib/pythonRuntime.ts).',
          technology: 'Pyodide / WASM',
        },
        {
          name: 'Capability Security Layer',
          description: 'Enforces system capability policies (can / policy built-ins) governing file access, network requests, and tool execution boundaries.',
          technology: 'TypeScript',
        },
        {
          name: 'Cloud Intelligence Bridge',
          description: 'Optional Groq API connection for synthetic dataset generation and complex queries, while intent classification stays 100% offline (lib/groqFetch.ts).',
          technology: 'Groq Cloud API',
        },
      ],
      principles: [
        'Local-First Privacy: Intent classification and explainability execute entirely inside the client tab without telemetry or server round-trips.',
        'Honest Held-Out Re-evaluation: Model corrections are evaluated against frozen held-out test splits to measure authentic generalization.',
        'Capability-Based Security: Terminal commands and agents operate under explicit capability policies (can / policy built-ins).',
      ],
      technicalDecisions: [
        'Vendored BNLM sub-engine directly in src/bnlm/ to ensure reproducible in-browser tensor execution.',
        'Pyodide isolated to dedicated Web Worker with postMessage boundary to prevent main thread blocking.',
        'Occlusion-based attribution chosen over saliency approximations for mathematical determinism.',
      ],
    },
    lineage: {
      parents: ['kernos', 'bnlm'],
      children: [],
      relationshipNote: 'Synthesizes Kernos OS operating concepts with BNLM browser-native machine learning.',
    },
    experiments: [
      {
        id: 'kb-intent-retrain',
        name: 'Honest Held-Out Intent Re-evaluation Loop',
        hypothesis: 'Correcting classification errors on targeted examples maintains held-out accuracy without catastrophic forgetting.',
        methodology: 'Evaluated via correct + train --from-corrections against frozen held-out validation set.',
        configuration: { parameters: '~8k', training_epochs: 30, test_split: '20%' },
        results: 'PASS: Corrected misclassifications resolve while held-out benchmark score remains stable.',
        interpretation: 'Demonstrates viability of rapid micro-model interactive correction in browser memory.',
        limitations: 'Context window constrained to sentence-level intent classification.',
      },
    ],
    findings: [
      {
        type: 'OBSERVED',
        title: 'Per-Character Occlusion Attribution',
        description: 'Measuring prediction shift under character occlusion identifies specific token triggers without neural network opacity.',
      },
      {
        type: 'OBSERVED',
        title: 'Sub-Second In-Tab Training',
        description: 'Training an ~8k parameter classifier in browser memory completes in under 3 seconds, enabling instant interactive correction loops.',
      },
    ],
    artifacts: [],
    publications: [],
    sourceReference: 'https://github.com/GI-Company/kb',
  },
];

export const RESEARCH_LINKS: ResearchLink[] = [
  // Systems Lineage
  { source: 'aetheros', target: 'axon', type: 'evolved_from', strength: 0.95, annotation: 'AI as Service -> AI as Architecture' },
  { source: 'axon', target: 'acmk', type: 'evolved_from', strength: 0.94, annotation: 'Architecture -> Inspectable 5-Plane Microkernel' },
  { source: 'acmk', target: 'cortex', type: 'evolved_from', strength: 0.92, annotation: 'Cognitive planes -> Gated hypothesis workspace' },
  { source: 'acmk', target: 'virtual-lab', type: 'orchestrates', strength: 0.9, annotation: 'State inspectability -> Physical evidence verification' },
  { source: 'aetheros', target: 'kernos', type: 'evolved_from', strength: 0.85, annotation: 'OS exploration -> Standalone kernel research' },

  // Machine Learning Sub-branch
  { source: 'cortex', target: 'cortex-ms', type: 'evolved_from', strength: 0.96, annotation: 'General workspace -> Mass-spectrometry molecular reasoning' },
  { source: 'cortex', target: 'tinycoherent', type: 'shares_principles_with', strength: 0.78, annotation: 'Inspectable workspace principles -> Glass-box pure C Transformer' },
  { source: 'tinycoherent', target: 'bnlm', type: 'shares_principles_with', strength: 0.78, annotation: 'Small-model glass-box architecture -> In-browser WebGPU machine learning' },
  { source: 'cortex-ms', target: 'evidence-vault', type: 'feeds', strength: 0.88, annotation: 'Candidate ranking verified against curated evidence' },
  { source: 'evidence-vault', target: 'physio-model', type: 'feeds', strength: 0.84, annotation: 'Target binding records inform hemodynamic models' },

  // Virtual Lab Sub-branch
  { source: 'virtual-lab', target: 'sensor-node', type: 'orchestrates', strength: 0.93, annotation: 'Platform coordinates edge sensor acquisition' },
  { source: 'sensor-node', target: 'rf-spatial', type: 'feeds', strength: 0.86, annotation: 'IMU & Wi-Fi telemetry feeds voxel occupancy engine' },
  { source: 'sensor-node', target: 'instrument-console', type: 'feeds', strength: 0.92, annotation: 'Live stream & artifacts forwarded to desktop console' },
  { source: 'virtual-lab', target: 'instrument-console', type: 'verifies', strength: 0.95, annotation: 'Console audits cryptographic manifests & replay' },

  // Shipped Software Sub-branch
  { source: 'quantumology', target: 'ggslots', type: 'evolved_from', strength: 0.82, annotation: 'Interactive frontend mechanics -> Transactional slot engine' },
  { source: 'ggslots', target: 'resumebuilder', type: 'supports', strength: 0.8, annotation: 'Applied software engineering & layout workflows' },

  // Operating Environments & Browser-Native ML
  { source: 'kernos', target: 'kb', type: 'supports', strength: 0.88, annotation: 'Microkernel concepts -> Browser-native operating environment' },
  { source: 'bnlm', target: 'kb', type: 'supports', strength: 0.88, annotation: 'Browser-native transformer -> In-tab intent classifier engine' },
];

export interface LabManifestoData {
  companyName: string;
  classification: string;
  operator: string;
  founder: string;
  location: string;
  githubOrg: string;
  githubReposUrl: string;
  websiteRepoUrl?: string;
  thesis: string;
  epistemicTriad: {
    observed: string;
    measured: string;
    inferred: string;
  };
  primaryDomains: string[];
  intellectualTenets: {
    id: string;
    title: string;
    question: string;
    description: string;
    axiom: string;
  }[];
  labStats: {
    label: string;
    value: string;
    subtext: string;
  }[];
}

export const LAB_MANIFESTO: LabManifestoData = {
  companyName: 'Global Intent Company',
  classification: 'Independent Research & Engineering Company',
  operator: 'Cory Tortorici — Founder / Independent Developer & Researcher',
  founder: 'Cory Tortorici',
  location: 'Autonomous Laboratory / Distributed Research Nodes',
  githubOrg: 'https://github.com/GI-Company',
  githubReposUrl: 'https://github.com/GI-Company?tab=repositories',
  websiteRepoUrl: 'https://github.com/GI-Company/GiC',
  thesis:
    'Global Intent Company explores computational architectures, scientific systems, and shipped applications designed around inspectability, evidence preservation, experimental validation, and reproducibility.',
  epistemicTriad: {
    observed:
      'Direct sensor captures, raw spectrometer centroid frames, un-normalized photon/sample counts, and untransformed telemetry frames preserved with cryptographic provenance.',
    measured:
      'Quantified physical values computed via documented instrumental calibration equations, NIST standards, or deterministic signal processing pipelines.',
    inferred:
      'Probabilistic estimates, candidate rankings, latent vector projections, or learned predictions generated by statistical models, explicitly flagged with calibrated uncertainty bounds.',
  },
  primaryDomains: [
    'Machine Learning',
    'Virtual Lab',
    'Systems Research',
    'Shipped Software',
  ],
  intellectualTenets: [
    {
      id: 'computation',
      title: 'COMPUTATION',
      question: 'How should intelligent computation be structured?',
      description:
        'We investigate selective local processing, bounded global workspace competition, and inspectable cognitive microkernels rather than uniform, opaque parameter scaling.',
      axiom: 'Latency is architecture. Computation must remain inspectable and bounded rather than swallowed by monolithic black boxes.',
    },
    {
      id: 'evidence',
      title: 'EVIDENCE',
      question: 'How should observations and derived knowledge be represented?',
      description:
        'Scientific evidence loses meaning when provenance and experimental context are discarded. We preserve assay conditions, measurement operators, raw frames, and bibliographic context.',
      axiom: 'Never reduce heterogeneous experimental evidence to an isolated scalar value.',
    },
    {
      id: 'integrity',
      title: 'INTEGRITY',
      question: 'How can we know that evidence hasn’t silently changed?',
      description:
        'Checksum manifests alone are useless when an attacker can recompute the hashes. True scientific integrity demands authenticated cryptographic signatures and immutable hash chains.',
      axiom: 'A UI displaying a convincing chart does not establish the integrity of the underlying data.',
    },
    {
      id: 'reproducibility',
      title: 'REPRODUCIBILITY',
      question: 'Can another person reconstruct what happened?',
      description:
        'True reproducibility requires raw observations + acquisition metadata + configuration + processing lineage + derived artifacts + environment + integrity.',
      axiom: 'If an experiment cannot be replayed deterministically from its raw acquisition envelope, it is not verified science.',
    },
    {
      id: 'inspectability',
      title: 'INSPECTABILITY',
      question: 'Can humans see why a computational system reached a result?',
      description:
        'We construct systems with explicit Control, State, Trace, and Inference planes where an operator can pause, single-step, inspect alternatives, and roll back state.',
      axiom: 'A system whose intermediate reasoning cannot be halted and inspected is untrustworthy by design.',
    },
    {
      id: 'falsifiability',
      title: 'FALSIFIABILITY',
      question: 'What evidence would demonstrate that an architectural hypothesis is wrong?',
      description:
        'The architecture remains a hypothesis until controlled experiments demonstrate an advantage against appropriately matched baselines. We preserve null and mixed experimental results with equal transparency.',
      axiom: 'Statistical significance and practical predictive utility are fundamentally different questions.',
    },
  ],
  labStats: [
    { label: 'Operational Structure', value: '100% Solo', subtext: 'Independent research by Cory Tortorici' },
    { label: 'Cortex-MS Parameters', value: '3,232,492', subtext: 'BF16 mixed-precision on NVIDIA L4' },
    { label: 'Curated Evidence Nodes', value: '323 Nodes', subtext: '671 records across 7 databases' },
    { label: 'Scientific Integrity', value: 'Ed25519', subtext: 'Cryptographically authenticated .vlab' },
  ],
};

export const LAB_IDENTITY = LAB_MANIFESTO;
export const FOUNDATIONAL_QUESTIONS = LAB_MANIFESTO.intellectualTenets;

export function getAllResearchPublications(): ResearchPublication[] {
  const all: ResearchPublication[] = [];
  RESEARCH_NODES.forEach((node) => {
    if (node.publications) {
      node.publications.forEach((pub) => {
        if ('url' in pub && 'platform' in pub) {
          all.push(pub as ResearchPublication);
        }
      });
    }
  });
  return all;
}

export function getPublicationsForProject(projectId: string): ResearchPublication[] {
  const node = RESEARCH_NODES.find((n) => n.id === projectId);
  if (!node || !node.publications) return [];
  return node.publications.filter((p): p is ResearchPublication => 'url' in p && 'platform' in p);
}

export function getAllTimelineEvents(): { project: ResearchNode; event: ResearchTimelineEvent }[] {
  const all: { project: ResearchNode; event: ResearchTimelineEvent }[] = [];
  RESEARCH_NODES.forEach((node) => {
    if (node.timelineEvents) {
      node.timelineEvents.forEach((event) => {
        all.push({ project: node, event });
      });
    }
  });
  return all;
}

export function getTimelineForProject(projectId: string): ResearchTimelineEvent[] {
  const node = RESEARCH_NODES.find((n) => n.id === projectId);
  return node?.timelineEvents || [];
}

