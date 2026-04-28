import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Target, Plus, Sparkles, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SERPGapAnalyzer({ onAddKeyword }) {
  const [yourDomain, setYourDomain] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [findingCompetitors, setFindingCompetitors] = useState(false);
  const [suggestedCompetitors, setSuggestedCompetitors] = useState(null);

  const updateCompetitor = (idx, value) => {
    const newComps = [...competitors];
    newComps[idx] = value;
    setCompetitors(newComps);
  };

  const findCompetitors = async () => {
    if (!yourDomain) {
      return;
    }
    setFindingCompetitors(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify the top competitors for the website: ${yourDomain}
      
      Analyze the domain and determine:
      1. What industry/niche is this website in
      2. What products/services do they offer
      3. Who are their direct competitors (same industry, similar size)
      4. Who are their aspirational competitors (larger players in the space)
      
      Provide 6-8 competitor suggestions with reasoning for each.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          industry: { type: 'string' },
          niche: { type: 'string' },
          competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                domain: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                reason: { type: 'string' },
                estimated_traffic: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setSuggestedCompetitors(result);
    setFindingCompetitors(false);
  };

  const selectCompetitor = (domain) => {
    const emptyIdx = competitors.findIndex((c) => !c);
    if (emptyIdx !== -1) {
      updateCompetitor(emptyIdx, domain);
    }
  };

  const runAnalysis = async () => {
    if (!yourDomain || !competitors.some((c) => c)) {
      return;
    }

    setAnalyzing(true);

    const activeCompetitors = competitors.filter((c) => c);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive SERP gap analysis between:
      
      Your domain: ${yourDomain}
      Competitors: ${activeCompetitors.join(', ')}
      
      Analyze and identify:
      
      1. KEYWORD GAPS:
         - Keywords competitors rank for that your domain doesn't
         - Estimated search volume for each
         - Difficulty to rank
         - Which competitor ranks for it
         - Their current position
      
      2. CONTENT GAPS:
         - Topics competitors cover that you don't
         - Content types they use (guides, comparisons, tools, etc.)
         - Estimated traffic potential
      
      3. RANKING OPPORTUNITIES:
         - Keywords where you rank but could improve
         - Keywords where you rank higher than competitors
         - Quick win keywords (low difficulty, decent volume)
      
      4. COMPETITOR INSIGHTS:
         - Each competitor's strongest keywords
         - Their content strategy patterns
         - Estimated organic traffic
      
      5. STRATEGIC RECOMMENDATIONS:
         - Priority keywords to target
         - Content to create
         - Pages to optimize
      
      Provide actionable data with specific numbers.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              total_gap_keywords: { type: 'number' },
              potential_traffic: { type: 'number' },
              quick_wins: { type: 'number' },
              content_gaps: { type: 'number' },
            },
          },
          keyword_gaps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                search_volume: { type: 'number' },
                difficulty: { type: 'number' },
                competitor: { type: 'string' },
                competitor_position: { type: 'number' },
                opportunity_score: { type: 'number' },
                intent: { type: 'string' },
              },
            },
          },
          content_gaps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                content_type: { type: 'string' },
                competitor: { type: 'string' },
                traffic_potential: { type: 'number' },
                priority: { type: 'string' },
              },
            },
          },
          ranking_opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                your_position: { type: 'number' },
                best_competitor_position: { type: 'number' },
                search_volume: { type: 'number' },
                action: { type: 'string' },
              },
            },
          },
          quick_wins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                search_volume: { type: 'number' },
                difficulty: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
          competitor_analysis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                domain: { type: 'string' },
                estimated_traffic: { type: 'number' },
                top_keywords: { type: 'array', items: { type: 'string' } },
                content_strength: { type: 'string' },
                weakness: { type: 'string' },
              },
            },
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                priority: { type: 'string' },
                action: { type: 'string' },
                expected_impact: { type: 'string' },
                effort: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setResults(result);
    setAnalyzing(false);
  };

  const formatNumber = (num) => {
    if (!num) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const getDifficultyColor = (diff) => {
    if (diff <= 30) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (diff <= 60) {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          SERP Gap Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Your Domain</label>
            <Input
              value={yourDomain}
              onChange={(e) => setYourDomain(e.target.value)}
              placeholder="yourdomain.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Competitors (up to 3)</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={findCompetitors}
                disabled={!yourDomain || findingCompetitors}
                className="text-violet-600 hover:text-violet-700 gap-1 h-7"
              >
                {findingCompetitors ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                Find Competitors
              </Button>
            </div>
            <div className="space-y-2">
              {competitors.map((comp, idx) => (
                <Input
                  key={idx}
                  value={comp}
                  onChange={(e) => updateCompetitor(idx, e.target.value)}
                  placeholder={`competitor${idx + 1}.com`}
                />
              ))}
            </div>
          </div>

          {/* Suggested Competitors */}
          {suggestedCompetitors && (
            <div className="p-4 bg-violet-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-violet-900">Suggested Competitors</p>
                  <p className="text-xs text-violet-600">
                    {suggestedCompetitors.industry} • {suggestedCompetitors.niche}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuggestedCompetitors(null)}
                  className="h-6 text-xs"
                >
                  Dismiss
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedCompetitors.competitors?.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-violet-200 hover:border-violet-400 cursor-pointer transition-colors"
                    onClick={() => selectCompetitor(comp.domain)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{comp.domain}</p>
                      <p className="text-xs text-gray-500 truncate">{comp.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" className="text-xs">
                        {comp.type}
                      </Badge>
                      <Plus className="w-4 h-4 text-violet-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={runAnalysis}
            disabled={analyzing || !yourDomain || !competitors.some((c) => c)}
            className="w-full gap-2"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {analyzing ? 'Analyzing SERP Gaps...' : 'Analyze Gaps'}
          </Button>
        </div>

        {analyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500 mb-3" />
            <p className="text-gray-600">Analyzing search results and competitor rankings...</p>
            <p className="text-sm text-gray-400">This may take a moment</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-violet-50 rounded-lg">
                <p className="text-2xl font-bold text-violet-600">
                  {results.summary?.total_gap_keywords || 0}
                </p>
                <p className="text-xs text-gray-500">Keyword Gaps</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {results.summary?.quick_wins || 0}
                </p>
                <p className="text-xs text-gray-500">Quick Wins</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(results.summary?.potential_traffic)}
                </p>
                <p className="text-xs text-gray-500">Traffic Potential</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {results.summary?.content_gaps || 0}
                </p>
                <p className="text-xs text-gray-500">Content Gaps</p>
              </div>
            </div>

            <Tabs defaultValue="gaps" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="gaps">Keyword Gaps</TabsTrigger>
                <TabsTrigger value="quickwins">Quick Wins</TabsTrigger>
                <TabsTrigger value="content">Content Gaps</TabsTrigger>
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="gaps" className="space-y-2">
                {results.keyword_gaps?.slice(0, 15).map((gap, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{gap.keyword}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Vol: {formatNumber(gap.search_volume)}</span>
                        <Badge className={getDifficultyColor(gap.difficulty)}>
                          KD: {gap.difficulty}
                        </Badge>
                        <span>
                          {gap.competitor} #{gap.competitor_position}
                        </span>
                        <Badge variant="outline">{gap.intent}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-violet-600">
                          {gap.opportunity_score}/100
                        </p>
                        <p className="text-xs text-gray-400">Opportunity</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onAddKeyword?.({
                            keyword: gap.keyword,
                            search_volume: gap.search_volume,
                            difficulty: gap.difficulty,
                          })
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="quickwins" className="space-y-2">
                {results.quick_wins?.map((win, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <p className="font-medium text-gray-900">{win.keyword}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{win.reason}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Vol: {formatNumber(win.search_volume)}</span>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          KD: {win.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        onAddKeyword?.({
                          keyword: win.keyword,
                          search_volume: win.search_volume,
                          difficulty: win.difficulty,
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Track
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="content" className="space-y-2">
                {results.content_gaps?.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{gap.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{gap.content_type}</Badge>
                          <span className="text-xs text-gray-500">by {gap.competitor}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            gap.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : gap.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {gap.priority}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(gap.traffic_potential)} potential traffic
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="competitors" className="space-y-3">
                {results.competitor_analysis?.map((comp, idx) => (
                  <div key={idx} className="p-4 bg-white border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{comp.domain}</p>
                        <p className="text-sm text-gray-500">
                          {formatNumber(comp.estimated_traffic)} monthly organic traffic
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Top Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {comp.top_keywords?.slice(0, 4).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Content Strength</p>
                        <p className="text-gray-900">{comp.content_strength}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                      <span className="font-medium text-amber-700">Weakness: </span>
                      <span className="text-amber-600">{comp.weakness}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="actions" className="space-y-2">
                {results.recommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : rec.priority === 'medium'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rec.action}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="text-gray-500">
                          Impact: <span className="text-gray-900">{rec.expected_impact}</span>
                        </span>
                        <span className="text-gray-500">
                          Effort: <span className="text-gray-900">{rec.effort}</span>
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : rec.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
