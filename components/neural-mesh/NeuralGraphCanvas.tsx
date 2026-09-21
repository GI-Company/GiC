'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  RESEARCH_NODES,
  RESEARCH_LINKS,
  RESEARCH_DOMAINS,
  ResearchNode,
  ResearchDomain,
  DomainMetadata,
} from '@/lib/research-data';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Cpu,
  Activity,
  AlertTriangle,
  Binary,
  Code2,
  ExternalLink,
  ChevronRight,
  Compass,
  Zap,
  Layers,
  ArrowDown,
  Gauge,
  Eye,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export type RenderTier = 'ultra' | 'high' | 'balanced' | 'accessible';
export type DossierTabType =
  | 'architecture'
  | 'technical'
  | 'experiments'
  | 'findings'
  | 'research-log'
  | 'simulator'
  | 'artifacts'
  | 'lineage'
  | 'source'
  | 'features'
  | 'livedemo';

export type NavigationLevel = 'root' | 'domain' | 'project';

interface NeuralGraphCanvasProps {
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  activeDomain: ResearchDomain | null;
  onSelectDomain: (domain: ResearchDomain | null) => void;
  renderTier: RenderTier;
  onTierChange: (tier: RenderTier) => void;
  activeDossierTab?: DossierTabType;
  onSelectDossierTab?: (tab: DossierTabType) => void;
  onNavigateRoot?: () => void;
}

interface ProjectedDomainLabel {
  id: ResearchDomain;
  label: string;
  shortLabel: string;
  x: number;
  y: number;
  visible: boolean;
  isActive: boolean;
  isFaded: boolean;
  colorHex: string;
  nodeCount: number;
}

interface ProjectedProjectLabel {
  id: string;
  name: string;
  statusLabel: string;
  domain: ResearchDomain;
  x: number;
  y: number;
  visible: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  hasRepo: boolean;
  hasDemo: boolean;
}

interface ProjectedSatelliteLabel {
  id: string;
  tab: DossierTabType;
  label: string;
  sublabel: string;
  colorHex: string;
  iconType: 'cpu' | 'activity' | 'alert' | 'binary' | 'code' | 'sparkles' | 'demo' | 'shield' | 'book';
  x: number;
  y: number;
  visible: boolean;
  isActive: boolean;
  isSource?: boolean;
  isDemo?: boolean;
  externalUrl?: string;
}

// Compute deterministic unfolded position for each project around its domain hub
function computeUnfoldedPosition(node: ResearchNode, domain: DomainMetadata, indexInDomain: number, totalInDomain: number): THREE.Vector3 {
  const hubPos = new THREE.Vector3(domain.center[0], domain.center[1], domain.center[2]);
  if (totalInDomain <= 1) {
    return hubPos.clone().add(new THREE.Vector3(1.8, 0.4, 0.2));
  }

  // Distribute in an elliptical planar halo around domain hub
  const angle = (indexInDomain / totalInDomain) * Math.PI * 2 + 0.35;
  const radiusX = 2.4;
  const radiusZ = 2.1;
  const heightVariation = Math.sin(angle * 2) * 0.45;

  return new THREE.Vector3(
    domain.center[0] + Math.cos(angle) * radiusX,
    domain.center[1] + heightVariation,
    domain.center[2] + Math.sin(angle) * radiusZ
  );
}

export default function NeuralGraphCanvas({
  selectedNodeId,
  onSelectNode,
  activeDomain,
  onSelectDomain,
  renderTier,
  onTierChange,
  activeDossierTab = 'architecture',
  onSelectDossierTab,
  onNavigateRoot,
}: NeuralGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [projectedDomainLabels, setProjectedDomainLabels] = useState<ProjectedDomainLabel[]>([]);
  const [projectedProjectLabels, setProjectedProjectLabels] = useState<ProjectedProjectLabel[]>([]);
  const [projectedSatelliteLabels, setProjectedSatelliteLabels] = useState<ProjectedSatelliteLabel[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredDomainId, setHoveredDomainId] = useState<ResearchDomain | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const hoveredDomainIdRef = useRef<ResearchDomain | null>(null);
  const onTierChangeRef = useRef(onTierChange);
  onTierChangeRef.current = onTierChange;

  const setHoveredNode = (id: string | null) => {
    hoveredNodeIdRef.current = id;
    setHoveredNodeId(id);
  };

  const setHoveredDomain = (d: ResearchDomain | null) => {
    hoveredDomainIdRef.current = d;
    setHoveredDomainId(d);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fpsScore, setFpsScore] = useState<number>(60);
  const [reducedMotionActive, setReducedMotionActive] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Compute Current Navigation Level
  const currentNavLevel: NavigationLevel = useMemo(() => {
    if (selectedNodeId) return 'project';
    if (activeDomain) return 'domain';
    return 'root';
  }, [selectedNodeId, activeDomain]);

  // Selected node & domain
  const selectedNode = useMemo(() => {
    return RESEARCH_NODES.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  const activeDomainMeta = useMemo(() => {
    const domainId = selectedNode ? selectedNode.domain : activeDomain;
    return domainId ? RESEARCH_DOMAINS.find(d => d.id === domainId) || null : null;
  }, [selectedNode, activeDomain]);

  // Connected node IDs for selected node
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    RESEARCH_LINKS.forEach(link => {
      if (link.source === selectedNodeId) ids.add(link.target);
      if (link.target === selectedNodeId) ids.add(link.source);
    });
    return ids;
  }, [selectedNodeId]);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const domainHubsMap = useRef<Map<string, THREE.Group>>(new Map());
  const domainConduitsGroupRef = useRef<THREE.Group | null>(null);
  const nodesMeshMap = useRef<Map<string, THREE.Group>>(new Map());
  const edgesGroupRef = useRef<THREE.Group | null>(null);
  const satellitesGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const pulseRaysRef = useRef<{ line: THREE.Line; progress: number; speed: number; p1: THREE.Vector3; p2: THREE.Vector3 }[]>([]);

  // Spatial unfolding position maps
  const nodeTargetPosMap = useRef<Map<string, THREE.Vector3>>(new Map());
  const nodeCurrentPosMap = useRef<Map<string, THREE.Vector3>>(new Map());

  // Satellite metadata reference
  const satellitesDataRef = useRef<
    {
      group: THREE.Group;
      tab: DossierTabType;
      label: string;
      sublabel: string;
      colorHex: string;
      iconType: 'cpu' | 'activity' | 'alert' | 'binary' | 'code' | 'sparkles' | 'demo' | 'shield' | 'book';
      isSource?: boolean;
      isDemo?: boolean;
      externalUrl?: string;
    }[]
  >([]);

  // Camera navigation targets
  const currentCamLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const targetCamLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const orbitAngle = useRef({ theta: 0.28, phi: 1.35 });
  const orbitRadius = useRef(9.2);
  const targetOrbitRadius = useRef(9.2);

  // Performance tracking
  const frameTimes = useRef<number[]>([]);
  const lastFrameTimestamp = useRef<number>(performance.now());
  const tierDowngradeCooldown = useRef<number>(0);

  // Pointer & Touch gesture state
  const isDragging = useRef(false);
  const prevPointerPos = useRef({ x: 0, y: 0 });
  const touchStartDist = useRef<number | null>(null);

  // Check reduced motion preference & mobile device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionActive(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotionActive(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    setIsMobileDevice(window.innerWidth < 768);
    const handleResize = () => setIsMobileDevice(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update Spatial Camera Targets based on Navigation Level
  useEffect(() => {
    if (selectedNodeId && selectedNode) {
      // Level 2: Project Level
      const targetPos = nodeTargetPosMap.current.get(selectedNodeId) ||
        new THREE.Vector3(selectedNode.position[0], selectedNode.position[1], selectedNode.position[2]);

      targetCamLookAt.current.copy(targetPos);
      targetOrbitRadius.current = isMobileDevice ? 4.6 : 3.8;
    } else if (activeDomain) {
      // Level 1: Domain Level
      const domainMeta = RESEARCH_DOMAINS.find(d => d.id === activeDomain);
      if (domainMeta) {
        targetCamLookAt.current.set(domainMeta.center[0], domainMeta.center[1], domainMeta.center[2]);
        targetOrbitRadius.current = isMobileDevice ? 6.2 : 5.4;
      }
    } else {
      // Level 0: Root Global Intent
      targetCamLookAt.current.set(0, 0, 0);
      targetOrbitRadius.current = isMobileDevice ? 10.4 : 9.2;
    }
  }, [selectedNodeId, selectedNode, activeDomain, isMobileDevice]);

  // Build Project-Specific Orbiting Satellites
  useEffect(() => {
    if (!satellitesGroupRef.current) return;
    const sGroup = satellitesGroupRef.current;

    // Clear existing satellites with complete recursive geometry and material disposal
    while (sGroup.children.length > 0) {
      const obj = sGroup.children[0];
      sGroup.remove(obj);
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh || (child as THREE.Line).isLine) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    }
    satellitesDataRef.current = [];

    if (!selectedNode) return;

    // Position satellites group at project's position
    const nodePos = nodeTargetPosMap.current.get(selectedNode.id) ||
      new THREE.Vector3(selectedNode.position[0], selectedNode.position[1], selectedNode.position[2]);
    sGroup.position.copy(nodePos);

    // Build project-tailored sub-nodes
    const items: {
      tab: DossierTabType;
      label: string;
      sublabel: string;
      colorHex: string;
      colorNum: number;
      iconType: 'cpu' | 'activity' | 'alert' | 'binary' | 'code' | 'sparkles' | 'demo' | 'shield' | 'book';
      isSource?: boolean;
      isDemo?: boolean;
      isArticle?: boolean;
      externalUrl?: string;
    }[] = [];

    // 1. Architecture
    items.push({
      tab: 'architecture',
      label: 'Architecture',
      sublabel: selectedNode.architecture.pipelineStages?.length
        ? `${selectedNode.architecture.pipelineStages.length} Pipeline Stages`
        : selectedNode.architecture.components?.length
        ? `${selectedNode.architecture.components.length} System Components`
        : 'System Architecture',
      colorHex: '#10b981',
      colorNum: 0x10b981,
      iconType: 'cpu',
    });

    // 1.5 Modular Technical Specifications (e.g. TinyCoherent)
    if (selectedNode.technicalSections && selectedNode.technicalSections.length > 0) {
      items.push({
        tab: 'technical',
        label: 'Technical Specs',
        sublabel: `${selectedNode.technicalSections.length} Modular Specifications`,
        colorHex: '#10b981',
        colorNum: 0x10b981,
        iconType: 'code',
      });
    }

    // 1.8 Associated Public Research Articles & Research Logs
    if ((selectedNode.publications && selectedNode.publications.length > 0) || (selectedNode.timelineEvents && selectedNode.timelineEvents.length > 0)) {
      items.push({
        tab: 'research-log',
        label: 'Research Log',
        sublabel: `${selectedNode.publications?.length || selectedNode.timelineEvents?.length || 0} Research Milestones`,
        colorHex: '#818cf8',
        colorNum: 0x818cf8,
        iconType: 'book',
        isArticle: true,
      });
    }

    // 2. Specialized project items (matching user requirements)
    if (selectedNode.id === 'sensor-node') {
      items.push({
        tab: 'simulator',
        label: 'RF Spatial Voxel',
        sublabel: 'Wi-Fi RTT 802.11mc Ray-Caster',
        colorHex: '#06b6d4',
        colorNum: 0x06b6d4,
        iconType: 'binary',
      });
      items.push({
        tab: 'experiments',
        label: 'Acquisition Engine',
        sublabel: '100Hz IMU Foreground Service',
        colorHex: '#38bdf8',
        colorNum: 0x38bdf8,
        iconType: 'activity',
      });
      items.push({
        tab: 'findings',
        label: 'Integrity Verification',
        sublabel: 'Cryptographic Hash Chaining',
        colorHex: '#10b981',
        colorNum: 0x10b981,
        iconType: 'shield',
      });
    } else if (selectedNode.id === 'acmk') {
      items.push({
        tab: 'simulator',
        label: '5-Plane Debugger',
        sublabel: 'Interactive Cognitive Inspector',
        colorHex: '#a855f7',
        colorNum: 0xa855f7,
        iconType: 'binary',
      });
      items.push({
        tab: 'experiments',
        label: 'Clinical ICU Cohort',
        sublabel: '6-Patient Real-Time Vitals Simulation',
        colorHex: '#06b6d4',
        colorNum: 0x06b6d4,
        iconType: 'activity',
      });
      items.push({
        tab: 'findings',
        label: 'Security & Integrity',
        sublabel: 'Argon2id Key Derivation',
        colorHex: '#f59e0b',
        colorNum: 0xf59e0b,
        iconType: 'alert',
      });
    } else if (selectedNode.id === 'bnlm') {
      items.push({
        tab: 'experiments',
        label: 'Gradient Check',
        sublabel: 'Reverse-Mode Autograd Validation',
        colorHex: '#06b6d4',
        colorNum: 0x06b6d4,
        iconType: 'activity',
      });
      items.push({
        tab: 'findings',
        label: 'Empirical Findings',
        sublabel: 'WebGPU WGSL Compute Acceleration',
        colorHex: '#f59e0b',
        colorNum: 0xf59e0b,
        iconType: 'alert',
      });
    } else if (selectedNode.id === 'kernos') {
      items.push({
        tab: 'findings',
        label: 'Self-Healing DAG',
        sublabel: 'Parallel Recovery Task Racing',
        colorHex: '#3b82f6',
        colorNum: 0x3b82f6,
        iconType: 'activity',
      });
      items.push({
        tab: 'artifacts',
        label: 'Vector Graph Memory',
        sublabel: 'Synaptic High-Dimensional Storage',
        colorHex: '#10b981',
        colorNum: 0x10b981,
        iconType: 'cpu',
      });
    } else if (selectedNode.id === 'kb') {
      items.push({
        tab: 'findings',
        label: 'Intent Classifier',
        sublabel: 'Local Browser Model ~8k Params',
        colorHex: '#06b6d4',
        colorNum: 0x06b6d4,
        iconType: 'activity',
      });
      items.push({
        tab: 'features',
        label: 'VFS & Pyodide',
        sublabel: 'Terminal Shell & WebAssembly Python',
        colorHex: '#f59e0b',
        colorNum: 0xf59e0b,
        iconType: 'sparkles',
      });
    } else {
      // General projects
      if (selectedNode.features && selectedNode.features.length > 0) {
        items.push({
          tab: 'features',
          label: 'Features & UX',
          sublabel: `${selectedNode.features.length} Implemented Capabilities`,
          colorHex: '#f59e0b',
          colorNum: 0xf59e0b,
          iconType: 'sparkles',
        });
      }
      if (selectedNode.experiments && selectedNode.experiments.length > 0) {
        items.push({
          tab: 'experiments',
          label: 'Experiments',
          sublabel: selectedNode.experiments[0]?.name || 'Controlled Trial',
          colorHex: '#06b6d4',
          colorNum: 0x06b6d4,
          iconType: 'activity',
        });
      }
      if (selectedNode.findings && selectedNode.findings.length > 0) {
        items.push({
          tab: 'findings',
          label: 'Findings & Evidence',
          sublabel: `${selectedNode.findings.length} Verified Evidence Items`,
          colorHex: '#f59e0b',
          colorNum: 0xf59e0b,
          iconType: 'alert',
        });
      }
      if (selectedNode.simulatorType) {
        items.push({
          tab: 'simulator',
          label: 'Workbench',
          sublabel: 'Interactive Mathematical Sandbox',
          colorHex: '#a855f7',
          colorNum: 0xa855f7,
          iconType: 'binary',
        });
      }
    }

    // 3. Canonical Source Repository
    if (selectedNode.repositories && selectedNode.repositories.length > 0) {
      const pRepo = selectedNode.repositories[0];
      items.push({
        tab: 'source',
        label: '◉ SOURCE',
        sublabel: `${pRepo.owner}/${pRepo.name}`,
        colorHex: '#38bdf8',
        colorNum: 0x38bdf8,
        iconType: 'code',
        isSource: true,
        externalUrl: pRepo.url,
      });

      // 4. Live Demo Sub-Node (if available)
      if (pRepo.homepageUrl) {
        items.push({
          tab: 'livedemo',
          label: '✦ LIVE DEMO',
          sublabel: pRepo.homepageUrl.replace(/^https?:\/\//, ''),
          colorHex: '#fbbf24',
          colorNum: 0xfbbf24,
          iconType: 'demo',
          isDemo: true,
          externalUrl: pRepo.homepageUrl,
        });
      }
    }

    const count = items.length;
    const orbitDist = 2.05;

    items.forEach((item, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const sx = Math.cos(angle) * orbitDist;
      const sy = Math.sin(angle * 2) * 0.35;
      const sz = Math.sin(angle) * orbitDist;

      const subNodeGroup = new THREE.Group();
      subNodeGroup.position.set(sx, sy, sz);

      if (item.isSource) {
        // Faceted diamond for source
        const sourceGeo = new THREE.OctahedronGeometry(0.18, 0);
        const sourceMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 1.5,
          roughness: 0.1,
          metalness: 0.9,
        });
        const sourceMesh = new THREE.Mesh(sourceGeo, sourceMat);
        subNodeGroup.add(sourceMesh);

        const ringGeo = new THREE.RingGeometry(0.26, 0.30, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.2;
        subNodeGroup.add(ringMesh);
      } else if (item.isDemo) {
        // Glowing gold dodecahedron for Live Demo
        const demoGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const demoMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xd97706,
          emissiveIntensity: 1.6,
          roughness: 0.1,
          metalness: 0.9,
        });
        const demoMesh = new THREE.Mesh(demoGeo, demoMat);
        subNodeGroup.add(demoMesh);

        const beaconGeo = new THREE.RingGeometry(0.28, 0.33, 24);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.rotation.x = Math.PI / 2.4;
        subNodeGroup.add(beaconMesh);
      } else if (item.isArticle) {
        // Distinct Subordinate Publication / Research Log Artifact Node
        const articleGeo = new THREE.OctahedronGeometry(0.16, 0);
        const articleMat = new THREE.MeshStandardMaterial({
          color: 0x818cf8,
          emissive: 0x6366f1,
          emissiveIntensity: 1.5,
          roughness: 0.15,
          metalness: 0.85,
        });
        const articleMesh = new THREE.Mesh(articleGeo, articleMat);
        subNodeGroup.add(articleMesh);

        const ringGeo = new THREE.RingGeometry(0.24, 0.28, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x818cf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3.0;
        subNodeGroup.add(ringMesh);

        const cageGeo = new THREE.OctahedronGeometry(0.22, 1);
        const cageMat = new THREE.MeshBasicMaterial({
          color: 0xa5b4fc,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const cageMesh = new THREE.Mesh(cageGeo, cageMat);
        subNodeGroup.add(cageMesh);
      } else {
        // Standard crystal octahedron
        const crystalGeo = new THREE.OctahedronGeometry(0.15, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: item.colorNum,
          emissive: item.colorNum,
          emissiveIntensity: 1.1,
          roughness: 0.2,
          metalness: 0.8,
        });
        const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
        subNodeGroup.add(crystalMesh);

        const cageGeo = new THREE.OctahedronGeometry(0.22, 1);
        const cageMat = new THREE.MeshBasicMaterial({
          color: item.colorNum,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        });
        const cageMesh = new THREE.Mesh(cageGeo, cageMat);
        subNodeGroup.add(cageMesh);
      }

      // Laser beam connecting satellite to project center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sx, sy, sz),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: item.colorNum,
        transparent: true,
        opacity: item.isSource || item.isDemo ? 0.75 : 0.4,
      });
      const beam = new THREE.Line(lineGeo, lineMat);
      sGroup.add(beam);
      sGroup.add(subNodeGroup);

      satellitesDataRef.current.push({
        group: subNodeGroup,
        tab: item.tab,
        label: item.label,
        sublabel: item.sublabel,
        colorHex: item.colorHex,
        iconType: item.iconType,
        isSource: item.isSource,
        isDemo: item.isDemo,
        externalUrl: item.externalUrl,
      });
    });
  }, [selectedNode]);

  // Main Three.js Scene Initialization & Loop
  useEffect(() => {
    if (renderTier === 'accessible') return;
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.2);
    cameraRef.current = camera;

    // 3. Renderer with Adaptive Pixel Ratio
    const isUltra = renderTier === 'ultra';
    const isHigh = renderTier === 'high';
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: isUltra || isHigh,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D accessible tier:', e);
      onTierChangeRef.current('accessible');
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isUltra ? 2.0 : isHigh ? 1.5 : 1.0));
    rendererRef.current = renderer;

    // 4. Illumination
    const ambientLight = new THREE.AmbientLight(0x1e293b, 2.5);
    scene.add(ambientLight);

    const pLight1 = new THREE.PointLight(0x10b981, 3.2, 32);
    pLight1.position.set(5, 5, 4);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(0x06b6d4, 3.0, 32);
    pLight2.position.set(0, 5, 5);
    scene.add(pLight2);

    const pLight3 = new THREE.PointLight(0x3b82f6, 3.2, 32);
    pLight3.position.set(-5, 4, 3);
    scene.add(pLight3);

    const pLight4 = new THREE.PointLight(0xf59e0b, 2.8, 28);
    pLight4.position.set(3, -5, 3);
    scene.add(pLight4);

    // 5. Star / Quantum Dust Particle Field
    const pCount = isUltra ? 1400 : isHigh ? 700 : 350;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 32;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 22;

      const cRand = Math.random();
      if (cRand > 0.7) {
        pColors[i * 3] = 0.06; pColors[i * 3 + 1] = 0.71; pColors[i * 3 + 2] = 0.83; // Cyan
      } else if (cRand > 0.4) {
        pColors[i * 3] = 0.1; pColors[i * 3 + 1] = 0.72; pColors[i * 3 + 2] = 0.5;  // Emerald
      } else if (cRand > 0.2) {
        pColors[i * 3] = 0.23; pColors[i * 3 + 1] = 0.51; pColors[i * 3 + 2] = 0.96; // Blue
      } else {
        pColors[i * 3] = 0.96; pColors[i * 3 + 1] = 0.62; pColors[i * 3 + 2] = 0.1;  // Amber
      }
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: isUltra ? 0.045 : 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Central Macro Root: GLOBAL INTENT
    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 0, 0);

    const rootCoreGeo = new THREE.IcosahedronGeometry(0.42, 2);
    const rootCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x10b981,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.95,
    });
    const rootCore = new THREE.Mesh(rootCoreGeo, rootCoreMat);
    rootGroup.add(rootCore);

    const rootHaloGeo = new THREE.IcosahedronGeometry(0.72, 1);
    const rootHaloMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const rootHalo = new THREE.Mesh(rootHaloGeo, rootHaloMat);
    rootGroup.add(rootHalo);

    const rootRingGeo = new THREE.RingGeometry(0.9, 1.0, 36);
    const rootRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const rootRing = new THREE.Mesh(rootRingGeo, rootRingMat);
    rootRing.rotation.x = Math.PI / 2.3;
    rootGroup.add(rootRing);

    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // 7. Domain Hubs & Conduits
    domainHubsMap.current.clear();
    const conduitsGroup = new THREE.Group();
    scene.add(conduitsGroup);
    domainConduitsGroupRef.current = conduitsGroup;

    RESEARCH_DOMAINS.forEach(domain => {
      const dGroup = new THREE.Group();
      dGroup.position.set(domain.center[0], domain.center[1], domain.center[2]);

      const dCoreGeo = new THREE.DodecahedronGeometry(0.32, 0);
      const dCoreMat = new THREE.MeshStandardMaterial({
        color: domain.colorNum,
        emissive: domain.colorNum,
        emissiveIntensity: 1.1,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const dMesh = new THREE.Mesh(dCoreGeo, dCoreMat);
      dMesh.name = 'core';
      dGroup.add(dMesh);

      const dHaloGeo = new THREE.DodecahedronGeometry(0.54, 1);
      const dHaloMat = new THREE.MeshBasicMaterial({
        color: domain.colorNum,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const dHalo = new THREE.Mesh(dHaloGeo, dHaloMat);
      dHalo.name = 'halo';
      dGroup.add(dHalo);

      const dRingGeo = new THREE.RingGeometry(0.62, 0.70, 32);
      const dRingMat = new THREE.MeshBasicMaterial({
        color: domain.colorNum,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const dRing = new THREE.Mesh(dRingGeo, dRingMat);
      dRing.rotation.x = Math.PI / 2.2;
      dRing.name = 'ring';
      dGroup.add(dRing);

      scene.add(dGroup);
      domainHubsMap.current.set(domain.id, dGroup);

      // Conduit line connecting Global Intent Root to Domain Hub
      const cGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(domain.center[0], domain.center[1], domain.center[2]),
      ]);
      const cMat = new THREE.LineBasicMaterial({
        color: domain.colorNum,
        transparent: true,
        opacity: 0.4,
      });
      const conduit = new THREE.Line(cGeo, cMat);
      conduitsGroup.add(conduit);
    });

    // 8. Project Nodes Meshes & Unfolding Map
    nodesMeshMap.current.clear();
    nodeTargetPosMap.current.clear();
    nodeCurrentPosMap.current.clear();

    // Group nodes by domain to compute initial unfolded positions
    RESEARCH_DOMAINS.forEach(domain => {
      const dNodes = RESEARCH_NODES.filter(n => n.domain === domain.id);
      dNodes.forEach((node, idx) => {
        const unfoldedPos = computeUnfoldedPosition(node, domain, idx, dNodes.length);
        nodeTargetPosMap.current.set(node.id, unfoldedPos);

        const group = new THREE.Group();
        // Initially placed at domain hub center
        const startPos = new THREE.Vector3(domain.center[0], domain.center[1], domain.center[2]);
        group.position.copy(startPos);
        group.scale.set(0.001, 0.001, 0.001);
        nodeCurrentPosMap.current.set(node.id, startPos.clone());

        const isFlagship = node.id === 'cortex-ms' || node.id === 'sensor-node' || node.id === 'bnlm' || node.id === 'acmk';
        const coreRadius = isFlagship ? 0.28 : 0.20;

        const coreGeo = new THREE.IcosahedronGeometry(coreRadius, isUltra ? 2 : 1);
        const coreMat = new THREE.MeshStandardMaterial({
          color: domain.colorNum,
          emissive: domain.colorNum,
          emissiveIntensity: isFlagship ? 1.0 : 0.75,
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.9,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.name = 'core';
        group.add(coreMesh);

        const haloGeo = new THREE.IcosahedronGeometry(coreRadius * 1.5, 1);
        const haloMat = new THREE.MeshBasicMaterial({
          color: domain.colorNum,
          wireframe: true,
          transparent: true,
          opacity: isFlagship ? 0.6 : 0.35,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.name = 'halo';
        group.add(haloMesh);

        if (isFlagship) {
          const ringGeo = new THREE.RingGeometry(coreRadius * 1.8, coreRadius * 2.0, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: domain.colorNum,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2.3;
          ringMesh.name = 'ring';
          group.add(ringMesh);
        }

        scene.add(group);
        nodesMeshMap.current.set(node.id, group);
      });
    });

    // 9. Satellites Group
    const satellitesGroup = new THREE.Group();
    scene.add(satellitesGroup);
    satellitesGroupRef.current = satellitesGroup;

    // 10. Synaptic Network Edges
    const edgesGroup = new THREE.Group();
    scene.add(edgesGroup);
    edgesGroupRef.current = edgesGroup;
    pulseRaysRef.current = [];

    RESEARCH_LINKS.forEach(link => {
      const srcPos = nodeTargetPosMap.current.get(link.source);
      const tgtPos = nodeTargetPosMap.current.get(link.target);
      if (!srcPos || !tgtPos) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([srcPos, tgtPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      edgesGroup.add(line);

      // Pulse spark segment
      const pulseGeo = new THREE.BufferGeometry().setFromPoints([srcPos.clone(), srcPos.clone()]);
      const pulseMat = new THREE.LineBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.85,
      });
      const pulseLine = new THREE.Line(pulseGeo, pulseMat);
      edgesGroup.add(pulseLine);

      pulseRaysRef.current.push({
        line: pulseLine,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.007,
        p1: srcPos,
        p2: tgtPos,
      });
    });

    // 11. Render & Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      // Performance budgeting calculation
      const now = performance.now();
      const deltaMs = now - lastFrameTimestamp.current;
      lastFrameTimestamp.current = now;

      frameTimes.current.push(deltaMs);
      if (frameTimes.current.length > 60) frameTimes.current.shift();

      // Check average frame time every 60 frames
      if (frameTimes.current.length === 60) {
        const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / 60;
        const currentFps = Math.round(1000 / Math.max(1, avgDelta));
        setFpsScore(currentFps);

        // Adaptive Tier Reduction if frame time exceeds 20ms (< 50fps)
        if (avgDelta > 20 && Date.now() - tierDowngradeCooldown.current > 4000) {
          tierDowngradeCooldown.current = Date.now();
          if (renderTier === 'ultra') {
            onTierChangeRef.current('high');
          } else if (renderTier === 'high') {
            onTierChangeRef.current('balanced');
          }
        }
      }

      const elapsedTime = clock.getElapsedTime();
      const isReducedMotion = reducedMotionActive;
      const lerpFactor = isReducedMotion ? 1.0 : 0.075;

      // Update camera smooth flight & lookAt
      orbitRadius.current += (targetOrbitRadius.current - orbitRadius.current) * lerpFactor;

      const camX = targetCamLookAt.current.x + orbitRadius.current * Math.sin(orbitAngle.current.phi) * Math.sin(orbitAngle.current.theta);
      const camY = targetCamLookAt.current.y + orbitRadius.current * Math.cos(orbitAngle.current.phi);
      const camZ = targetCamLookAt.current.z + orbitRadius.current * Math.sin(orbitAngle.current.phi) * Math.cos(orbitAngle.current.theta);

      if (isReducedMotion) {
        camera.position.set(camX, camY, camZ);
        currentCamLookAt.current.copy(targetCamLookAt.current);
      } else {
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), lerpFactor);
        currentCamLookAt.current.lerp(targetCamLookAt.current, lerpFactor);
      }
      camera.lookAt(currentCamLookAt.current);

      // Rotate particle field
      if (particlesRef.current && !isReducedMotion) {
        particlesRef.current.rotation.y = elapsedTime * 0.01;
      }

      // Rotate Root Global Intent
      if (rootGroupRef.current && !isReducedMotion) {
        rootCore.rotation.y = elapsedTime * 0.35;
        rootHalo.rotation.x = elapsedTime * 0.2;
      }

      // Macro/Domain Hubs Rotation & Spatial Scaling
      domainHubsMap.current.forEach((dGroup, dId) => {
        if (!isReducedMotion) {
          dGroup.rotation.y = elapsedTime * 0.25;
        }

        const isCurrentDomain = activeDomain === dId;
        const hasActiveDomain = Boolean(activeDomain);

        let targetScale = 1.0;
        let opacity = 0.9;

        if (currentNavLevel === 'root') {
          targetScale = hoveredDomainIdRef.current === dId ? 1.25 : 1.0;
          opacity = 0.9;
        } else if (isCurrentDomain) {
          targetScale = selectedNodeId ? 0.9 : 1.35;
          opacity = 1.0;
        } else if (hasActiveDomain) {
          // Other domains recede and fade
          targetScale = 0.55;
          opacity = 0.2;
        }

        dGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpFactor);

        const core = dGroup.getObjectByName('core') as THREE.Mesh;
        if (core && (core.material as THREE.MeshStandardMaterial).opacity !== undefined) {
          (core.material as THREE.MeshStandardMaterial).opacity = opacity;
        }
      });

      // Conduit Opacity & Fading
      if (domainConduitsGroupRef.current) {
        domainConduitsGroupRef.current.children.forEach((cLine, idx) => {
          const dId = RESEARCH_DOMAINS[idx]?.id;
          const isCurrent = activeDomain === dId;
          const cMat = (cLine as THREE.Line).material as THREE.LineBasicMaterial;
          if (cMat) {
            cMat.opacity = currentNavLevel === 'root' ? 0.4 : isCurrent ? 0.7 : 0.08;
          }
        });
      }

      // Spatial Unfolding of Project Nodes
      nodesMeshMap.current.forEach((meshGroup, nodeId) => {
        const node = RESEARCH_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const isDomainActive = activeDomain === node.domain;
        const isSelected = nodeId === selectedNodeId;
        const isHovered = nodeId === hoveredNodeIdRef.current;
        const isConnected = connectedNodeIds.has(nodeId);

        const domainMeta = RESEARCH_DOMAINS.find(d => d.id === node.domain);
        const hubCenter = domainMeta
          ? new THREE.Vector3(domainMeta.center[0], domainMeta.center[1], domainMeta.center[2])
          : new THREE.Vector3(0, 0, 0);

        const unfoldedPos = nodeTargetPosMap.current.get(nodeId) || hubCenter;
        const currentPos = nodeCurrentPosMap.current.get(nodeId) || hubCenter.clone();

        let targetScale = 0.001;
        let targetPos = hubCenter.clone();

        if (currentNavLevel === 'root') {
          // At Root, projects fold tightly into the hub and are hidden
          targetScale = 0.001;
          targetPos.copy(hubCenter);
        } else if (isDomainActive) {
          // Unfold projects belonging to the active domain
          targetPos.copy(unfoldedPos);

          if (isSelected) {
            targetScale = 1.55;
          } else if (selectedNodeId) {
            // Sibling projects recede when one is selected
            targetScale = 0.75;
          } else if (isHovered) {
            targetScale = 1.35;
          } else {
            targetScale = 1.0;
          }
        } else {
          // Projects from other domains remain folded
          targetScale = 0.001;
          targetPos.copy(hubCenter);
        }

        // Animate position & scale lerp
        currentPos.lerp(targetPos, lerpFactor);
        meshGroup.position.copy(currentPos);
        meshGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpFactor);

        if (!isReducedMotion) {
          meshGroup.rotation.y += 0.01;
          const halo = meshGroup.getObjectByName('halo');
          if (halo) halo.rotation.x -= 0.015;
          const ring = meshGroup.getObjectByName('ring');
          if (ring) ring.rotation.z += 0.01;
        }

        // Adjust emissive intensity
        const core = meshGroup.getObjectByName('core') as THREE.Mesh;
        if (core && (core.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
          (core.material as THREE.MeshStandardMaterial).emissiveIntensity =
            isSelected ? 1.6 : isHovered ? 1.3 : isConnected ? 1.1 : 0.75;
        }
      });

      // Animate Satellites Orbit
      if (satellitesGroupRef.current && !isReducedMotion) {
        satellitesGroupRef.current.rotation.y = elapsedTime * 0.32;
      }

      // Animate Traveling Pulse Rays
      pulseRaysRef.current.forEach(ray => {
        ray.progress += ray.speed;
        if (ray.progress > 1) ray.progress = 0;

        const headRatio = ray.progress;
        const tailRatio = Math.max(0, ray.progress - 0.2);

        const headPos = new THREE.Vector3().lerpVectors(ray.p1, ray.p2, headRatio);
        const tailPos = new THREE.Vector3().lerpVectors(ray.p1, ray.p2, tailRatio);

        const posAttr = ray.line.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, tailPos.x, tailPos.y, tailPos.z);
        posAttr.setXYZ(1, headPos.x, headPos.y, headPos.z);
        posAttr.needsUpdate = true;
      });

      // 2D Screen Projections for HTML HUD
      const tempVec = new THREE.Vector3();

      // 1. Domain Labels Projection
      if (currentNavLevel === 'root' || currentNavLevel === 'domain') {
        const dLabels: ProjectedDomainLabel[] = [];
        RESEARCH_DOMAINS.forEach(d => {
          tempVec.set(d.center[0], d.center[1], d.center[2]);
          tempVec.project(camera);

          const isVisible = tempVec.z < 1.0;
          const sx = (tempVec.x * 0.5 + 0.5) * width;
          const sy = (-(tempVec.y * 0.5) + 0.5) * height;

          const count = RESEARCH_NODES.filter(n => n.domain === d.id).length;
          const isActive = activeDomain === d.id;
          const isFaded = currentNavLevel === 'domain' && !isActive;

          dLabels.push({
            id: d.id,
            label: d.label,
            shortLabel: d.shortLabel,
            x: sx,
            y: sy,
            visible: isVisible,
            isActive,
            isFaded,
            colorHex: d.colorHex,
            nodeCount: count,
          });
        });
        setProjectedDomainLabels(dLabels);
      } else {
        setProjectedDomainLabels([]);
      }

      // 2. Project Nodes Projection (Visible only when Domain is active or Project selected)
      if (currentNavLevel === 'domain' || currentNavLevel === 'project') {
        const pLabels: ProjectedProjectLabel[] = [];
        RESEARCH_NODES.forEach(node => {
          // Only show labels for nodes in active domain
          if (node.domain !== activeDomain) return;

          const currentPos = nodeCurrentPosMap.current.get(node.id);
          if (!currentPos) return;

          tempVec.copy(currentPos);
          tempVec.project(camera);

          const isVisible = tempVec.z < 1.0;
          const sx = (tempVec.x * 0.5 + 0.5) * width;
          const sy = (-(tempVec.y * 0.5) + 0.5) * height;

          const isFocused = node.id === selectedNodeId;
          const isDimmed = Boolean(selectedNodeId && !isFocused && !connectedNodeIds.has(node.id));

          pLabels.push({
            id: node.id,
            name: node.name,
            statusLabel: node.statusLabel,
            domain: node.domain,
            x: sx,
            y: sy,
            visible: isVisible,
            isFocused,
            isDimmed,
            hasRepo: Boolean(node.repositories && node.repositories.length > 0),
            hasDemo: Boolean(node.repositories?.[0]?.homepageUrl),
          });
        });
        setProjectedProjectLabels(pLabels);
      } else {
        setProjectedProjectLabels([]);
      }

      // 3. Project Satellites Projection (Visible only when Project selected)
      if (selectedNodeId && satellitesDataRef.current.length > 0) {
        const sLabels: ProjectedSatelliteLabel[] = [];
        const satTempVec = new THREE.Vector3();

        satellitesDataRef.current.forEach((sat, sIdx) => {
          sat.group.getWorldPosition(satTempVec);
          satTempVec.project(camera);

          const isVisible = satTempVec.z < 1.0;
          const sx = (satTempVec.x * 0.5 + 0.5) * width;
          const sy = (-(satTempVec.y * 0.5) + 0.5) * height;

          sLabels.push({
            id: `sat_${sat.tab}_${sIdx}`,
            tab: sat.tab,
            label: sat.label,
            sublabel: sat.sublabel,
            colorHex: sat.colorHex,
            iconType: sat.iconType,
            x: sx,
            y: sy,
            visible: isVisible,
            isActive: activeDossierTab === sat.tab,
            isSource: sat.isSource,
            isDemo: sat.isDemo,
            externalUrl: sat.externalUrl,
          });
        });
        setProjectedSatelliteLabels(sLabels);
      } else {
        setProjectedSatelliteLabels([]);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine || (obj as THREE.Points).isPoints) {
          const m = obj as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else {
              m.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
      pGeo.dispose();
      pMat.dispose();
    };
  }, [renderTier, activeDomain, selectedNodeId, connectedNodeIds, activeDossierTab, reducedMotionActive, currentNavLevel]);

  // Pointer & Touch Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    prevPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevPointerPos.current.x;
    const deltaY = e.clientY - prevPointerPos.current.y;
    prevPointerPos.current = { x: e.clientX, y: e.clientY };

    orbitAngle.current.theta -= deltaX * 0.005;
    orbitAngle.current.phi = Math.max(0.25, Math.min(Math.PI - 0.25, orbitAngle.current.phi - deltaY * 0.005));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    targetOrbitRadius.current = Math.max(2.8, Math.min(14.0, targetOrbitRadius.current + e.deltaY * 0.004));
  };

  // Touch handlers for mobile pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = touchStartDist.current - dist;
      touchStartDist.current = dist;
      targetOrbitRadius.current = Math.max(2.8, Math.min(14.0, targetOrbitRadius.current + delta * 0.02));
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  // Reset to root
  const resetToRoot = useCallback(() => {
    onSelectNode('');
    onSelectDomain(null);
    onNavigateRoot?.();
  }, [onSelectNode, onSelectDomain, onNavigateRoot]);

  // Keyboard navigation controls for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      orbitAngle.current.theta += 0.1;
    } else if (e.key === 'ArrowRight') {
      orbitAngle.current.theta -= 0.1;
    } else if (e.key === 'ArrowUp') {
      orbitAngle.current.phi = Math.max(0.25, orbitAngle.current.phi - 0.1);
    } else if (e.key === 'ArrowDown') {
      orbitAngle.current.phi = Math.min(Math.PI - 0.25, orbitAngle.current.phi + 0.1);
    } else if (e.key === '+' || e.key === '=') {
      targetOrbitRadius.current = Math.max(2.8, targetOrbitRadius.current - 0.5);
    } else if (e.key === '-' || e.key === '_') {
      targetOrbitRadius.current = Math.min(14.0, targetOrbitRadius.current + 0.5);
    } else if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else if (selectedNodeId) {
        onSelectNode('');
      } else if (activeDomain) {
        resetToRoot();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Global Intent Interactive 3D Spatial Research Graph. Use Arrow keys to rotate view, +/- to zoom, Escape to reset focus."
      style={{ touchAction: 'none' }}
      className={`relative w-full overflow-hidden select-none bg-[#07090e] border border-[#1a202c] rounded-2xl transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[520px] sm:h-[580px] lg:h-[620px]'
      }`}
    >
      {/* Three.js Canvas */}
      {renderTier !== 'accessible' ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />
      ) : (
        /* Accessible 2D Fallback Taxonomy */
        <div className="w-full h-full p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-[#090b10]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white mb-1">Global Intent Spatial Research Taxonomy (2D View)</h3>
            <p className="text-slate-400">
              Taxonomy across Machine Learning, Virtual Lab, Systems Research, and Shipped Software.
            </p>
          </div>
          <div className="space-y-6">
            {RESEARCH_DOMAINS.map(domain => {
              const domainNodes = RESEARCH_NODES.filter(n => n.domain === domain.id);
              return (
                <div key={domain.id} className="p-4 rounded-xl bg-[#0e121a] border border-[#1b212d]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domain.colorHex }} />
                    <span className="font-bold text-white text-sm">{domain.label}</span>
                    <span className="text-slate-500">({domainNodes.length} projects)</span>
                  </div>
                  <p className="text-slate-400 mb-3 text-[11px]">{domain.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {domainNodes.map(node => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          onSelectDomain(node.domain);
                          onSelectNode(node.id);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          node.id === selectedNodeId
                            ? 'bg-emerald-950/80 border-emerald-500 text-white'
                            : 'bg-[#121722] border-[#1d2535] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{node.statusLabel}</span>
                          {node.repositories && node.repositories.length > 0 && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Code2 className="w-3 h-3" /> GitHub
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white">{node.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{node.summary}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2D Projected Domain Hub HTML Labels (Level 0 & Level 1) */}
      {renderTier !== 'accessible' && (
        <div className="absolute inset-0 pointer-events-none">
          {projectedDomainLabels.map(dLabel => {
            if (!dLabel.visible) return null;
            return (
              <div
                key={dLabel.id}
                style={{
                  transform: `translate3d(${dLabel.x}px, ${dLabel.y}px, 0) translate(-50%, -130%)`,
                }}
                className={`absolute transition-all duration-200 ${
                  dLabel.isFaded ? 'opacity-20 pointer-events-none scale-75' : 'opacity-100 pointer-events-auto'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDomain(dLabel.id);
                    onSelectNode('');
                  }}
                  onPointerEnter={() => setHoveredDomain(dLabel.id)}
                  onPointerLeave={() => setHoveredDomain(null)}
                  className={`group px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 flex items-center gap-2.5 backdrop-blur-md shadow-2xl min-h-[44px] ${
                    dLabel.isActive
                      ? 'bg-[#0f1a26]/95 border-emerald-400 text-white ring-2 ring-emerald-400/50 scale-110 z-30'
                      : 'bg-[#0b0e14]/90 border-slate-700/80 text-slate-200 hover:border-emerald-400 hover:scale-105 z-20'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: dLabel.colorHex }} />
                  <div className="text-left">
                    <span className="font-bold tracking-wider block text-xs text-white">{dLabel.label}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {dLabel.nodeCount} projects • Click to unfold
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2D Projected Project Nodes HTML Labels (Level 1 & Level 2) */}
      {renderTier !== 'accessible' && (
        <div className="absolute inset-0 pointer-events-none">
          {projectedProjectLabels.map(label => {
            if (!label.visible) return null;
            const isSelected = label.id === selectedNodeId;
            const isHovered = label.id === hoveredNodeId;

            const domainMeta = RESEARCH_DOMAINS.find(d => d.id === label.domain);
            const domainColorHex = domainMeta ? domainMeta.colorHex : '#10b981';

            return (
              <div
                key={label.id}
                style={{
                  transform: `translate3d(${label.x}px, ${label.y}px, 0) translate(-50%, -120%)`,
                }}
                className={`absolute transition-all duration-150 ease-out ${
                  label.isDimmed ? 'opacity-25 pointer-events-auto scale-85' : 'opacity-100 pointer-events-auto'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(label.id);
                  }}
                  onPointerEnter={() => setHoveredNode(label.id)}
                  onPointerLeave={() => setHoveredNode(null)}
                  className={`group px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 flex items-center gap-2 backdrop-blur-md shadow-lg min-h-[40px] ${
                    isSelected
                      ? 'bg-[#0f1923]/95 border-emerald-400 text-white ring-2 ring-emerald-500/40 scale-110 z-30'
                      : isHovered
                      ? 'bg-[#131924]/90 border-cyan-400 text-white scale-105 z-20'
                      : 'bg-[#0a0d14]/85 border-[#1c222e] text-slate-300 hover:text-white hover:border-slate-500 z-10'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: domainColorHex }} />
                  <div className="text-left">
                    <span className="font-bold tracking-wide whitespace-nowrap block">{label.name}</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-slate-300 block font-sans">
                      {label.statusLabel}
                    </span>
                  </div>
                  {label.hasRepo && (
                    <span title="Source Code Available"><Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /></span>
                  )}
                  {label.hasDemo && (
                    <span title="Live Demo Available"><Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /></span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2D Projected Spatial Sub-Nodes HTML Labels (Level 2: Satellites) */}
      {renderTier !== 'accessible' && selectedNodeId && (
        <div className="absolute inset-0 pointer-events-none">
          {projectedSatelliteLabels.map(sat => {
            if (!sat.visible) return null;
            const isTabActive = activeDossierTab === sat.tab;

            return (
              <div
                key={sat.id}
                style={{
                  transform: `translate3d(${sat.x}px, ${sat.y}px, 0) translate(-50%, -50%)`,
                }}
                className="absolute pointer-events-auto transition-transform duration-75"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (sat.isDemo && sat.externalUrl) {
                      window.open(sat.externalUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    onSelectDossierTab?.(sat.tab);
                    const el = document.getElementById('research-dossier');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className={`group px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 flex items-center gap-2 backdrop-blur-md shadow-2xl min-h-[38px] ${
                    sat.isDemo
                      ? isTabActive
                        ? 'bg-[#451a03] border-amber-300 text-white ring-2 ring-amber-400/70 scale-110 z-40'
                        : 'bg-[#1e1306]/95 border-amber-600/80 text-amber-200 hover:border-amber-400 hover:scale-105 z-30'
                      : sat.isSource
                      ? isTabActive
                        ? 'bg-[#082f49] border-sky-300 text-white ring-2 ring-sky-400/70 scale-110 z-40'
                        : 'bg-[#0c1d2e]/95 border-sky-600/80 text-sky-200 hover:border-sky-400 hover:scale-105 z-30'
                      : isTabActive
                      ? 'bg-[#101826] border-white text-white ring-2 ring-emerald-400/60 scale-110 z-40'
                      : 'bg-[#090d14]/95 border-slate-700/80 text-slate-200 hover:border-emerald-400 hover:scale-105 z-30'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sat.colorHex }} />
                  <div className="text-left">
                    <div className="font-bold flex items-center gap-1.5 text-[11px]">
                      {sat.isDemo ? (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      ) : sat.isSource ? (
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />
                      ) : sat.iconType === 'cpu' ? (
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      ) : sat.iconType === 'activity' ? (
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      ) : sat.iconType === 'alert' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : sat.iconType === 'shield' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : sat.iconType === 'book' ? (
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Binary className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span>{sat.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 max-w-[130px] truncate">
                      {sat.sublabel}
                    </div>
                  </div>
                  {sat.externalUrl && (
                    <a
                      href={sat.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`ml-1 p-1 rounded transition-colors ${
                        sat.isDemo
                          ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                          : 'bg-[#0369a1]/80 hover:bg-[#0284c7] text-white'
                      }`}
                      title="Open external link in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Interactive Breadcrumb Navigation (Top Left) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-2 font-mono text-xs max-w-[calc(100%-140px)]">
        <div className="bg-[#0b0e14]/90 backdrop-blur-md border border-[#1b212d] px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5 sm:gap-2 shadow-xl flex-wrap">
          {/* 1. Global Intent Root */}
          <button
            type="button"
            onClick={resetToRoot}
            className={`font-bold flex items-center gap-1.5 transition-colors ${
              currentNavLevel === 'root'
                ? 'text-emerald-300'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>GLOBAL INTENT</span>
          </button>

          {/* 2. Domain Level */}
          {activeDomainMeta && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  onSelectNode('');
                  onSelectDomain(activeDomainMeta.id);
                }}
                className={`font-semibold transition-colors truncate max-w-[150px] ${
                  currentNavLevel === 'domain'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {activeDomainMeta.shortLabel.toUpperCase()}
              </button>
            </>
          )}

          {/* 3. Project Level */}
          {selectedNode && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() => onSelectNode(selectedNode.id)}
                className={`font-bold transition-colors truncate max-w-[160px] ${
                  activeDossierTab === 'architecture' ? 'text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {selectedNode.name}
              </button>
            </>
          )}

          {/* 4. Satellite Section */}
          {selectedNode && activeDossierTab && activeDossierTab !== 'architecture' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-emerald-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#121924]">
                {activeDossierTab === 'source'
                  ? 'SOURCE ARTIFACT'
                  : activeDossierTab === 'livedemo'
                  ? 'LIVE DEMO'
                  : activeDossierTab}
              </span>
            </>
          )}
        </div>

        {/* Level Reset Button (when drilled down) */}
        {currentNavLevel !== 'root' && (
          <button
            type="button"
            onClick={resetToRoot}
            className="bg-[#0b0e14]/90 hover:bg-[#131822] backdrop-blur-md border border-[#1b212d] hover:border-slate-600 px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5 transition-all shadow-lg text-[11px] min-h-[36px]"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Reset to Root</span>
          </button>
        )}
      </div>

      {/* Performance Tier & Fullscreen Controls (Top Right) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2 font-mono text-xs">
        {/* Adaptive FPS Indicator */}
        <div className="bg-[#0b0e14]/90 backdrop-blur-md border border-[#1b212d] px-2 py-1 rounded-lg hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
          <Gauge className="w-3 h-3 text-emerald-400" />
          <span>{fpsScore} FPS</span>
          {reducedMotionActive && (
            <span className="text-amber-400 font-bold ml-1">• REDUCED MOTION</span>
          )}
        </div>

        {/* Tier Switcher */}
        <div className="bg-[#0b0e14]/90 backdrop-blur-md border border-[#1b212d] p-1 rounded-lg flex items-center gap-1 shadow-lg">
          <span className="text-[10px] text-slate-500 px-1 uppercase font-medium hidden sm:inline">Tier:</span>
          {(['ultra', 'high', 'balanced', 'accessible'] as RenderTier[]).map(tier => (
            <button
              key={tier}
              type="button"
              onClick={() => onTierChange(tier)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                renderTier === tier
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier === 'accessible' ? '2D' : tier}
            </button>
          ))}
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-[#0b0e14]/90 hover:bg-[#131822] backdrop-blur-md border border-[#1b212d] p-2 rounded-lg text-slate-300 hover:text-white transition-all shadow-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Spatial View'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Mobile-Designed Quick Touch Dock (Bottom Overlay) */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none gap-2">
        {/* State description banner */}
        <div className="bg-[#080a0f]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#171c26] pointer-events-auto flex items-center gap-2">
          {selectedNode ? (
            <span>
              Focused on <strong className="text-emerald-400">{selectedNode.name}</strong> • Orbiting sub-nodes active
            </span>
          ) : activeDomainMeta ? (
            <span>
              Unfolded <strong className="text-white">{activeDomainMeta.label}</strong> • Select a project to inspect source
            </span>
          ) : (
            <span>
              Root Overview • Select any domain hub to traverse child projects
            </span>
          )}
        </div>

        {/* Jump to 2D Dossier button */}
        {selectedNode && (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('research-dossier');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-[#0e1724]/95 hover:bg-[#162337] backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/50 text-emerald-300 font-bold pointer-events-auto flex items-center gap-1.5 shadow-lg min-h-[36px]"
          >
            <ArrowDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span>Detailed Dossier</span>
          </button>
        )}
      </div>
    </div>
  );
}
