import React, { useState, useEffect } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HelpCircle, CheckCircle, Filter, BrainCircuit, Eye, Calculator } from 'lucide-react';

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  // Apply a pulse animation if it's the actively generating node
  const activeClasses = data.isActive 
    ? 'ring-4 ring-white/80 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-110 animate-pulse' 
    : 'group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]';

  const highlightClasses = data.highlight && !data.isActive
    ? 'ring-4 ring-white/40 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
    : '';

  return (
    <div className="flex flex-col items-center gap-2 group relative transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-4">
      <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />
      <div 
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${data.bgColor} ${activeClasses} ${highlightClasses}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />
      <span className="text-white text-xs font-bold font-sans drop-shadow-md bg-[#131314]/90 border border-[#333] px-3 py-1.5 rounded-full whitespace-nowrap">{data.label}</span>
      
      {/* Fallback hover tooltip for older nodes */}
      {!data.isActive && data.content && (
        <div className="absolute top-full mt-2 w-64 p-3 bg-[#1E1E20]/95 backdrop-blur-md border border-[#333] rounded-lg text-xs leading-relaxed text-[#E3E3E3] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          {data.content}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const getVisuals = (stepName: string) => {
  const lower = stepName.toLowerCase();
  if (lower.includes('filter') || lower.includes('search')) return { icon: Filter, bg: 'bg-green-500' };
  if (lower.includes('count') || lower.includes('calc') || lower.includes('math')) return { icon: Calculator, bg: 'bg-purple-500' };
  if (lower.includes('match') || lower.includes('find') || lower.includes('visibility')) return { icon: Eye, bg: 'bg-orange-500' };
  if (lower.includes('deconstruct') || lower.includes('psychology') || lower.includes('analysis')) return { icon: BrainCircuit, bg: 'bg-emerald-500' };
  return { icon: BrainCircuit, bg: 'bg-indigo-500' };
};

export default function ReasoningChain({ thoughts, isGenerating }: { thoughts: any[], isGenerating?: boolean }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Dimensions
    const startX = 50;
    const endX = Math.max(700, startX + thoughts.length * 160 + 160);
    const centerY = 150;

    // Input Node
    newNodes.push({
      id: 'input',
      type: 'custom',
      position: { x: startX, y: centerY },
      data: { label: 'Input', icon: HelpCircle, bgColor: 'bg-blue-600', highlight: true }
    });

    let prevId = 'input';

    // Thoughts Nodes
    thoughts.forEach((thought, index) => {
      const { icon, bg } = getVisuals(thought.step);
      const id = `thought-${index}`;
      
      // Spread evenly across X
      const progress = (index + 1) / (thoughts.length + 1);
      const x = startX + progress * (endX - startX);
      
      // Alternate Y around center to make a DAG look
      const yOffset = (index % 2 === 0 ? -1 : 1) * (50 + (index % 3) * 15);
      const y = centerY + yOffset;

      const isActive = isGenerating && index === thoughts.length - 1;

      newNodes.push({
        id,
        type: 'custom',
        position: { x, y },
        data: { label: thought.step, icon, bgColor: bg, content: thought.content, isActive }
      });

      // Edge from previous to current
      newEdges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        animated: isActive,
        style: { stroke: isActive ? '#3B82F6' : '#555', strokeWidth: isActive ? 3 : 2, transition: 'stroke 0.5s ease' },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#3B82F6' : '#555' }
      });

      prevId = id;
    });

    // Response Node
    const responseId = 'response';
    newNodes.push({
      id: responseId,
      type: 'custom',
      position: { x: endX, y: centerY },
      data: { label: 'Response', icon: CheckCircle, bgColor: 'bg-emerald-600', highlight: !isGenerating && thoughts.length > 0 }
    });

    // Final edge
    const isFinalizing = isGenerating && thoughts.length > 0; // The final edge is drawn, waiting for response
    newEdges.push({
      id: `e-${prevId}-${responseId}`,
      source: prevId,
      target: responseId,
      animated: isFinalizing,
      style: { stroke: '#555', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#555' }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, isGenerating]);

  if (!thoughts || thoughts.length === 0) return null;

  const currentPhaseIndex = isGenerating && thoughts.length > 0 ? thoughts.length : 0;
  const currentPhase = isGenerating && thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;

  return (
    <div className="w-full h-[380px] bg-[#0E0E0F] rounded-xl border border-[#1E1E20] overflow-hidden mb-6 mt-2 relative shadow-inner">
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
        <span className="text-white text-sm font-bold tracking-wider opacity-90 drop-shadow-md flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-blue-400" />
          LLM Reasoning Chain
        </span>
        <div className="flex gap-2">
            <span className="text-white text-[10px] uppercase font-semibold bg-[#1E1E20]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#333] shadow-sm">
              Phase: {currentPhaseIndex > 0 ? currentPhaseIndex : 'Done'}
            </span>
            <span className="text-white text-[10px] uppercase font-semibold bg-[#1E1E20]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#333] shadow-sm">
              Steps: {thoughts.length}
            </span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="opacity-90 transition-opacity duration-1000"
      >
        <Background color="#333" gap={20} size={1} />
      </ReactFlow>

      {/* Dynamic Overlay for the Current Phase Context */}
      {currentPhase && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1E1E20]/85 backdrop-blur-xl border border-white/10 p-4 rounded-2xl z-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 h-8 w-8 mt-0.5 rounded-full bg-blue-500/20 text-blue-400 items-center justify-center text-sm font-bold ring-2 ring-blue-500/50 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {currentPhaseIndex}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <h3 className="text-white font-semibold text-sm tracking-wide">
                Phase {currentPhaseIndex}: <span className="text-blue-200">{currentPhase.step}</span>
              </h3>
              <p className="text-[#E3E3E3] text-[13px] leading-relaxed line-clamp-2 pr-2">
                {currentPhase.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
