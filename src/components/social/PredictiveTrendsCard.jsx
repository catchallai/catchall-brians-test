import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Sparkles, Calendar, Target, AlertTriangle, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';

export default function PredictiveTrendsCard({ socialAccounts = [], posts = [] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  const analyzeTrends = async () => {
    setIsAnalyzing(true);
    try {
      const accountSummary = socialAccounts.map((a) => ({
        platform: a.platform,
        followers: a.followers,
        engagement_rate: a.engagement_rate,
        recent_growth: a.follower_growth_rate,
      }));

      const postPerformance = posts.slice(0, 20).map((p) => ({
        platform: p.platform,
        type: p.post_type,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        engagement_rate: p.engagement_rate,
        posted: p.post_date,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media analytics AI. Analyze this social media data and provide predictive insights.

Account Data: ${JSON.stringify(accountSummary)}
Recent Posts: ${JSON.stringify(postPerformance)}
Current Date: ${format(new Date(), 'yyyy-MM-dd')}

Provide predictions for the next 14 days including:
1. Expected engagement trends (daily predictions)
2. Optimal posting times for each platform
3. Content types likely to perform best
4. Emerging topics/hashtags to leverage
5. Risk factors that could impact performance
6. Growth opportunities

Be specific with numbers and actionable recommendations.`,
        response_json_schema: {
          type: 'object',
          properties: {
            engagement_forecast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'number' },
                  predicted_engagement: { type: 'number' },
                  confidence: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            },
            optimal_times: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  best_days: { type: 'array', items: { type: 'string' } },
                  best_hours: { type: 'array', items: { type: 'string' } },
                  reason: { type: 'string' },
                },
              },
            },
            content_predictions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content_type: { type: 'string' },
                  predicted_performance: { type: 'string' },
                  recommendation: { type: 'string' },
                },
              },
            },
            trending_topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  relevance_score: { type: 'number' },
                  peak_window: { type: 'string' },
                  suggested_angle: { type: 'string' },
                },
              },
            },
            risk_factors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  probability: { type: 'string' },
                  mitigation: { type: 'string' },
                },
              },
            },
            growth_opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  opportunity: { type: 'string' },
                  potential_impact: { type: 'string' },
                  action_required: { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
          },
        },
      });

      setPredictions(result);
    } catch (error) {
      console.error('Failed to analyze trends:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData =
    predictions?.engagement_forecast?.map((d) => ({
      date: format(addDays(new Date(), d.day), 'MMM dd'),
      engagement: d.predicted_engagement,
      confidence: d.confidence,
    })) || [];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI Predictive Trend Analysis
          </CardTitle>
          <Button onClick={analyzeTrends} disabled={isAnalyzing} size="sm" className="gap-2">
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Trends'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!predictions ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Click "Analyze Trends" to get AI-powered predictions</p>
            <p className="text-sm mt-1">Based on your account performance and market patterns</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">{predictions.summary}</p>
            </div>

            {/* Engagement Forecast Chart */}
            {chartData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  14-Day Engagement Forecast
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" fontSize={10} stroke="#9ca3af" />
                      <YAxis fontSize={10} stroke="#9ca3af" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Optimal Posting Times */}
            {predictions.optimal_times?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Optimal Posting Times
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {predictions.optimal_times.map((time, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {time.platform}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {time.best_days?.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{time.best_hours?.join(', ')}</p>
                      <p className="text-xs text-violet-600 mt-1">{time.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {predictions.trending_topics?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Emerging Topics to Leverage
                </h4>
                <div className="space-y-2">
                  {predictions.trending_topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{topic.topic}</p>
                        <p className="text-xs text-gray-500 mt-1">{topic.suggested_angle}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {topic.relevance_score}% relevant
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{topic.peak_window}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {predictions.risk_factors?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Risk Factors
                </h4>
                <div className="space-y-2">
                  {predictions.risk_factors.map((risk, idx) => (
                    <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">{risk.risk}</p>
                        <Badge className="bg-amber-100 text-amber-700">{risk.probability}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Mitigation: {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Opportunities */}
            {predictions.growth_opportunities?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Growth Opportunities
                </h4>
                <div className="space-y-2">
                  {predictions.growth_opportunities.map((opp, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white">{opp.opportunity}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-blue-100 text-blue-700">{opp.potential_impact}</Badge>
                        <span className="text-xs text-gray-500">{opp.action_required}</span>
                      </div>
                    </div>
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
