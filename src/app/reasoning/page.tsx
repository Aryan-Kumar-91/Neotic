"use client";

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {};
const edgeTypes = {};

// We wrap the inner component so we can use the useReactFlow hook
function Flow() {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isThinking, setIsThinking] = useState(false);
  const { fitView } = useReactFlow();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || isThinking) return;

    const userPrompt = inputText;
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setInputText('');
    setIsThinking(true);
    setNodes([]);
    setEdges([]);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });

      const data = await response.json();
      console.log("CRITICAL DEBUG - DATA RECEIVED:", data);

      setMessages(prev => [...prev, { role: 'ai', content: data.final_answer }]);

      if (data.thoughts && Array.isArray(data.thoughts)) {
        for (let i = 0; i < data.thoughts.length; i++) {
          await new Promise(r => setTimeout(r, 600));

          const newNode: Node = {
            id: `step-${i}`,
            position: { x: 250, y: i * 150 + 50 },
            data: { label: data.thoughts[i].step },
            style: { background: '#1E1E20', color: '#FFF', border: '2px solid #4285F4', width: 200, padding: 10, borderRadius: 8 }
          };

          setNodes((nds) => nds.concat(newNode));

          if (i > 0) {
            setEdges((eds) => eds.concat({
              id: `e-${i}`, source: `step-${i - 1}`, target: `step-${i}`, animated: true, style: { stroke: '#9B72CB' }
            }));
          }

          // FORCE THE CAMERA TO FIND THE NODES
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
        }
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#131314' }}>
      <div style={{ width: '350px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '10px', color: '#FFF' }}>
              <strong>{m.role.toUpperCase()}:</strong> {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} style={{ padding: '20px' }}>
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#222', color: '#FFF', border: '1px solid #444' }}
            placeholder="Type and press Enter..."
          />
        </form>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

// WRAPPER IS REQUIRED FOR useReactFlow TO WORK
export default function ReasoningPage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}