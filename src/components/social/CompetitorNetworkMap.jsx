import { useRef, useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  TrendingUp,
  Users,
  Sparkles,
  Eye,
} from 'lucide-react';

export default function CompetitorNetworkMap({
  competitors,
  onSelectCompetitor,
  socialAccounts = [],
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Calculate your brand's stats
  const yourBrandStats = useMemo(() => {
    const totalFollowers = socialAccounts.reduce((sum, a) => sum + (a.followers_count || 0), 0);
    const avgEngagement =
      socialAccounts.length > 0
        ? socialAccounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
          socialAccounts.length
        : 0;
    return { totalFollowers, avgEngagement, platforms: socialAccounts.length };
  }, [socialAccounts]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 400 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Animate rotation
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setRotation((prev) => (prev + 0.001) % (2 * Math.PI));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  useEffect(() => {
    if (!competitors || competitors.length === 0) {
      return;
    }

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.32 * zoom;

    // Sort competitors by followers for layered positioning
    const sortedCompetitors = [...competitors].sort((a, b) => {
      const aFollowers = (a.social_accounts || []).reduce(
        (sum, acc) => sum + (acc.followers || 0),
        0
      );
      const bFollowers = (b.social_accounts || []).reduce(
        (sum, acc) => sum + (acc.followers || 0),
        0
      );
      return bFollowers - aFollowers;
    });

    const newNodes = sortedCompetitors.map((comp, idx) => {
      const angle = (2 * Math.PI * idx) / sortedCompetitors.length - Math.PI / 2 + rotation;
      const totalFollowers = (comp.social_accounts || []).reduce(
        (sum, a) => sum + (a.followers || 0),
        0
      );
      const avgEngagement =
        comp.social_accounts?.length > 0
          ? comp.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
            comp.social_accounts.length
          : 0;

      // Vary radius based on engagement - higher engagement = closer to center
      const radiusMultiplier = 0.85 + (1 - Math.min(avgEngagement, 10) / 10) * 0.3;
      const radius = baseRadius * radiusMultiplier;

      const nodeSize = Math.min(55, Math.max(30, 24 + Math.log10(totalFollowers + 1) * 6));

      // Calculate threat level based on followers and engagement
      const threatScore = Math.min(100, (totalFollowers / 100000) * 30 + avgEngagement * 7);

      return {
        id: comp.id,
        name: comp.name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        size: nodeSize,
        followers: totalFollowers,
        engagement: avgEngagement,
        accounts: comp.social_accounts || [],
        strengths: comp.strengths || [],
        weaknesses: comp.weaknesses || [],
        color: getCompetitorColor(idx),
        competitor: comp,
        threatScore,
        hasInsights: !!(comp.content_strategy || comp.predicted_campaigns?.length),
        recentNews: comp.news_mentions?.length || 0,
      };
    });

    // Add center node (your brand)
    newNodes.unshift({
      id: 'center',
      name: 'Your Brand',
      x: centerX,
      y: centerY,
      size: 50,
      color: '#8b5cf6',
      isCenter: true,
      followers: yourBrandStats.totalFollowers,
      engagement: yourBrandStats.avgEngagement,
      platforms: yourBrandStats.platforms,
    });

    setNodes(newNodes);
  }, [competitors, dimensions, zoom, rotation, yourBrandStats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const centerNode = nodes.find((n) => n.isCenter);

    // Draw background grid pattern
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < dimensions.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    for (let y = 0; y < dimensions.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }

    // Draw orbital rings
    if (centerNode) {
      [0.6, 0.8, 1].forEach((mult, i) => {
        const radius = Math.min(dimensions.width, dimensions.height) * 0.32 * zoom * mult;
        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 - i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw gradient connections
    if (centerNode) {
      nodes
        .filter((n) => !n.isCenter)
        .forEach((node) => {
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;

          // Draw connection line with pulse effect if selected
          const gradient = ctx.createLinearGradient(centerNode.x, centerNode.y, node.x, node.y);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
          gradient.addColorStop(0.5, node.color + '40');
          gradient.addColorStop(1, node.color + '70');

          ctx.beginPath();
          ctx.moveTo(centerNode.x, centerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = isHovered || isSelected ? node.color : gradient;
          ctx.lineWidth = isHovered || isSelected ? 3 : 1.5;
          ctx.stroke();

          // Draw threat indicator dots along the line
          if (node.threatScore > 60) {
            const midX = (centerNode.x + node.x) / 2;
            const midY = (centerNode.y + node.y) / 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 4, 0, Math.PI * 2);
            ctx.fillStyle = node.threatScore > 80 ? '#ef4444' : '#f59e0b';
            ctx.fill();
          }
        });
    }

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;

      // Outer glow (larger for hovered/selected)
      const glowSize = isHovered || isSelected ? 20 : 14;
      const glowGradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        node.size / 2 + glowSize
      );
      glowGradient.addColorStop(0, node.color + (isHovered || isSelected ? '50' : '30'));
      glowGradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2 + glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Main node with 3D effect
      const nodeGradient = ctx.createRadialGradient(
        node.x - node.size / 5,
        node.y - node.size / 5,
        0,
        node.x,
        node.y,
        node.size / 2
      );
      nodeGradient.addColorStop(0, lightenColor(node.color, 30));
      nodeGradient.addColorStop(0.5, node.color);
      nodeGradient.addColorStop(1, darkenColor(node.color, 20));

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // White rim
      ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = isHovered || isSelected ? 3 : 2;
      ctx.stroke();

      // Highlight shine
      ctx.beginPath();
      ctx.arc(node.x - node.size / 5, node.y - node.size / 5, node.size / 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();

      // Insights indicator badge
      if (!node.isCenter && node.hasInsights) {
        ctx.beginPath();
        ctx.arc(node.x + node.size / 3, node.y - node.size / 3, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Star icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', node.x + node.size / 3, node.y - node.size / 3);
      }

      // News indicator
      if (!node.isCenter && node.recentNews > 0) {
        ctx.beginPath();
        ctx.arc(node.x - node.size / 3, node.y - node.size / 3, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          node.recentNews > 9 ? '9+' : node.recentNews,
          node.x - node.size / 3,
          node.y - node.size / 3
        );
      }

      // Label
      ctx.fillStyle = '#1f2937';
      ctx.font = `${isHovered || isSelected ? '600' : '500'} 11px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = node.name.length > 14 ? node.name.slice(0, 14) + '…' : node.name;
      ctx.fillText(label, node.x, node.y + node.size / 2 + 8);

      // Follower count
      if (node.followers > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '500 9px Inter, system-ui, sans-serif';
        const followerText = formatNumber(node.followers);
        ctx.fillText(followerText + ' followers', node.x, node.y + node.size / 2 + 22);
      }

      // Engagement badge for non-center nodes
      if (!node.isCenter && node.engagement > 0) {
        ctx.fillStyle =
          node.engagement > 5 ? '#10b981' : node.engagement > 2 ? '#f59e0b' : '#6b7280';
        ctx.font = 'bold 8px Inter, system-ui, sans-serif';
        ctx.fillText(`${node.engagement.toFixed(1)}% eng`, node.x, node.y + node.size / 2 + 34);
      }
    });
  }, [nodes, hoveredNode, selectedNode, dimensions]);

  const handleCanvasInteraction = (e, isClick = false) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hitNode = nodes.find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2 + 5;
    });

    if (isClick && hitNode && !hitNode.isCenter) {
      setSelectedNode(hitNode.id);
      if (onSelectCompetitor) {
        onSelectCompetitor(hitNode.competitor);
      }
    } else if (!isClick) {
      setHoveredNode(hitNode?.id || null);
      canvas.style.cursor = hitNode && !hitNode.isCenter ? 'pointer' : 'default';
    }
  };

  const hoveredNodeData = nodes.find((n) => n.id === hoveredNode);

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
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/80 via-white/60 to-violet-50/40 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-violet-900/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_60%)]" />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100/80 dark:bg-violet-900/40">
              <Network className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Competitive Landscape
            </span>
            <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">
              {competitors.length} tracked
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 ${isAnimating ? 'text-violet-600' : ''}`}
              onClick={() => setIsAnimating(!isAnimating)}
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin' : ''}`}
                style={{ animationDuration: '3s' }}
              />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={(e) => handleCanvasInteraction(e, true)}
          onMouseMove={(e) => handleCanvasInteraction(e, false)}
          onMouseLeave={() => setHoveredNode(null)}
          className="w-full rounded-xl"
          style={{ height: '400px' }}
        />

        {/* Enhanced Tooltip */}
        {hoveredNodeData && !hoveredNodeData.isCenter && (
          <div className="absolute top-20 right-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-2xl p-4 w-56 border border-gray-200/50 dark:border-gray-700/50 z-10">
            <div className="flex items-start justify-between mb-2">
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                {hoveredNodeData.name}
              </p>
              {hoveredNodeData.hasInsights && (
                <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  AI
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <Users className="w-3.5 h-3.5 text-violet-500 mx-auto mb-0.5" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {formatNumber(hoveredNodeData.followers)}
                </p>
                <p className="text-[10px] text-gray-500">Followers</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {hoveredNodeData.engagement.toFixed(1)}%
                </p>
                <p className="text-[10px] text-gray-500">Engagement</p>
              </div>
            </div>

            {hoveredNodeData.accounts?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-500 mb-1">Platforms</p>
                <div className="flex flex-wrap gap-1">
                  {hoveredNodeData.accounts.slice(0, 4).map((acc, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {acc.platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hoveredNodeData.threatScore > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-500 mb-1">Threat Level</p>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      hoveredNodeData.threatScore > 80
                        ? 'bg-red-500'
                        : hoveredNodeData.threatScore > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${hoveredNodeData.threatScore}%` }}
                  />
                </div>
              </div>
            )}

            {hoveredNodeData.strengths?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-500 mb-1">Top Strength</p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2">
                  {hoveredNodeData.strengths[0]}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click for details
              </p>
              {hoveredNodeData.recentNews > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                  {hoveredNodeData.recentNews} news
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-violet-500 shadow-sm" />
            <span>Your Brand</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-sm" />
            <span>Competitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex items-center justify-center">
              <span className="text-white text-[7px]">★</span>
            </div>
            <span>AI Insights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Threat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCompetitorColor(index) {
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#6366f1',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#06b6d4',
    '#84cc16',
  ];
  return colors[index % colors.length];
}

function formatNumber(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}
