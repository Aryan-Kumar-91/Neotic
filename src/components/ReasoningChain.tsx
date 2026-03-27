import React, { useState, useEffect } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HelpCircle, CheckCircle, Filter, BrainCircuit, Eye, Calculator } from 'lucide-react';

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div 
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${data.bgColor} 
        ${data.highlight ? 'ring-4 ring-white/60 shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110' : 'group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <span className="text-white text-xs font-bold font-sans drop-shadow-md bg-[#131314]/80 px-2.5 py-1 rounded-full">{data.label}</span>
      {data.content && (
        <div className="absolute top-full mt-2 w-64 p-3 bg-[#1E1E20] border border-[#333] rounded-lg text-xs leading-relaxed text-[#E3E3E3] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
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
      data: { label: 'Input', icon: HelpCircle, bgColor: 'bg-blue-500', highlight: true }
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
      const yOffset = (index % 2 === 0 ? -1 : 1) * (60 + (index % 3) * 20);
      const y = centerY + yOffset;

      newNodes.push({
        id,
        type: 'custom',
        position: { x, y },
        data: { label: thought.step, icon, bgColor: bg, content: thought.content }
      });

      // Edge from previous to current
      newEdges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        animated: isGenerating && index === thoughts.length - 1,
        style: { stroke: '#666', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#666' }
      });

      prevId = id;
    });

    // Response Node
    const responseId = 'response';
    newNodes.push({
      id: responseId,
      type: 'custom',
      position: { x: endX, y: centerY },
      data: { label: 'Response', icon: CheckCircle, bgColor: 'bg-emerald-600', highlight: !isGenerating }
    });

    // Final edge
    newEdges.push({
      id: `e-${prevId}-${responseId}`,
      source: prevId,
      target: responseId,
      animated: isGenerating,
      style: { stroke: '#666', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#666' }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, isGenerating]);

  // If there are no thoughts, we don't render anything (or could just render Input -> Response).
  // But typically it shouldn't be rendered if thoughts is empty.
  if (!thoughts || thoughts.length === 0) return null;

  return (
    <div className="w-full h-[320px] bg-[#0E0E0F] rounded-xl border border-[#1E1E20] overflow-hidden mb-4 mt-2 relative">
      <div className="absolute top-4 flex justify-between w-full px-4 z-10 pointer-events-none">
        <span className="text-white text-sm font-bold tracking-wider opacity-90 drop-shadow-md">LLM Reasoning Chain</span>
        <div className="flex gap-2">
            <span className="text-white text-[10px] uppercase font-semibold bg-[#1E1E20] px-2 py-1 rounded border border-[#333]">PHASE: Reasoning</span>
            <span className="text-white text-[10px] uppercase font-semibold bg-[#1E1E20] px-2 py-1 rounded border border-[#333]">STEPS: {thoughts.length}</span>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
