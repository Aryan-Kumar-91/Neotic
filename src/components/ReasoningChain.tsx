import React, { useState, useEffect } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HelpCircle, CheckCircle, Filter, BrainCircuit, Eye, Calculator, Image as ImageIcon } from 'lucide-react';

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  // Bubbly textures using strong gradients, inset shadows for 3D effect, and white top borders
  const activeClasses = data.isActive 
    ? 'ring-4 ring-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.8)] scale-[1.3] z-50 animate-pulse' 
    : 'group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-60 grayscale-[30%]';

  const highlightClasses = data.highlight && !data.isActive
    ? 'ring-2 ring-white/60 shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 opacity-100 grayscale-0'
    : '';

  return (
    <div className={`flex flex-col items-center gap-2 group relative transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-4 ${data.isActive ? 'z-50' : 'z-10'}`}>
      <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />
      <div 
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[inset_0_-5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_15px_rgba(0,0,0,0.3)] border border-white/20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${data.bgGradient} ${activeClasses} ${highlightClasses}`}
      >
        {data.showIcons ? (
          <Icon className="w-6 h-6 drop-shadow-lg" />
        ) : (
          <span className="font-bold text-lg drop-shadow-lg">{data.index !== undefined ? data.index : (data.label === 'Input' ? 'In' : 'Out')}</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />
      
      {/* Node Label Pill */}
      <span className={`text-white text-[11px] font-bold tracking-wide font-sans drop-shadow-md border px-3 py-1.5 rounded-full whitespace-nowrap transition-colors duration-300 ${data.isActive ? 'bg-blue-600 border-blue-400 scale-110' : 'bg-[#1E1E20]/90 border-[#333]'}`}>
        {data.label}
      </span>
      
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
  if (lower.includes('filter') || lower.includes('search')) return { icon: Filter, bgGradient: 'bg-gradient-to-br from-green-400 to-green-600' };
  if (lower.includes('count') || lower.includes('calc') || lower.includes('math')) return { icon: Calculator, bgGradient: 'bg-gradient-to-br from-purple-400 to-purple-600' };
  if (lower.includes('match') || lower.includes('find') || lower.includes('visibility')) return { icon: Eye, bgGradient: 'bg-gradient-to-br from-orange-400 to-orange-600' };
  if (lower.includes('deconstruct') || lower.includes('psychology') || lower.includes('analysis')) return { icon: BrainCircuit, bgGradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600' };
  return { icon: BrainCircuit, bgGradient: 'bg-gradient-to-br from-indigo-400 to-indigo-600' };
};

export default function ReasoningChain({ thoughts, isGenerating }: { thoughts: any[], isGenerating?: boolean }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showIcons, setShowIcons] = useState(true);

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
      data: { label: 'Input', icon: HelpCircle, bgGradient: 'bg-gradient-to-br from-blue-500 to-blue-700', highlight: true, showIcons }
    });

    let prevId = 'input';

    // Thoughts Nodes
    thoughts.forEach((thought, index) => {
      const { icon, bgGradient } = getVisuals(thought.step);
      const id = `thought-${index}`;
      
      // Spread evenly across X
      const progress = (index + 1) / (thoughts.length + 1);
      const x = startX + progress * (endX - startX);
      
      // Bubble floating effect Y offsets
      const yOffset = (index % 2 === 0 ? -1 : 1) * (50 + (index % 3) * 15);
      const y = centerY + yOffset;

      const isActive = isGenerating && index === thoughts.length - 1;

      newNodes.push({
        id,
        type: 'custom',
        position: { x, y },
        data: { label: thought.step, icon, bgGradient, content: thought.content, isActive, index: index + 1, showIcons }
      });

      // Edge from previous to current (Straight line)
      newEdges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        type: 'straight',
        animated: isActive,
        style: { stroke: isActive ? '#60A5FA' : '#444', strokeWidth: isActive ? 3 : 2, transition: 'stroke 0.5s ease' },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#60A5FA' : '#444' }
      });

      prevId = id;
    });

    // Response Node
    const responseId = 'response';
    newNodes.push({
      id: responseId,
      type: 'custom',
      position: { x: endX, y: centerY },
      data: { label: 'Response', icon: CheckCircle, bgGradient: 'bg-gradient-to-br from-emerald-500 to-emerald-800', highlight: !isGenerating && thoughts.length > 0, showIcons }
    });

    // Final edge
    const isFinalizing = isGenerating && thoughts.length > 0;
    newEdges.push({
      id: `e-${prevId}-${responseId}`,
      source: prevId,
      target: responseId,
      type: 'straight',
      animated: isFinalizing,
      style: { stroke: '#444', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#444' }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, isGenerating, showIcons]);

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
        <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setShowIcons(!showIcons)}
              className="flex items-center gap-1.5 text-white text-[10px] uppercase font-bold bg-[#1E1E20]/90 hover:bg-[#333] transition-colors backdrop-blur-sm px-2.5 py-1 rounded border border-[#444] shadow-sm cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              {showIcons ? 'Hide Icons' : 'Show Icons'}
            </button>
            <span className="text-blue-300 text-[10px] uppercase font-bold bg-blue-900/40 backdrop-blur-sm px-2.5 py-1 rounded border border-blue-500/30 shadow-sm flex items-center">
              Phase: {currentPhaseIndex > 0 ? currentPhaseIndex : 'Done'}
            </span>
            <span className="text-white text-[10px] uppercase font-bold bg-[#1E1E20]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#333] shadow-sm flex items-center">
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1E1E20]/85 backdrop-blur-xl border border-blue-500/30 p-4 rounded-3xl z-20 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.15)] transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in">
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white items-center justify-center text-lg font-black ring-2 ring-blue-400/50 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),0_0_15px_rgba(59,130,246,0.5)] animate-pulse">
              {currentPhaseIndex}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden mt-0.5">
              <h3 className="text-white font-bold text-[15px] tracking-wide">
                Phase {currentPhaseIndex} — <span className="text-blue-300">{currentPhase.step}</span>
              </h3>
              <p className="text-[#E3E3E3] text-[13px] leading-relaxed line-clamp-2 pr-2 opacity-90">
                {currentPhase.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
