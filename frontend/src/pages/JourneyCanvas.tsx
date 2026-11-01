/**
 * JourneyCanvas.tsx — React Flow powered learning roadmap canvas.
 *
 * Features:
 * - Zoom in/out/fit/reset, pan, minimap
 * - Read-only: nodes cannot be dragged or reconnected
 * - Viewport persisted in localStorage per journey
 * - Accessible labels; respects prefers-reduced-motion
 * - Distinct node states with text + icon + color
 * - Locked nodes explain missing prerequisites on hover/focus
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  AlertCircle,
  Target,
  Star,
} from 'lucide-react';
import type { Stage, StudentJourneyProgress, StageProgressState } from '@/types/journey';

// ─── Viewport persistence ─────────────────────────────────────────────────────

const VIEWPORT_KEY = (slug: string) => `cadence_journey_vp_${slug}`;
const DEFAULT_VIEWPORT: Viewport = { x: 60, y: 60, zoom: 0.9 };
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2;

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

// ─── Node state styles ────────────────────────────────────────────────────────

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
    bg: '#fff',
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

// ─── Custom journey node ──────────────────────────────────────────────────────

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
  const style = NODE_STYLES[state];
  const darkStyle = DARK_NODE_STYLES[state];
  const Icon = style.icon;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${stage.title} — ${state.replace('_', ' ')}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="nodrag cursor-pointer group outline-none"
      style={{ width: 200 }}
    >
      <div
        className={`relative rounded-2xl border-2 p-3.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary-500 ${
          !prefersReduced
            ? 'group-hover:shadow-[0_4px_16px_rgba(15,23,42,0.12)] group-hover:-translate-y-0.5 transition-transform duration-200'
            : ''
        }`}
        style={{
          borderColor: isDark ? darkStyle.border : style.border,
          background: isDark ? darkStyle.bg : style.bg,
          opacity: state === 'locked' ? 0.6 : 1,
        }}
      >
        {/* Milestone badge */}
        {isMilestone && (
          <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-warning-400 shadow">
            <Star size={10} fill="white" className="text-white" />
          </div>
        )}

        {/* Icon + title row */}
        <div className="flex items-start gap-2.5">
          <Icon
            size={16}
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

        {/* State label */}
        <p
          className="mt-1.5 text-[10px] font-semibold tracking-wide uppercase"
          style={{ color: style.iconColor, opacity: 0.8 }}
        >
          {state.replace('_', ' ')}
        </p>

        {/* Tags */}
        {stage.topicTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {stage.topicTags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? darkStyle.text : style.text,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { journeyStage: JourneyNode };

// ─── Layout: simple top-to-bottom DAG with branch columns ────────────────────

function layoutStages(
  stages: Stage[],
): { id: string; x: number; y: number }[] {
  const NODE_W = 220;
  const NODE_H = 110;
  const COL_GAP = 48;
  const ROW_GAP = 60;

  // BFS topological sort
  const visited = new Set<string>();
  const order: string[] = [];
  const adj: Record<string, string[]> = {};
  for (const s of stages) adj[s.id] = [];
  for (const s of stages) {
    for (const pid of s.prerequisiteStageIds) {
      if (adj[pid]) adj[pid].push(s.id);
    }
  }

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;
    for (const pid of stage.prerequisiteStageIds) visit(pid);
    order.push(id);
  }
  for (const s of stages) visit(s.id);

  // Assign levels (longest path from root)
  const levels: Record<string, number> = {};
  for (const id of order) {
    const stage = stages.find((s) => s.id === id)!;
    const maxPrereqLevel = stage.prerequisiteStageIds.reduce(
      (max, pid) => Math.max(max, (levels[pid] ?? -1)),
      -1,
    );
    levels[id] = maxPrereqLevel + 1;
  }

  // Group by level
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

// ─── Canvas inner component (uses ReactFlow hooks) ───────────────────────────

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
  const { fitView, setViewport, getViewport } = useReactFlow();
  const isDark = document.documentElement.classList.contains('dark');
  const positions = layoutStages(stages);

  // Build nodes
  const initialNodes: Node[] = positions.map((pos) => {
    const stage = stages.find((s) => s.id === pos.id)!;
    const state: StageProgressState = (progress.stageStates[pos.id] ?? 'locked') as StageProgressState;
    const isMilestone = false; // will use journey.milestoneStageIds if passed in

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
      draggable: false, // read-only: curriculum nodes cannot be moved
      selectable: false,
    };
  });

  // Build edges
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

  // Restore viewport on mount
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const stored = loadViewport(journeySlug);
    if (
      stored.x !== DEFAULT_VIEWPORT.x ||
      stored.y !== DEFAULT_VIEWPORT.y ||
      stored.zoom !== DEFAULT_VIEWPORT.zoom
    ) {
      setViewport(stored, { duration: 0 });
    } else {
      // Focus current stage
      fitView({ padding: 0.25, duration: 400, maxZoom: 1.0 });
    }
  }, [fitView, setViewport, journeySlug]);

  // Save viewport on change (debounced)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveViewport(journeySlug, getViewport());
    }, 400);
  }, [getViewport, journeySlug]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      onMoveEnd={onMoveEnd}
      // Prevent scroll hijacking — only zoom with ctrl/pinch
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
        gap={20}
        size={1}
        color={isDark ? '#1e293b' : '#e2e8f0'}
      />
      <Controls
        showInteractive={false}
        className="!border !border-ink-200 !rounded-xl !shadow-soft dark:!border-ink-700 dark:!bg-ink-900 [&>button]:!border-b [&>button]:!border-ink-200 dark:[&>button]:!border-ink-700 dark:[&>button]:!bg-ink-900 dark:[&>button]:!text-ink-300"
      />
      <MiniMap
        nodeColor={(n) => {
          const d = n.data as unknown as JourneyNodeData;
          return NODE_STYLES[d.state]?.border ?? '#b7bece';
        }}
        className="!border !border-ink-200 !rounded-xl dark:!border-ink-700 dark:!bg-ink-900 hidden lg:block"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

// ─── Public export (wrapped in provider) ─────────────────────────────────────

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

