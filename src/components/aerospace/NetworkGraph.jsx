import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

export default function NetworkGraph({ companies }) {
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map();
    const edgeList = [];

    // Create nodes for each company
    companies.forEach((company, idx) => {
      if (!nodeMap.has(company.company_name)) {
        nodeMap.set(company.company_name, {
          id: company.company_name,
          x: 250 + Math.cos((idx * 2 * Math.PI) / companies.length) * 200,
          y: 250 + Math.sin((idx * 2 * Math.PI) / companies.length) * 200,
          ticker: company.ticker_symbol,
          employees: company.employee_count,
          partnerships: company.partnerships?.length || 0,
          competitors: company.competitors || [],
        });
      }
    });

    // Create edges for partnerships
    companies.forEach((company) => {
      company.partnerships?.forEach((partnership) => {
        const targetNode = Array.from(nodeMap.values()).find(
          (n) =>
            n.id.toLowerCase().includes(partnership.partner.toLowerCase()) ||
            partnership.partner.toLowerCase().includes(n.id.toLowerCase())
        );

        if (targetNode) {
          edgeList.push({
            source: company.company_name,
            target: targetNode.id,
            type: 'partnership',
          });
        }
      });

      // Create edges for competitors (lighter)
      company.competitors?.forEach((competitor) => {
        const targetNode = Array.from(nodeMap.values()).find(
          (n) =>
            n.id.toLowerCase().includes(competitor.toLowerCase()) ||
            competitor.toLowerCase().includes(n.id.toLowerCase())
        );

        if (
          targetNode &&
          !edgeList.some(
            (e) =>
              (e.source === company.company_name && e.target === targetNode.id) ||
              (e.target === company.company_name && e.source === targetNode.id)
          )
        ) {
          edgeList.push({
            source: company.company_name,
            target: targetNode.id,
            type: 'competitor',
          });
        }
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [companies]);

  if (nodes.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-violet-500" />
            Industry Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No network data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5 text-violet-500" />
          Industry Network: Partnerships & Competition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg border border-gray-200 overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 500 500">
            {/* Edges */}
            <g className="edges">
              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) {
                  return null;
                }

                return (
                  <line
                    key={idx}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edge.type === 'partnership' ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={edge.type === 'partnership' ? 2 : 1}
                    strokeDasharray={edge.type === 'competitor' ? '4 4' : '0'}
                    opacity={edge.type === 'partnership' ? 0.6 : 0.3}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {nodes.map((node, idx) => (
                <g key={idx} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={Math.min(Math.max(Math.sqrt(node.employees || 1000) / 50, 15), 40)}
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-pointer hover:fill-violet-700 transition-colors"
                  />
                  <text
                    y={-10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#1f2937"
                    className="pointer-events-none select-none"
                  >
                    {node.id.split(' ')[0]}
                  </text>
                  {node.ticker && (
                    <text
                      y={5}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#6b7280"
                      className="pointer-events-none select-none"
                    >
                      {node.ticker}
                    </text>
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 text-xs space-y-2">
            <div className="font-semibold text-gray-900">Legend</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-gray-700">Partnership</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-slate-400 border-dashed border-t border-slate-400"></div>
              <span className="text-gray-700">Competitor</span>
            </div>
            <div className="text-gray-500 mt-2">Node size = Employee count</div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {nodes.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Companies</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {edges.filter((e) => e.type === 'partnership').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Partnerships</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {edges.filter((e) => e.type === 'competitor').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Competitive Links</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
