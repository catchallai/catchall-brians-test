import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Target,
  TrendingUp,
  TrendingDown,
  Eye,
  Swords,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function CompetitorForecastCard({ competitors = [], yourAccounts = [] }) {
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecast, setForecast] = useState(null);

  const generateForecast = async () => {
    setIsForecasting(true);
    try {
      const competitorData = competitors.map((c) => ({
        name: c.name,
        social_accounts: c.social_accounts,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        content_strategy: c.content_strategy,
        successful_campaigns: c.successful_campaigns,
        predicted_campaigns: c.predicted_campaigns,
      }));

      const yourData = yourAccounts.map((a) => ({
        platform: a.platform,
        followers: a.followers,
        engagement_rate: a.engagement_rate,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a competitive intelligence AI specializing in social media strategy. Analyze competitor data and forecast their likely campaign strategies.

Your Brand Accounts: ${JSON.stringify(yourData)}
Competitor Data: ${JSON.stringify(competitorData)}

Provide detailed forecasts including:
1. Predicted competitor campaigns for next 30 days
2. Expected competitor growth rates
3. Content strategies they're likely to deploy
4. Threats to your market position
5. Counter-strategies you should implement
6. Windows of opportunity when competitors are weak

Be specific with timing, tactics, and actionable counter-moves.`,
        response_json_schema: {
          type: 'object',
          properties: {
            competitor_forecasts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  competitor_name: { type: 'string' },
                  predicted_growth: { type: 'number' },
                  likely_campaigns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        campaign_type: { type: 'string' },
                        expected_timing: { type: 'string' },
                        predicted_impact: { type: 'string' },
                        confidence: { type: 'number' },
                      },
                    },
                  },
                  content_focus: { type: 'array', items: { type: 'string' } },
                  vulnerability_windows: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            threat_assessment: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  threat: { type: 'string' },
                  source: { type: 'string' },
                  severity: { type: 'string' },
                  timeline: { type: 'string' },
                  counter_strategy: { type: 'string' },
                },
              },
            },
            opportunity_windows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  window: { type: 'string' },
                  timing: { type: 'string' },
                  recommended_action: { type: 'string' },
                  expected_gain: { type: 'string' },
                },
              },
            },
            recommended_counter_strategies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  strategy: { type: 'string' },
                  target_competitor: { type: 'string' },
                  implementation: { type: 'string' },
                  expected_outcome: { type: 'string' },
                },
              },
            },
            market_share_projection: {
              type: 'object',
              properties: {
                your_projected_share: { type: 'number' },
                change_from_current: { type: 'number' },
                competitor_shares: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      projected_share: { type: 'number' },
                    },
                  },
                },
              },
            },
            executive_summary: { type: 'string' },
          },
        },
      });

      setForecast(result);
    } catch (error) {
      console.error('Failed to generate forecast:', error);
    } finally {
      setIsForecasting(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const marketShareData =
    forecast?.market_share_projection?.competitor_shares?.map((c) => ({
      name: c.name,
      share: c.projected_share,
    })) || [];

  if (forecast?.market_share_projection?.your_projected_share) {
    marketShareData.unshift({
      name: 'Your Brand',
      share: forecast.market_share_projection.your_projected_share,
    });
  }

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Competitor Campaign Forecasting
          </CardTitle>
          <Button
            onClick={generateForecast}
            disabled={isForecasting || competitors.length === 0}
            size="sm"
            className="gap-2"
          >
            {isForecasting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isForecasting ? 'Forecasting...' : 'Generate Forecast'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!forecast ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Generate AI-powered competitor forecasts</p>
            <p className="text-sm mt-1">Predict their next moves and plan counter-strategies</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {forecast.executive_summary}
              </p>
            </div>

            {/* Market Share Projection */}
            {marketShareData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  30-Day Market Share Projection
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketShareData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 100]} fontSize={10} />
                      <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="share" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {forecast.market_share_projection?.change_from_current && (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <span className="text-sm text-gray-500">Your projected change:</span>
                    <Badge
                      className={
                        forecast.market_share_projection.change_from_current >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {forecast.market_share_projection.change_from_current >= 0 ? '+' : ''}
                      {forecast.market_share_projection.change_from_current}%
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Competitor Campaigns */}
            {forecast.competitor_forecasts?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  Predicted Competitor Campaigns
                </h4>
                <div className="space-y-3">
                  {forecast.competitor_forecasts.map((comp, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 dark:border-gray-700 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comp.competitor_name}
                        </span>
                        <Badge
                          className={
                            comp.predicted_growth >= 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {comp.predicted_growth >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {comp.predicted_growth}% growth
                        </Badge>
                      </div>
                      {comp.likely_campaigns?.map((campaign, cIdx) => (
                        <div key={cIdx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {campaign.campaign_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {campaign.expected_timing}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{campaign.predicted_impact}</p>
                          <Badge className="mt-2 text-xs" variant="outline">
                            {campaign.confidence}% confidence
                          </Badge>
                        </div>
                      ))}
                      {comp.vulnerability_windows?.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-amber-600">
                            ⚡ Vulnerability windows: {comp.vulnerability_windows.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threat Assessment */}
            {forecast.threat_assessment?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  Threat Assessment
                </h4>
                <div className="space-y-2">
                  {forecast.threat_assessment.map((threat, idx) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {threat.threat}
                        </span>
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        From: {threat.source} • Timeline: {threat.timeline}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Counter: {threat.counter_strategy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Counter Strategies */}
            {forecast.recommended_counter_strategies?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Recommended Counter-Strategies
                </h4>
                <div className="space-y-2">
                  {forecast.recommended_counter_strategies.map((strategy, idx) => (
                    <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {strategy.strategy}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Target: {strategy.target_competitor}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {strategy.implementation}
                      </p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">
                        {strategy.expected_outcome}
                      </Badge>
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
