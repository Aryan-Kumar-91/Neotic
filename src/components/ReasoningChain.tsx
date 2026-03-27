import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HelpCircle, CheckCircle, Filter, BrainCircuit, Eye, Calculator, Image as ImageIcon, X } from 'lucide-react';

// Custom Node Component — Professional translucent bubbles with thick borders
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;

  const isActive = data.isActive;
  const isCompleted = !isActive && data.index !== undefined;

  // Active node: thick blue ring, bright glow, full opacity
  // Completed nodes: subtle, elegant, translucent
  const stateClasses = isActive
    ? 'ring-[3px] ring-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)] scale-[1.15]'
    : data.highlight
      ? 'ring-2 ring-white/30 shadow-lg scale-105'
      : 'ring-1 ring-white/10 shadow-md opacity-70 hover:opacity-100 hover:scale-105';

  return (
    <div
      className={`flex flex-col items-center gap-2.5 relative transition-all duration-500 ease-out cursor-pointer ${isActive ? 'z-50' : 'z-10'}`}
      onClick={(e) => {
        e.stopPropagation();
        if (data.onNodeClick) data.onNodeClick(data.index, data.label, data.content);
      }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />

      {/* The Bubble — thick border, translucent fill, lighter center */}
      <div
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white 
          border-[2.5px] border-white/25 
          backdrop-blur-sm
          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${data.bgClass} ${stateClasses}`}
      >
        {data.showIcons ? (
          <Icon className="w-5 h-5 drop-shadow-sm" />
        ) : (
          <span className="font-bold text-base drop-shadow-sm">
            {data.index !== undefined ? data.index : (data.label === 'Input' ? '→' : '✓')}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />

      {/* Label */}
      <span
        className={`text-[10px] font-semibold tracking-wider uppercase font-sans px-2.5 py-1 rounded-md whitespace-nowrap transition-all duration-300
          ${isActive
            ? 'text-blue-300 bg-blue-500/15 border border-blue-500/25'
            : 'text-[#999] bg-transparent border border-transparent'
          }`}
      >
        {data.label}
      </span>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const getVisuals = (stepName: string) => {
  const lower = stepName.toLowerCase();
  // Translucent lighter backgrounds with subtle color tints
  if (lower.includes('filter') || lower.includes('search'))
    return { icon: Filter, bgClass: 'bg-green-500/30' };
  if (lower.includes('count') || lower.includes('calc') || lower.includes('math'))
    return { icon: Calculator, bgClass: 'bg-purple-500/30' };
  if (lower.includes('match') || lower.includes('find') || lower.includes('visibility'))
    return { icon: Eye, bgClass: 'bg-orange-500/30' };
  if (lower.includes('deconstruct') || lower.includes('psychology') || lower.includes('analysis'))
    return { icon: BrainCircuit, bgClass: 'bg-emerald-500/30' };
  return { icon: BrainCircuit, bgClass: 'bg-indigo-500/30' };
};

interface SelectedInfo {
  index: number;
  label: string;
  content: string;
}

export default function ReasoningChain({ thoughts, isGenerating }: { thoughts: any[], isGenerating?: boolean }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showIcons, setShowIcons] = useState(true);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);

  const handleNodeClick = useCallback((index: number, label: string, content: string) => {
    if (!content) return;
    setSelected((prev) =>
      prev && prev.index === index ? null : { index, label, content }
    );
  }, []);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const startX = 50;
    const endX = Math.max(700, startX + thoughts.length * 160 + 160);
    const centerY = 150;

    // Input Node
    newNodes.push({
      id: 'input',
      type: 'custom',
      position: { x: startX, y: centerY },
      data: {
        label: 'Input', icon: HelpCircle,
        bgClass: 'bg-blue-500/30',
        highlight: true, showIcons, onNodeClick: handleNodeClick,
      }
    });

    let prevId = 'input';

    thoughts.forEach((thought, index) => {
      const { icon, bgClass } = getVisuals(thought.step);
      const id = `thought-${index}`;

      const progress = (index + 1) / (thoughts.length + 1);
      const x = startX + progress * (endX - startX);
      const yOffset = (index % 2 === 0 ? -1 : 1) * (45 + (index % 3) * 12);
      const y = centerY + yOffset;

      const isActive = isGenerating && index === thoughts.length - 1;

      newNodes.push({
        id,
        type: 'custom',
        position: { x, y },
        data: {
          label: thought.step, icon, bgClass,
          content: thought.content, isActive,
          index: index + 1, showIcons,
          onNodeClick: handleNodeClick,
        }
      });

      newEdges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        type: 'straight',
        animated: isActive,
        style: { stroke: isActive ? '#60A5FA' : '#333', strokeWidth: isActive ? 2.5 : 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#60A5FA' : '#333', width: 16, height: 16 }
      });

      prevId = id;
    });

    // Response Node
    const responseId = 'response';
    newNodes.push({
      id: responseId,
      type: 'custom',
      position: { x: endX, y: centerY },
      data: {
        label: 'Response', icon: CheckCircle,
        bgClass: 'bg-emerald-500/30',
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
      style: { stroke: '#333', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#333', width: 16, height: 16 }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, isGenerating, showIcons, handleNodeClick]);

  if (!thoughts || thoughts.length === 0) return null;

  const currentPhaseIndex = isGenerating && thoughts.length > 0 ? thoughts.length : 0;
  const currentPhase = isGenerating && thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;

  return (
    <div className="w-full h-[380px] bg-[#0A0A0B] rounded-2xl border border-[#1A1A1C] overflow-hidden mb-6 mt-2 relative">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10 border-b border-[#1A1A1C] bg-[#0A0A0B]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[#888] text-xs font-medium tracking-widest uppercase">Reasoning Trace</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="flex items-center gap-1.5 text-[#666] hover:text-[#aaa] text-[10px] uppercase font-semibold tracking-wider transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            {showIcons ? 'Numbers' : 'Icons'}
          </button>
          <div className="w-px h-3 bg-[#333]" />
          <span className="text-blue-400/80 text-[10px] uppercase font-semibold tracking-wider">
            {currentPhaseIndex > 0 ? `Phase ${currentPhaseIndex}` : 'Complete'}
          </span>
          <div className="w-px h-3 bg-[#333]" />
          <span className="text-[#555] text-[10px] uppercase font-semibold tracking-wider">
            {thoughts.length} step{thoughts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Graph */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
        onPaneClick={() => setSelected(null)}
      >
        <Background color="#1A1A1C" gap={24} size={1} />
      </ReactFlow>

      {/* Click-to-reveal Info Panel */}
      {selected && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-xl bg-[#141416]/90 backdrop-blur-xl border border-[#2A2A2C] p-4 rounded-xl z-30 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/80 items-center justify-center text-sm font-bold">
              {selected.index}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white/90 font-semibold text-sm">
                  {selected.label}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[#555] hover:text-white/70 transition-colors p-0.5 rounded hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[#999] text-[13px] leading-relaxed line-clamp-3">
                {selected.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Phase Indicator (only while generating) */}
      {currentPhase && !selected && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-xl bg-[#141416]/90 backdrop-blur-xl border border-blue-500/20 p-4 rounded-xl z-20 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 items-center justify-center text-sm font-bold animate-pulse">
              {currentPhaseIndex}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <h3 className="text-white/90 font-semibold text-sm">
                Phase {currentPhaseIndex} — <span className="text-blue-300/80">{currentPhase.step}</span>
              </h3>
              <p className="text-[#888] text-[13px] leading-relaxed line-clamp-2">
                {currentPhase.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
