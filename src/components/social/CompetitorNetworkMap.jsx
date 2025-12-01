import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

export default function CompetitorNetworkMap({ competitors, onSelectCompetitor }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 350 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!competitors || competitors.length === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    const newNodes = competitors.map((comp, idx) => {
      const angle = (2 * Math.PI * idx) / competitors.length - Math.PI / 2;
      const totalFollowers = (comp.social_accounts || []).reduce((sum, a) => sum + (a.followers || 0), 0);
      const nodeSize = Math.min(50, Math.max(28, 22 + Math.log10(totalFollowers + 1) * 6));
      
      return {
        id: comp.id,
        name: comp.name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        size: nodeSize,
        followers: totalFollowers,
        accounts: comp.social_accounts || [],
        strengths: comp.strengths || [],
        color: getCompetitorColor(idx),
        competitor: comp,
      };
    });

    newNodes.unshift({
      id: 'center',
      name: 'Your Brand',
      x: centerX,
      y: centerY,
      size: 44,
      color: '#8b5cf6',
      isCenter: true,
    });

    setNodes(newNodes);
  }, [competitors, dimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const centerNode = nodes.find(n => n.isCenter);
    
    // Draw gradient connections
    if (centerNode) {
      nodes.filter(n => !n.isCenter).forEach(node => {
        const gradient = ctx.createLinearGradient(centerNode.x, centerNode.y, node.x, node.y);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
        gradient.addColorStop(1, node.color + '60');
        
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = hoveredNode === node.id ? node.color : gradient;
        ctx.lineWidth = hoveredNode === node.id ? 2.5 : 1.5;
        ctx.stroke();
      });
    }

    // Draw nodes with glass effect
    nodes.forEach(node => {
      // Outer glow
      const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size / 2 + 12);
      glowGradient.addColorStop(0, node.color + '30');
      glowGradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2 + 12, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Glass node
      const nodeGradient = ctx.createRadialGradient(
        node.x - node.size / 6, node.y - node.size / 6, 0,
        node.x, node.y, node.size / 2
      );
      nodeGradient.addColorStop(0, node.color + 'ee');
      nodeGradient.addColorStop(0.7, node.color);
      nodeGradient.addColorStop(1, node.color + 'cc');

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();
      
      // White rim
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Highlight
      ctx.beginPath();
      ctx.arc(node.x - node.size / 6, node.y - node.size / 6, node.size / 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();

      // Label
      ctx.fillStyle = '#1f2937';
      ctx.font = '500 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const label = node.name.length > 14 ? node.name.slice(0, 14) + '…' : node.name;
      ctx.fillText(label, node.x, node.y + node.size / 2 + 16);

      if (!node.isCenter && node.followers > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px Inter, system-ui, sans-serif';
        const followerText = node.followers >= 1000000 
          ? `${(node.followers/1000000).toFixed(1)}M` 
          : node.followers >= 1000 
            ? `${(node.followers/1000).toFixed(0)}K` 
            : node.followers;
        ctx.fillText(followerText, node.x, node.y + node.size / 2 + 28);
      }
    });
  }, [nodes, hoveredNode, dimensions]);

  const handleCanvasInteraction = (e, isClick = false) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hitNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2 + 5;
    });

    if (isClick && hitNode && !hitNode.isCenter && onSelectCompetitor) {
      onSelectCompetitor(hitNode.competitor);
    } else if (!isClick) {
      setHoveredNode(hitNode?.id || null);
      canvas.style.cursor = hitNode && !hitNode.isCenter ? 'pointer' : 'default';
    }
  };

  const hoveredNodeData = nodes.find(n => n.id === hoveredNode);

  if (!competitors || competitors.length === 0) {
    return (
      <Card className="glass-card rounded-2xl border-0">
        <CardContent className="py-12 text-center">
          <Network className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Add competitors to see the network</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/60 via-white/40 to-violet-50/30 dark:from-gray-800/60 dark:via-gray-800/40 dark:to-violet-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />
      
      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-violet-100/80 dark:bg-violet-900/40">
            <Network className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">Competitor Network</span>
        </div>

        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={(e) => handleCanvasInteraction(e, true)}
          onMouseMove={(e) => handleCanvasInteraction(e, false)}
          onMouseLeave={() => setHoveredNode(null)}
          className="w-full rounded-xl"
          style={{ height: '350px' }}
        />

        {/* Tooltip */}
        {hoveredNodeData && !hoveredNodeData.isCenter && (
          <div className="absolute top-16 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-3 max-w-[180px] border border-white/50 dark:border-gray-700/50">
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{hoveredNodeData.name}</p>
            {hoveredNodeData.accounts?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {hoveredNodeData.accounts.slice(0, 3).map((acc, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                    {acc.platform}
                  </Badge>
                ))}
              </div>
            )}
            {hoveredNodeData.strengths?.length > 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                {hoveredNodeData.strengths[0]}
              </p>
            )}
            <p className="text-[10px] text-violet-500 mt-2 font-medium">Click to view →</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm" />
            <span>Your Brand</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-sm" />
            <span>Competitors</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCompetitorColor(index) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];
  return colors[index % colors.length];
}