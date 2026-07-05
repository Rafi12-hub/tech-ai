import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';
import { useAnalysis } from '../../lib/AnalysisContext';

const nodeColors = {
  concept: '#3B82F6',
  entity: '#8B5CF6',
  metric: '#10B981',
  method: '#F59E0B',
  technology: '#EF4444'
};

function simulateForce(nodes, edges, width, height) {
  const repulsion = 300;
  const attraction = 0.005;
  const centerForce = 0.01;
  const damping = 0.9;

  const positions = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.3;
    return {
      ...n,
      x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
      y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
      vx: 0, vy: 0
    };
  });

  for (let iter = 0; iter < 100; iter++) {
    // Repulsion
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        positions[i].vx -= fx;
        positions[i].vy -= fy;
        positions[j].vx += fx;
        positions[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = positions.find(n => n.id === edge.source);
      const target = positions.find(n => n.id === edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 100) * attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Center force
    for (const pos of positions) {
      pos.vx += (width / 2 - pos.x) * centerForce;
      pos.vy += (height / 2 - pos.y) * centerForce;
    }

    // Apply velocity with damping
    for (const pos of positions) {
      pos.vx *= damping;
      pos.vy *= damping;
      pos.x += pos.vx;
      pos.y += pos.vy;
    }
  }

  return positions;
}

export default function KnowledgeGraphTab() {
  const { analysis } = useAnalysis();
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [positions, setPositions] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dim, setDim] = useState({ width: 800, height: 500 });

  const kg = analysis?.knowledge_graph;
  const nodes = kg?.nodes || [];
  const edges = kg?.edges || [];

  useEffect(() => {
    if (nodes.length > 0) {
      setPositions(simulateForce(nodes, edges, dim.width, dim.height));
    }
  }, [nodes, edges, dim.width, dim.height]);

  useEffect(() => {
    const updateSize = () => {
      const parent = svgRef.current?.parentElement;
      if (parent) {
        setDim({ width: parent.clientWidth, height: Math.max(400, parent.clientHeight) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = useCallback((nodeId, e) => {
    setDragging(nodeId);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setPositions(prev => prev.map(p => p.id === dragging ? { ...p, x, y } : p));
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  if (!analysis || !kg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <Network className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No knowledge graph available</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document to generate a knowledge graph</p>
      </div>
    );
  }

  const hoveredEdges = hoveredNode
    ? edges.filter(e => e.source === hoveredNode || e.target === hoveredNode)
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Knowledge Graph</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Interactive concept map</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-dark-card transition-all">
            <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))} className="p-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-dark-card transition-all">
            <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => setPositions(simulateForce(nodes, edges, dim.width, dim.height))}
            className="p-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-dark-card transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 overflow-hidden relative" style={{ height: dim.height + 32 }}>
        <svg
          ref={svgRef}
          width={dim.width}
          height={dim.height}
          viewBox={`0 0 ${dim.width} ${dim.height}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full"
        >
          <g transform={`scale(${zoom})`}>
            {/* Edges */}
            {edges.map((edge, i) => {
              const source = positions.find(p => p.id === edge.source);
              const target = positions.find(p => p.id === edge.target);
              if (!source || !target) return null;
              const isHighlighted = !hoveredNode || hoveredEdges.includes(edge);
              const opacity = hoveredNode ? (isHighlighted ? 0.8 : 0.1) : 0.3;

              return (
                <g key={i}>
                  <line
                    x1={source.x} y1={source.y}
                    x2={target.x} y2={target.y}
                    stroke="#94A3B8"
                    strokeWidth={isHighlighted && hoveredNode ? 2 : 1}
                    opacity={opacity}
                  />
                  {isHighlighted && hoveredNode && edge.label && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 8}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="10"
                      className="dark:fill-slate-400"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {positions.map((pos) => {
              const node = nodes.find(n => n.id === pos.id);
              if (!node) return null;
              const color = nodeColors[node.type] || '#3B82F6';
              const isHovered = hoveredNode === node.id;
              const isDimmed = hoveredNode && !hoveredEdges.some(e => e.source === node.id || e.target === node.id) && hoveredNode !== node.id;

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  style={{ cursor: dragging === node.id ? 'grabbing' : 'grab' }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 28 : 22}
                    fill={color}
                    opacity={isDimmed ? 0.2 : 0.9}
                    stroke={isHovered ? '#fff' : 'none'}
                    strokeWidth={2}
                    className="transition-all duration-200"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {node.label.substring(0, 12)}{node.label.length > 12 ? '...' : ''}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Legend:</span>
        {Object.entries(nodeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>

      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {nodes.find(n => n.id === hoveredNode)?.label}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Connected to: {hoveredEdges.map(e => {
              const otherId = e.source === hoveredNode ? e.target : e.source;
              return nodes.find(n => n.id === otherId)?.label;
            }).join(', ') || 'None'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
