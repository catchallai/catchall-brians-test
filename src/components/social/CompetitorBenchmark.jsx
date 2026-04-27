import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  Target,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function CompetitorBenchmark({ competitors, yourAccounts, onAnalyze, isAnalyzing }) {
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    advantages: true,
    disadvantages: true,
    recommendations: true,
  });

  const toggleCompetitor = (compId) => {
    setSelectedCompetitors((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  };

  const handleBenchmark = async () => {
    const selected = competitors.filter((c) => selectedCompetitors.includes(c.id));
    const result = await onAnalyze(selected, yourAccounts);
    setBenchmarkData(result);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Prepare comparison data
  const getComparisonData = () => {
    if (!selectedCompetitors.length) {
      return [];
    }

    return competitors
      .filter((c) => selectedCompetitors.includes(c.id))
      .map((c) => {
        const totalFollowers =
          c.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
        const avgEngagement =
          c.social_accounts?.length > 0
            ? c.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
              c.social_accounts.length
            : 0;

        return {
          name: c.name,
          followers: totalFollowers,
          engagement: parseFloat(avgEngagement.toFixed(2)),
          posts_per_week: c.content_frequency?.posts_per_week || 0,
          content_score: c.industry_benchmark?.content_quality_score || 0,
          brand_strength: c.industry_benchmark?.brand_strength_score || 0,
        };
      });
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      {/* Competitor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Select Competitors to Compare</span>
            <Badge variant="outline">{selectedCompetitors.length} selected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {competitors.map((comp) => {
              const totalFollowers =
                comp.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
              const isSelected = selectedCompetitors.includes(comp.id);

              return (
                <div
                  key={comp.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleCompetitor(comp.id)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{comp.name}</p>
                      <p className="text-xs text-gray-500">
                        {totalFollowers >= 1000
                          ? `${(totalFollowers / 1000).toFixed(1)}K`
                          : totalFollowers}{' '}
                        followers
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            onClick={handleBenchmark}
            disabled={selectedCompetitors.length < 2 || isAnalyzing}
            className="w-full gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Benchmark Analysis
              </>
            )}
          </Button>
          {selectedCompetitors.length < 2 && (
            <p className="text-xs text-amber-600 text-center mt-2">
              Select at least 2 competitors to compare
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Comparison Charts */}
      {comparisonData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Follower Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  Follower Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="followers" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Posting Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Posting Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="posts_per_week" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overall Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart
                    data={[
                      {
                        metric: 'Content',
                        ...comparisonData.reduce(
                          (acc, c) => ({ ...acc, [c.name]: c.content_score }),
                          {}
                        ),
                      },
                      {
                        metric: 'Brand',
                        ...comparisonData.reduce(
                          (acc, c) => ({ ...acc, [c.name]: c.brand_strength }),
                          {}
                        ),
                      },
                      {
                        metric: 'Engagement',
                        ...comparisonData.reduce(
                          (acc, c) => ({ ...acc, [c.name]: c.engagement * 10 }),
                          {}
                        ),
                      },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis />
                    {comparisonData.map((comp, i) => (
                      <Radar
                        key={comp.name}
                        name={comp.name}
                        dataKey={comp.name}
                        stroke={['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'][i % 4]}
                        fill={['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'][i % 4]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* AI Benchmark Analysis */}
      {benchmarkData && (
        <div className="space-y-4">
          {/* Executive Summary */}
          {benchmarkData.executive_summary && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('overview')}>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Competitive Landscape Overview</span>
                  {expandedSections.overview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.overview && (
                <CardContent>
                  <p className="text-sm text-gray-700">{benchmarkData.executive_summary}</p>
                  {benchmarkData.market_position && (
                    <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                      <p className="text-xs font-medium text-violet-700 mb-1">
                        Your Market Position
                      </p>
                      <p className="text-sm text-gray-700">{benchmarkData.market_position}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Competitive Advantages */}
          {benchmarkData.competitive_advantages?.length > 0 && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('advantages')}>
                <CardTitle className="text-sm flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Your Competitive Advantages
                  </span>
                  {expandedSections.advantages ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.advantages && (
                <CardContent>
                  <div className="space-y-3">
                    {benchmarkData.competitive_advantages.map((adv, i) => (
                      <div key={i} className="border-l-4 border-emerald-500 pl-3 py-2">
                        <h4 className="font-medium text-sm text-gray-900">{adv.area}</h4>
                        <p className="text-sm text-gray-600 mt-1">{adv.insight}</p>
                        {adv.data && (
                          <div className="mt-2 flex gap-2">
                            {Object.entries(adv.data).map(([key, val]) => (
                              <Badge
                                key={key}
                                className="bg-emerald-100 text-emerald-700 border-0 text-xs"
                              >
                                {key}: {val}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Competitive Disadvantages */}
          {benchmarkData.competitive_disadvantages?.length > 0 && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('disadvantages')}>
                <CardTitle className="text-sm flex items-center justify-between text-amber-700">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Areas for Improvement
                  </span>
                  {expandedSections.disadvantages ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.disadvantages && (
                <CardContent>
                  <div className="space-y-3">
                    {benchmarkData.competitive_disadvantages.map((dis, i) => (
                      <div key={i} className="border-l-4 border-amber-500 pl-3 py-2">
                        <h4 className="font-medium text-sm text-gray-900">{dis.area}</h4>
                        <p className="text-sm text-gray-600 mt-1">{dis.insight}</p>
                        {dis.gap && <p className="text-xs text-amber-700 mt-1">Gap: {dis.gap}</p>}
                        {dis.leader && (
                          <p className="text-xs text-gray-500 mt-1">Leader: {dis.leader}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Strategic Recommendations */}
          {benchmarkData.strategic_recommendations?.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection('recommendations')}
              >
                <CardTitle className="text-sm flex items-center justify-between text-violet-700">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Strategic Recommendations
                  </span>
                  {expandedSections.recommendations ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.recommendations && (
                <CardContent>
                  <div className="space-y-3">
                    {benchmarkData.strategic_recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-violet-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">{rec.title}</h4>
                          <Badge
                            className={`text-xs ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                            } border-0`}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                        {rec.expected_impact && (
                          <p className="text-xs text-violet-700 mt-2">
                            Expected impact: {rec.expected_impact}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {!benchmarkData && selectedCompetitors.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select competitors to start benchmarking</p>
          <p className="text-sm text-gray-400">
            Compare performance across key metrics and get AI-powered insights
          </p>
        </Card>
      )}
    </div>
  );
}
