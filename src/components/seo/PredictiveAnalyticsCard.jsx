import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Sparkles,
  Target,
  Link2,
  FileText,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PredictiveAnalyticsCard({ websites, keywords, backlinks }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);

    const websitesSummary = websites.map((w) => ({
      name: w.name,
      url: w.url,
      da: w.domain_authority,
      traffic: w.organic_traffic,
      seoScore: w.seo_score,
    }));

    const keywordsSummary = keywords.slice(0, 20).map((k) => ({
      keyword: k.keyword,
      position: k.current_position,
      volume: k.search_volume,
      difficulty: k.difficulty,
    }));

    const backlinksSummary = {
      total: backlinks.length,
      active: backlinks.filter((b) => b.status === 'active').length,
      avgDA:
        backlinks.length > 0
          ? Math.round(
              backlinks.reduce((sum, b) => sum + (b.domain_authority || 0), 0) / backlinks.length
            )
          : 0,
      dofollow: backlinks.filter((b) => b.link_type === 'dofollow').length,
    };

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an SEO expert analyst. Based on the following data, provide predictive analytics and recommendations.

WEBSITES: ${JSON.stringify(websitesSummary)}
KEYWORDS (top 20): ${JSON.stringify(keywordsSummary)}
BACKLINKS SUMMARY: ${JSON.stringify(backlinksSummary)}

Provide:
1. RANKING FORECASTS: For each keyword, predict if it will go up, down, or stay stable in the next 30 days, with reasoning
2. DA IMPACT: Predict how new quality backlinks would impact Domain Authority
3. OPPORTUNITY KEYWORDS: Identify 5 high-potential keywords that are underserved based on difficulty vs volume
4. CONTENT RECOMMENDATIONS: Provide 4 specific actionable content optimization tips
5. LINK BUILDING RECOMMENDATIONS: Provide 4 specific link building strategies

Be specific and data-driven in your predictions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          ranking_forecasts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                current_position: { type: 'number' },
                predicted_direction: { type: 'string' },
                predicted_change: { type: 'number' },
                confidence: { type: 'string' },
                reasoning: { type: 'string' },
              },
            },
          },
          da_impact: {
            type: 'object',
            properties: {
              current_avg_da: { type: 'number' },
              predicted_da_with_10_links: { type: 'number' },
              predicted_da_with_25_links: { type: 'number' },
              key_factors: { type: 'array', items: { type: 'string' } },
            },
          },
          opportunity_keywords: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                estimated_volume: { type: 'number' },
                estimated_difficulty: { type: 'number' },
                opportunity_score: { type: 'number' },
                reasoning: { type: 'string' },
              },
            },
          },
          content_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string' },
                estimated_impact: { type: 'string' },
              },
            },
          },
          link_building_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                description: { type: 'string' },
                difficulty: { type: 'string' },
                potential_links: { type: 'number' },
              },
            },
          },
        },
      },
    });

    setPredictions(analysis);
    setIsAnalyzing(false);
  };

  const getDirectionIcon = (direction) => {
    if (direction === 'up') {
      return <ArrowUp className="w-4 h-4 text-emerald-500" />;
    }
    if (direction === 'down') {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-gray-100 text-gray-700',
    };
    return colors[confidence?.toLowerCase()] || colors.medium;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty?.toLowerCase()] || colors.medium;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Predictive Analytics</CardTitle>
              <p className="text-sm text-gray-500">Forecasts and recommendations powered by AI</p>
            </div>
          </div>
          <Button
            onClick={runPredictiveAnalysis}
            disabled={isAnalyzing}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!predictions ? (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No predictions yet</p>
            <p className="text-sm">Click "Run Analysis" to generate AI-powered forecasts</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="rankings" className="gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Rankings</span>
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="gap-1">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Opportunities</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-1">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Links</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rankings" className="space-y-4">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">30-Day Ranking Forecast</h4>
                <p className="text-sm text-gray-600">
                  AI-predicted changes based on current trends and competition
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {predictions.ranking_forecasts?.map((forecast, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDirectionIcon(forecast.predicted_direction)}
                      <div>
                        <p className="font-medium text-gray-900">{forecast.keyword}</p>
                        <p className="text-xs text-gray-500">{forecast.reasoning}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-medium">
                          #{forecast.current_position} → #
                          {forecast.current_position - (forecast.predicted_change || 0)}
                        </p>
                        <Badge className={`${getConfidenceBadge(forecast.confidence)} text-xs`}>
                          {forecast.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {predictions.da_impact && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    Domain Authority Impact Prediction
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {predictions.da_impact.current_avg_da || '-'}
                      </p>
                      <p className="text-xs text-gray-500">Current Avg DA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        +{predictions.da_impact.predicted_da_with_10_links || 0}
                      </p>
                      <p className="text-xs text-gray-500">With 10 quality links</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        +{predictions.da_impact.predicted_da_with_25_links || 0}
                      </p>
                      <p className="text-xs text-gray-500">With 25 quality links</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  High-Impact Keyword Opportunities
                </h4>
                <p className="text-sm text-gray-600">
                  Underserved keywords with high potential ROI
                </p>
              </div>

              <div className="space-y-3">
                {predictions.opportunity_keywords?.map((opp, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-gray-900">{opp.keyword}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        Score: {opp.opportunity_score}/100
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{opp.reasoning}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">
                        Volume:{' '}
                        <strong className="text-gray-900">
                          {opp.estimated_volume?.toLocaleString()}
                        </strong>
                      </span>
                      <span className="text-gray-500">
                        Difficulty:{' '}
                        <strong className="text-gray-900">{opp.estimated_difficulty}/100</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Content Optimization Recommendations
                </h4>
                <p className="text-sm text-gray-600">
                  AI-powered suggestions to improve your content strategy
                </p>
              </div>

              <div className="space-y-3">
                {predictions.content_recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-gray-900">{rec.title}</span>
                      </div>
                      <Badge className={getPriorityBadge(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-emerald-600 font-medium">
                      Expected Impact: {rec.estimated_impact}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Link Building Strategies</h4>
                <p className="text-sm text-gray-600">
                  Actionable tactics to grow your backlink profile
                </p>
              </div>

              <div className="space-y-3">
                {predictions.link_building_recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">{rec.strategy}</span>
                      </div>
                      <Badge className={getDifficultyBadge(rec.difficulty)}>{rec.difficulty}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      Potential Links: {rec.potential_links}+
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
