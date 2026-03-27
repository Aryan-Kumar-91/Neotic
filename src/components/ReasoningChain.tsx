import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HelpCircle, CheckCircle, Filter, BrainCircuit, Eye, Calculator,
  Image as ImageIcon, X, Sparkles, Lightbulb, ScanSearch, Layers, Waypoints
} from 'lucide-react';

// ─── Stage Naming & Color Palette ────────────────────────────────────────────
// Each stage gets a unique descriptive name and a bright, comfortable color pair
const STAGE_PALETTE = [
  { name: 'Decomposition', icon: Layers,      bg: 'bg-sky-400/25',     border: 'border-sky-400/40',     text: 'text-sky-300',     dot: 'bg-sky-400' },
  { name: 'Investigation', icon: ScanSearch,   bg: 'bg-violet-400/25',  border: 'border-violet-400/40',  text: 'text-violet-300',  dot: 'bg-violet-400' },
  { name: 'Exploration',   icon: Waypoints,    bg: 'bg-amber-400/25',   border: 'border-amber-400/40',   text: 'text-amber-300',   dot: 'bg-amber-400' },
  { name: 'Reasoning',     icon: BrainCircuit, bg: 'bg-rose-400/25',    border: 'border-rose-400/40',    text: 'text-rose-300',    dot: 'bg-rose-400' },
  { name: 'Evaluation',    icon: Eye,          bg: 'bg-teal-400/25',    border: 'border-teal-400/40',    text: 'text-teal-300',    dot: 'bg-teal-400' },
  { name: 'Refinement',    icon: Sparkles,     bg: 'bg-fuchsia-400/25', border: 'border-fuchsia-400/40', text: 'text-fuchsia-300', dot: 'bg-fuchsia-400' },
  { name: 'Inference',     icon: Lightbulb,    bg: 'bg-lime-400/25',    border: 'border-lime-400/40',    text: 'text-lime-300',    dot: 'bg-lime-400' },
  { name: 'Computation',   icon: Calculator,   bg: 'bg-orange-400/25',  border: 'border-orange-400/40',  text: 'text-orange-300',  dot: 'bg-orange-400' },
  { name: 'Synthesis',     icon: Filter,       bg: 'bg-cyan-400/25',    border: 'border-cyan-400/40',    text: 'text-cyan-300',    dot: 'bg-cyan-400' },
  { name: 'Validation',    icon: CheckCircle,  bg: 'bg-emerald-400/25', border: 'border-emerald-400/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
];

function getStage(index: number) {
  return STAGE_PALETTE[index % STAGE_PALETTE.length];
}

// ─── Custom Bubble Node ──────────────────────────────────────────────────────
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  const isActive = data.isActive;

  const stateClasses = isActive
    ? `ring-[3px] ${data.ringColor || 'ring-blue-400'} shadow-[0_0_22px_rgba(255,255,255,0.15)] scale-[1.18]`
    : data.highlight
      ? 'ring-[2px] ring-white/25 shadow-lg scale-105'
      : 'ring-[1px] ring-white/10 shadow-md opacity-60 hover:opacity-100 hover:scale-[1.08]';

  return (
    <div
      className={`flex flex-col items-center gap-2.5 relative cursor-pointer select-none
        transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isActive ? 'z-50' : 'z-10'}`}
      onClick={(e) => {
        e.stopPropagation();
        if (data.onNodeClick) data.onNodeClick(data.nodeIndex, data.stageName, data.content);
      }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />

      {/* Bubble */}
      <div
        className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white
          border-[2.5px] ${data.borderColor || 'border-white/20'}
          backdrop-blur-sm
          transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)]
          ${data.bgClass} ${stateClasses}`}
      >
        {data.showIcons ? (
          <Icon className="w-5 h-5 drop-shadow-sm" />
        ) : (
          <span className="font-bold text-[15px] drop-shadow-sm">
            {data.nodeIndex !== undefined ? data.nodeIndex : '·'}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />

      {/* Label */}
      <span
        className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md whitespace-nowrap
          transition-all duration-500
          ${isActive
            ? `${data.textColor || 'text-blue-300'} bg-white/5 border border-white/10`
            : 'text-[#777] bg-transparent border border-transparent'
          }`}
      >
        {data.stageName}
      </span>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

// ─── Types ───────────────────────────────────────────────────────────────────
interface SelectedInfo {
  index: number;
  label: string;
  content: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReasoningChain({ thoughts, isGenerating }: { thoughts: any[], isGenerating?: boolean }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showIcons, setShowIcons] = useState(true);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);

  const handleNodeClick = useCallback((index: number, label: string, content: string) => {
    if (!content) return;
    setSelected((prev) => prev && prev.index === index ? null : { index, label, content });
  }, []);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const startX = 50;
    const endX = Math.max(700, startX + thoughts.length * 160 + 160);
    const centerY = 150;

    // ── Input Node ──
    const inputContent = `Received the user query and initialized the reasoning pipeline. The model deconstructed the prompt into ${thoughts.length} analytical phase${thoughts.length !== 1 ? 's' : ''} to systematically arrive at a comprehensive answer.`;
    newNodes.push({
      id: 'input',
      type: 'custom',
      position: { x: startX, y: centerY },
      data: {
        stageName: 'Ingestion', icon: HelpCircle,
        bgClass: 'bg-blue-400/25', borderColor: 'border-blue-400/40',
        ringColor: 'ring-blue-400', textColor: 'text-blue-300',
        content: inputContent, nodeIndex: 0,
        highlight: true, showIcons, onNodeClick: handleNodeClick,
      }
    });

    let prevId = 'input';

    // ── Thought Nodes ──
    thoughts.forEach((thought, index) => {
      const stage = getStage(index);
      const id = `thought-${index}`;

      const progress = (index + 1) / (thoughts.length + 1);
      const x = startX + progress * (endX - startX);
      const yOffset = (index % 2 === 0 ? -1 : 1) * (40 + (index % 3) * 10);
      const y = centerY + yOffset;

      const isActive = isGenerating && index === thoughts.length - 1;

      newNodes.push({
        id,
        type: 'custom',
        position: { x, y },
        data: {
          stageName: stage.name, icon: stage.icon,
          bgClass: stage.bg, borderColor: stage.border,
          ringColor: `ring-${stage.dot.replace('bg-', '')}`,
          textColor: stage.text,
          content: thought.content, isActive,
          nodeIndex: index + 1, showIcons,
          onNodeClick: handleNodeClick,
        }
      });

      const edgeColor = isActive ? '#60A5FA' : '#2A2A2C';
      newEdges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        type: 'straight',
        animated: isActive,
        style: { stroke: edgeColor, strokeWidth: isActive ? 2 : 1.5, transition: 'stroke 0.6s ease, stroke-width 0.6s ease' },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 14, height: 14 }
      });

      prevId = id;
    });

    // ── Response Node ──
    const responseContent = isGenerating
      ? `Awaiting completion of all ${thoughts.length} reasoning phases before synthesizing the final answer.`
      : `Successfully synthesized insights from ${thoughts.length} reasoning phase${thoughts.length !== 1 ? 's' : ''} into a unified, coherent response. The chain-of-thought trace is now complete.`;
    const responseId = 'response';
    newNodes.push({
      id: responseId,
      type: 'custom',
      position: { x: endX, y: centerY },
      data: {
        stageName: 'Conclusion', icon: CheckCircle,
        bgClass: 'bg-emerald-400/25', borderColor: 'border-emerald-400/40',
        ringColor: 'ring-emerald-400', textColor: 'text-emerald-300',
        content: responseContent, nodeIndex: thoughts.length + 1,
        highlight: !isGenerating && thoughts.length > 0,
        showIcons, onNodeClick: handleNodeClick,
      }
    });

    newEdges.push({
      id: `e-${prevId}-${responseId}`,
      source: prevId,
      target: responseId,
      type: 'straight',
      animated: isGenerating && thoughts.length > 0,
      style: { stroke: '#2A2A2C', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2A2A2C', width: 14, height: 14 }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, isGenerating, showIcons, handleNodeClick]);

  if (!thoughts || thoughts.length === 0) return null;

  const currentPhaseIndex = isGenerating && thoughts.length > 0 ? thoughts.length : 0;
  const currentPhase = isGenerating && thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;
  const currentStage = currentPhaseIndex > 0 ? getStage(currentPhaseIndex - 1) : null;

  return (
    <div
      className="w-full h-[380px] bg-[#0A0A0B] rounded-2xl border border-[#1A1A1C] overflow-hidden mb-6 mt-2 relative"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10 border-b border-[#1A1A1C] bg-[#0A0A0B]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${currentStage ? currentStage.dot : 'bg-emerald-400'} ${isGenerating ? 'animate-pulse' : ''}`} />
          <span className="text-[#777] text-xs font-medium tracking-widest uppercase">Reasoning Trace</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="flex items-center gap-1.5 text-[#555] hover:text-[#aaa] text-[10px] uppercase font-semibold tracking-wider transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            {showIcons ? 'Numbers' : 'Icons'}
          </button>
          <div className="w-px h-3 bg-[#222]" />
          <span className={`text-[10px] uppercase font-semibold tracking-wider ${currentStage ? currentStage.text : 'text-emerald-300'}`}>
            {currentPhaseIndex > 0 ? `${getStage(currentPhaseIndex - 1).name}` : 'Complete'}
          </span>
          <div className="w-px h-3 bg-[#222]" />
          <span className="text-[#444] text-[10px] uppercase font-semibold tracking-wider">
            {thoughts.length} step{thoughts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Graph — preventScrolling prevents React Flow from hijacking page scroll ── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        preventScrolling={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        className="!bg-transparent"
        onPaneClick={() => setSelected(null)}
      >
        <Background color="#161618" gap={28} size={1} />
      </ReactFlow>

      {/* ── Click-to-reveal Info Panel ── */}
      {selected && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-xl bg-[#141416]/90 backdrop-blur-xl border border-[#2A2A2C] p-4 rounded-xl z-30 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/80 items-center justify-center text-sm font-bold">
              {selected.index}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white/90 font-semibold text-sm">{selected.label}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[#555] hover:text-white/70 transition-colors p-0.5 rounded hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[#999] text-[13px] leading-relaxed line-clamp-3">{selected.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Phase Indicator ── */}
      {currentPhase && !selected && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-xl bg-[#141416]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl z-20 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-start gap-3">
            <div className={`flex shrink-0 h-8 w-8 rounded-full bg-white/5 border border-white/10 items-center justify-center text-sm font-bold animate-pulse ${currentStage?.text || 'text-blue-300'}`}>
              {currentPhaseIndex}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <h3 className="text-white/90 font-semibold text-sm">
                Phase {currentPhaseIndex} — <span className={currentStage?.text || 'text-blue-300'}>{currentStage?.name || currentPhase.step}</span>
              </h3>
              <p className="text-[#777] text-[13px] leading-relaxed line-clamp-2">{currentPhase.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
