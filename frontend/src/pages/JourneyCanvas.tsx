/**
 * JourneyCanvas.tsx — React Flow powered learning roadmap canvas with custom toolbar controls.
 *
 * Implements:
 * - Zoom in / Zoom out
 * - Real-time zoom percentage readout
 * - Fit view / Reset view
 * - Jump to current actionable stage
 * - Minimap & background grid
 * - Read-only graph (no dragging/reconnecting)
 * - Restrained Framer Motion node entrance & interactions
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  type Viewport,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  AlertCircle,
  Target,
  Star,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import type { Stage, StudentJourneyProgress, StageProgressState } from '@/types/journey';

const VIEWPORT_KEY = (slug: string) => `cadence_journey_vp_${slug}`;
const DEFAULT_VIEWPORT: Viewport = { x: 80, y: 80, zoom: 0.9 };
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.0;

function loadViewport(journeySlug: string): Viewport {
  try {
    const stored = localStorage.getItem(VIEWPORT_KEY(journeySlug));
    if (stored) return JSON.parse(stored) as Viewport;
  } catch {}
  return DEFAULT_VIEWPORT;
}

function saveViewport(journeySlug: string, vp: Viewport) {
  try {
    localStorage.setItem(VIEWPORT_KEY(journeySlug), JSON.stringify(vp));
  } catch {}
}

const NODE_STYLES: Record<
  StageProgressState,
  { border: string; bg: string; text: string; icon: React.ElementType; iconColor: string }
> = {
  passed: {
    border: '#22a566',
    bg: 'linear-gradient(135deg, #edfbf3 0%, #d3f5e1 100%)',
    text: '#0f5132',
    icon: CheckCircle2,
    iconColor: '#22a566',
  },
  in_progress: {
    border: '#6366f1',
    bg: 'linear-gradient(135deg, #eef0ff 0%, #e0e3ff 100%)',
    text: '#312f81',
    icon: PlayCircle,
    iconColor: '#6366f1',
  },
  available: {
    border: '#b7bece',
    bg: '#ffffff',
    text: '#262b3d',
    icon: Circle,
    iconColor: '#6366f1',
  },
  checkpoint_eligible: {
    border: '#6366f1',
    bg: 'linear-gradient(135deg, #eef0ff 0%, #e0e3ff 100%)',
    text: '#312f81',
    icon: Target,
    iconColor: '#6366f1',
  },
  locked: {
    border: '#d8dce6',
    bg: '#f6f7fa',
    text: '#8b93a8',
    icon: Lock,
    iconColor: '#8b93a8',
  },
  needs_review: {
    border: '#f5b335',
    bg: 'linear-gradient(135deg, #fff8eb 0%, #feecc7 100%)',
    text: '#78350f',
    icon: AlertCircle,
    iconColor: '#e89a16',
  },
};

const DARK_NODE_STYLES: Record<
  StageProgressState,
  { border: string; bg: string; text: string }
> = {
  passed: { border: '#22a566', bg: '#0d3320', text: '#d3f5e1' },
  in_progress: { border: '#6366f1', bg: '#1a1b4b', text: '#c7ccff' },
  available: { border: '#3a4058', bg: '#172033', text: '#b7bece' },
  checkpoint_eligible: { border: '#6366f1', bg: '#1a1b4b', text: '#c7ccff' },
  locked: { border: '#262b3d', bg: '#0d0f17', text: '#4c5470' },
  needs_review: { border: '#c27c0e', bg: '#291c00', text: '#feecc7' },
};

interface JourneyNodeData {
  stage: Stage;
  state: StageProgressState;
  isMilestone: boolean;
  isDark: boolean;
  onClick: () => void;
}

function JourneyNode({ data }: NodeProps) {
  const d = data as unknown as JourneyNodeData;
  const { stage, state, isMilestone, isDark, onClick } = d;
  const style = NODE_STYLES[state] || NODE_STYLES.locked;
  const darkStyle = DARK_NODE_STYLES[state] || DARK_NODE_STYLES.locked;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      role="button"
      tabIndex={0}
      aria-label={`${stage.title} — ${state.replace('_', ' ')}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="nodrag cursor-pointer group outline-none"
      style={{ width: 220 }}
    >
      <div
        className="relative rounded-2xl border-2 p-4 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary-500"
        style={{
          borderColor: isDark ? darkStyle.border : style.border,
          background: isDark ? darkStyle.bg : style.bg,
          opacity: state === 'locked' ? 0.65 : 1,
        }}
      >
        {isMilestone && (
          <div className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-warning-400 shadow">
            <Star size={12} fill="white" className="text-white" />
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <Icon
            size={18}
            style={{ color: style.iconColor }}
            className="shrink-0 mt-0.5"
          />
          <p
            className="text-xs font-bold leading-snug"
            style={{ color: isDark ? darkStyle.text : style.text }}
          >
            {stage.title}
          </p>
        </div>

        <p
          className="mt-2 text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: style.iconColor }}
        >
          {state.replace('_', ' ')}
        </p>

        {stage.topicTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {stage.topicTags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: isDark ? darkStyle.text : style.text,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const nodeTypes = { journeyStage: JourneyNode };

function layoutStages(stages: Stage[]): { id: string; x: number; y: number }[] {
  const NODE_W = 240;
  const NODE_H = 120;
  const COL_GAP = 50;
  const ROW_GAP = 70;

  const visited = new Set<string>();
  const order: string[] = [];
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;
    for (const pid of stage.prerequisiteStageIds) visit(pid);
    order.push(id);
  }
  for (const s of stages) visit(s.id);

  const levels: Record<string, number> = {};
  for (const id of order) {
    const stage = stages.find((s) => s.id === id)!;
    const maxPrereqLevel = stage.prerequisiteStageIds.reduce(
      (max, pid) => Math.max(max, (levels[pid] ?? -1)),
      -1,
    );
    levels[id] = maxPrereqLevel + 1;
  }

  const byLevel: Record<number, string[]> = {};
  for (const [id, level] of Object.entries(levels)) {
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(id);
  }

  const positions: { id: string; x: number; y: number }[] = [];
  const maxLevel = Math.max(...Object.keys(byLevel).map(Number));

  for (let level = 0; level <= maxLevel; level++) {
    const ids = byLevel[level] ?? [];
    const totalW = ids.length * NODE_W + (ids.length - 1) * COL_GAP;
    const startX = -totalW / 2 + 320;
    ids.forEach((id, col) => {
      positions.push({
        id,
        x: startX + col * (NODE_W + COL_GAP),
        y: level * (NODE_H + ROW_GAP) + 40,
      });
    });
  }

  return positions;
}

function CanvasInner({
  stages,
  progress,
  journeySlug,
  onStageSelect,
}: {
  stages: Stage[];
  progress: StudentJourneyProgress;
  journeySlug: string;
  onStageSelect: (s: Stage) => void;
}) {
  const { fitView, setViewport, getViewport, zoomIn, zoomOut } = useReactFlow();
  const isDark = document.documentElement.classList.contains('dark');
  const positions = layoutStages(stages);
  const [zoomLevel, setZoomLevel] = useState<number>(90);

  const initialNodes: Node[] = positions.map((pos) => {
    const stage = stages.find((s) => s.id === pos.id)!;
    const state: StageProgressState = (progress.stageStates[pos.id] ?? 'locked') as StageProgressState;
    const isMilestone = stage.type === 'milestone';

    return {
      id: pos.id,
      type: 'journeyStage',
      position: { x: pos.x, y: pos.y },
      data: {
        stage,
        state,
        isMilestone,
        isDark,
        onClick: () => onStageSelect(stage),
      } as unknown as Record<string, unknown>,
      draggable: false,
      selectable: false,
    };
  });

  const initialEdges: Edge[] = [];
  for (const stage of stages) {
    for (const pid of stage.prerequisiteStageIds) {
      const prereqState: StageProgressState = (progress.stageStates[pid] ?? 'locked') as StageProgressState;
      const passed = prereqState === 'passed';
      initialEdges.push({
        id: `${pid}->${stage.id}`,
        source: pid,
        target: stage.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: passed ? '#22a566' : '#b7bece',
          strokeWidth: passed ? 2 : 1.5,
          strokeDasharray: passed ? undefined : '5 4',
        },
      });
    }
  }

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const stored = loadViewport(journeySlug);
    if (stored.zoom) setZoomLevel(Math.round(stored.zoom * 100));
    if (
      stored.x !== DEFAULT_VIEWPORT.x ||
      stored.y !== DEFAULT_VIEWPORT.y ||
      stored.zoom !== DEFAULT_VIEWPORT.zoom
    ) {
      setViewport(stored, { duration: 0 });
    } else {
      fitView({ padding: 0.25, duration: 400, maxZoom: 1.0 });
    }
  }, [fitView, setViewport, journeySlug]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(() => {
    const vp = getViewport();
    setZoomLevel(Math.round(vp.zoom * 100));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveViewport(journeySlug, vp);
    }, 400);
  }, [getViewport, journeySlug]);

  const handleResetView = () => {
    setViewport(DEFAULT_VIEWPORT, { duration: 300 });
    setZoomLevel(Math.round(DEFAULT_VIEWPORT.zoom * 100));
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300, maxZoom: 1.0 });
  };

  const handleJumpToCurrent = () => {
    const currentStage = stages.find((s) => {
      const state = progress.stageStates[s.id];
      return state === 'available' || state === 'in_progress' || state === 'needs_review';
    }) || stages[0];

    const pos = positions.find((p) => p.id === currentStage?.id);
    if (pos) {
      setViewport({ x: -pos.x + 300, y: -pos.y + 200, zoom: 1.0 }, { duration: 350 });
    }
  };

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onMoveEnd={onMoveEnd}
        zoomOnScroll={false}
        zoomOnPinch={true}
        panOnScroll={false}
        panOnDrag={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        className="!bg-slate-50 dark:!bg-[#0B1220]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color={isDark ? '#1e293b' : '#cbd5e1'}
        />

        {/* Custom Visible Toolbar Controls */}
        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border border-ink-200 dark:border-ink-800 rounded-2xl p-1.5 shadow-lift">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            aria-label="Zoom in"
            title="Zoom in"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
          >
            <ZoomIn size={16} />
          </button>

          <span className="px-2 text-xs font-bold text-ink-700 dark:text-ink-200 min-w-[46px] text-center select-none">
            {zoomLevel}%
          </span>

          <button
            onClick={() => zoomOut({ duration: 200 })}
            aria-label="Zoom out"
            title="Zoom out"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
          >
            <ZoomOut size={16} />
          </button>

          <div className="h-4 w-px bg-ink-200 dark:bg-ink-800 mx-1" />

          <button
            onClick={handleFitView}
            aria-label="Fit roadmap"
            title="Fit roadmap to screen"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Fit</span>
          </button>

          <button
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset default zoom"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleJumpToCurrent}
            aria-label="Jump to current stage"
            title="Focus current actionable stage"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-[#6542C5] dark:text-[#B59AF7] hover:bg-primary-100 transition"
          >
            <Navigation size={13} />
            <span className="hidden sm:inline">Current</span>
          </button>
        </div>

        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as JourneyNodeData;
            return NODE_STYLES[d.state]?.border ?? '#b7bece';
          }}
          className="!border !border-ink-200 !rounded-2xl dark:!border-ink-800 dark:!bg-ink-900/90 shadow-soft hidden lg:block !bottom-5 !right-5"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function JourneyCanvas({
  stages,
  progress,
  journeySlug,
  onStageSelect,
}: {
  stages: Stage[];
  progress: StudentJourneyProgress;
  journeySlug: string;
  onStageSelect: (s: Stage) => void;
}) {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <CanvasInner
          stages={stages}
          progress={progress}
          journeySlug={journeySlug}
          onStageSelect={onStageSelect}
        />
      </ReactFlowProvider>
    </div>
  );
}
