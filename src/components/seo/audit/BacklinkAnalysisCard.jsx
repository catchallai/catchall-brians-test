import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Link2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  ExternalLink, Shield, Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BacklinkAnalysisCard({ data, backlinks = [], competitors = [] }) {
  const analysis = data || {
    totalBacklinks: 1245,
    dofollow: 892,
    nofollow: 353,
    avgDomainAuthority: 42,
    toxicLinks: 23,
    newLinks30d: 87,
    lostLinks30d: 12,
    topAnchorTexts: [
      { text: 'brand name', count: 245 },
      { text: 'seo tools', count: 156 },
      { text: 'click here', count: 89 },
      { text: 'marketing software', count: 67 },
    ],
    linkTypes: [
      { type: 'Editorial', count: 456, quality: 'high' },
      { type: 'Guest Post', count: 234, quality: 'medium' },
      { type: 'Directory', count: 189, quality: 'low' },
      { type: 'Forum', count: 156, quality: 'low' },
      { type: 'Social', count: 210, quality: 'medium' },
    ],
    qualityDistribution: {
      high: 35,
      medium: 40,
      low: 25,
    },
  };

  const competitorGap = [
    { name: 'Your Site', backlinks: analysis.totalBacklinks, avgDA: analysis.avgDomainAuthority, color: '#8b5cf6' },
    { name: 'Competitor A', backlinks: 2340, avgDA: 52, color: '#3b82f6' },
    { name: 'Competitor B', backlinks: 1890, avgDA: 48, color: '#10b981' },
    { name: 'Competitor C', backlinks: 1560, avgDA: 45, color: '#f59e0b' },
  ];

  const opportunities = [
    { domain: 'techcrunch.com', da: 94, competitorLinks: 3, type: 'Editorial' },
    { domain: 'forbes.com', da: 95, competitorLinks: 2, type: 'Guest Post' },
    { domain: 'entrepreneur.com', da: 88, competitorLinks: 4, type: 'Editorial' },
    { domain: 'hubspot.com', da: 92, competitorLinks: 2, type: 'Resource Page' },
  ];

  const qualityColors = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500',
    low: 'bg-red-500',
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Backlink Quality Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(analysis.totalBacklinks / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Backlinks</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analysis.avgDomainAuthority}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg DA</p>
          </div>
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">+{analysis.newLinks30d}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">New (30d)</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analysis.toxicLinks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toxic Links</p>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Link Quality Distribution</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex h-4 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500" 
                style={{ width: `${analysis.qualityDistribution.high}%` }}
              />
              <div 
                className="bg-amber-500" 
                style={{ width: `${analysis.qualityDistribution.medium}%` }}
              />
              <div 
                className="bg-red-500" 
                style={{ width: `${analysis.qualityDistribution.low}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              High ({analysis.qualityDistribution.high}%)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Medium ({analysis.qualityDistribution.medium}%)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Low ({analysis.qualityDistribution.low}%)
            </span>
          </div>
        </div>

        {/* Competitor Gap Analysis */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Competitor Backlink Gap
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorGap} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [value.toLocaleString(), 'Backlinks']}
                />
                <Bar dataKey="backlinks" radius={[0, 4, 4, 0]}>
                  {competitorGap.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Link Building Opportunities */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Link Building Opportunities
          </p>
          <div className="space-y-2">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{opp.domain}</p>
                    <p className="text-xs text-gray-500">{opp.competitorLinks} competitors have links</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">DA {opp.da}</Badge>
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs">
                    {opp.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Anchor Texts */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Anchor Texts</p>
          <div className="flex flex-wrap gap-2">
            {analysis.topAnchorTexts.map((anchor, idx) => (
              <Badge key={idx} variant="outline" className="text-xs dark:border-gray-600">
                {anchor.text} ({anchor.count})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}