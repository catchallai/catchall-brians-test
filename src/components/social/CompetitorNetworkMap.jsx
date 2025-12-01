import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function CompetitorNetworkMap({ competitors, onSelectCompetitor }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (!competitors || competitors.length === 0) return;

    // Create nodes from competitors
    const centerX = 300;
    const centerY = 200;
    const radius = 150;

    const newNodes = competitors.map((comp, idx) => {
      const angle = (2 * Math.PI * idx) / competitors.length - Math.PI / 2;
      const totalFollowers = (comp.social_accounts || []).reduce((sum, a) => sum + (a.followers || 0), 0);
      const nodeSize = Math.min(60, Math.max(30, 20 + Math.log10(totalFollowers + 1) * 8));
      
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

    // Add center node (Your Brand)
    newNodes.unshift({
      id: 'center',
      name: 'Your Brand',
      x: centerX,
      y: centerY,
      size: 50,
      color: '#8b5cf6',
      isCenter: true,
    });

    setNodes(newNodes);
  }, [competitors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(zoom, zoom);

    // Draw connections
    const centerNode = nodes.find(n => n.isCenter);
    if (centerNode) {
      nodes.filter(n => !n.isCenter).forEach(node => {
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = hoveredNode === node.id ? '#8b5cf6' : '#e5e7eb';
        ctx.lineWidth = hoveredNode === node.id ? 2 : 1;
        ctx.stroke();
      });
    }

    // Draw nodes
    nodes.forEach(node => {
      // Glow effect for hovered
      if (hoveredNode === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2 + 8, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '30';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#374151';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name;
      ctx.fillText(label, node.x, node.y + node.size / 2 + 14);

      // Follower count for non-center nodes
      if (!node.isCenter && node.followers > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px Inter, sans-serif';
        const followerText = node.followers >= 1000000 
          ? `${(node.followers/1000000).toFixed(1)}M` 
          : node.followers >= 1000 
            ? `${(node.followers/1000).toFixed(0)}K` 
            : node.followers;
        ctx.fillText(followerText, node.x, node.y + node.size / 2 + 26);
      }
    });

    ctx.restore();
  }, [nodes, zoom, hoveredNode]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2;
    });

    if (clickedNode && !clickedNode.isCenter && onSelectCompetitor) {
      onSelectCompetitor(clickedNode.competitor);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const hovered = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2;
    });

    setHoveredNode(hovered?.id || null);
    canvas.style.cursor = hovered && !hovered.isCenter ? 'pointer' : 'default';
  };

  const hoveredNodeData = nodes.find(n => n.id === hoveredNode);

  if (!competitors || competitors.length === 0) {
    return (
      <Card className="glass-card rounded-2xl">
        <CardContent className="py-12 text-center">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Add competitors to see the network map</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="w-5 h-5 text-violet-500" />
            Competitor Network
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(1)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            className="w-full rounded-lg bg-gray-50 dark:bg-gray-800"
          />
          
          {/* Tooltip */}
          {hoveredNodeData && !hoveredNodeData.isCenter && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-[200px] border">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{hoveredNodeData.name}</p>
              {hoveredNodeData.accounts?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {hoveredNodeData.accounts.slice(0, 3).map((acc, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {acc.platform}
                    </Badge>
                  ))}
                </div>
              )}
              {hoveredNodeData.strengths?.length > 0 && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {hoveredNodeData.strengths[0]}
                </p>
              )}
              <p className="text-xs text-violet-600 mt-2">Click to view details</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Your Brand</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Competitors</span>
          </div>
          <span className="text-gray-400">• Node size = follower count</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getCompetitorColor(index) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];
  return colors[index % colors.length];
}