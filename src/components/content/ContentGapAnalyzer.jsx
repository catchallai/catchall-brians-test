import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Loader2,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart2,
} from 'lucide-react';

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function ContentGapAnalyzer({ websites, keywords, competitors, onSelectTopic }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [industry, setIndustry] = useState('');

  const analyzeContentGaps = async () => {
    setIsAnalyzing(true);

    const keywordList = keywords
      .slice(0, 20)
      .map((k) => k.keyword)
      .join(', ');
    const competitorList = competitors
      .slice(0, 5)
      .map((c) => c.name)
      .join(', ');
    const websiteInfo = websites[0]?.name || 'the business';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive content gap analysis for ${websiteInfo}.
      ${industry ? `Industry: ${industry}` : ''}
      Current target keywords: ${keywordList || 'general business topics'}
      Competitors: ${competitorList || 'industry competitors'}
      
      Analyze and identify:
      
      1. CONTENT GAPS (8-10 gaps):
         For each gap provide:
         - Topic/keyword opportunity
         - Gap type (missing topic, thin content, outdated, competitor advantage)
         - Priority (high/medium/low)
         - Search intent (informational, transactional, navigational)
         - Estimated monthly search volume
         - Difficulty score (0-100)
         - Why this is a gap
         - Recommended content type (blog, guide, landing page, video)
         - Quick win potential (true/false)
      
      2. COMPETITOR CONTENT ADVANTAGES:
         - What topics competitors cover that we don't
         - Their top-performing content themes
         - Content formats they use effectively
      
      3. QUICK WINS:
         - Low-difficulty, high-opportunity topics
         - Content that can be created quickly
         - Topics with less competition
      
      4. STRATEGIC RECOMMENDATIONS:
         - Content clusters to build
         - Priority order for content creation
         - Estimated traffic potential`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          content_gaps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                gap_type: { type: 'string' },
                priority: { type: 'string' },
                search_intent: { type: 'string' },
                search_volume: { type: 'number' },
                difficulty: { type: 'number' },
                reason: { type: 'string' },
                content_type: { type: 'string' },
                quick_win: { type: 'boolean' },
              },
            },
          },
          competitor_advantages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                competitor: { type: 'string' },
                content_format: { type: 'string' },
                why_effective: { type: 'string' },
              },
            },
          },
          quick_wins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                effort: { type: 'string' },
                potential_traffic: { type: 'number' },
                content_type: { type: 'string' },
              },
            },
          },
          recommendations: {
            type: 'object',
            properties: {
              content_clusters: { type: 'array', items: { type: 'string' } },
              priority_order: { type: 'array', items: { type: 'string' } },
              total_traffic_potential: { type: 'number' },
            },
          },
        },
      },
    });

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const formatVolume = (vol) => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}K`;
    }
    return vol;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-violet-500" />
          Content Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Enter your industry (e.g., SaaS, E-commerce, Healthcare)"
            className="flex-1"
          />
          <Button
            onClick={analyzeContentGaps}
            disabled={isAnalyzing}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze Gaps
          </Button>
        </div>

        {isAnalyzing && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Analyzing content gaps...</p>
                <p className="text-sm text-violet-600">
                  Comparing with competitors and identifying opportunities
                </p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-violet-600">
                  {analysis.content_gaps?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Content Gaps</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {analysis.quick_wins?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Quick Wins</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {formatVolume(analysis.recommendations?.total_traffic_potential || 0)}
                </p>
                <p className="text-sm text-gray-600">Traffic Potential</p>
              </div>
            </div>

            {/* Content Gaps */}
            {analysis.content_gaps?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  Identified Content Gaps
                </h4>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {analysis.content_gaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onSelectTopic?.(gap)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{gap.topic}</span>
                              <Badge className={priorityColors[gap.priority]}>{gap.priority}</Badge>
                              {gap.quick_win && (
                                <Badge className="bg-emerald-100 text-emerald-700">Quick Win</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <BarChart2 className="w-3 h-3" />
                                {formatVolume(gap.search_volume)}/mo
                              </span>
                              <span>Difficulty: {gap.difficulty}</span>
                              <Badge variant="outline" className="text-xs">
                                {gap.content_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {gap.search_intent}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{gap.reason}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Quick Wins */}
            {analysis.quick_wins?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Quick Wins
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.quick_wins.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() =>
                        onSelectTopic?.({ topic: win.topic, content_type: win.content_type })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{win.topic}</span>
                        <Badge className="bg-emerald-100 text-emerald-700">{win.effort}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>{formatVolume(win.potential_traffic)} potential visits</span>
                        <span>{win.content_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Clusters */}
            {analysis.recommendations?.content_clusters?.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Recommended Content Clusters</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendations.content_clusters.map((cluster, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-700">
                      {cluster}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
