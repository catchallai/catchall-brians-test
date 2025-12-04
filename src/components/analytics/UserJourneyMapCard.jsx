import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Route, Sparkles, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, MousePointer, Eye, Clock, CheckCircle, XCircle, Users, Globe, Filter, ChevronDown, Zap } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Segment definitions
const VISITOR_SEGMENTS = [
  { id: 'all', label: 'All Visitors', icon: Users, color: 'violet' },
  { id: 'new', label: 'New Visitors', icon: Zap, color: 'blue' },
  { id: 'returning', label: 'Returning Visitors', icon: TrendingUp, color: 'emerald' },
  { id: 'high_intent', label: 'High Intent', icon: Target, color: 'red' },
  { id: 'mobile', label: 'Mobile Users', icon: Globe, color: 'amber' },
];

const ENTRY_POINTS = [
  { id: 'all', label: 'All Entry Points' },
  { id: 'homepage', label: 'Homepage (/)', page: '/' },
  { id: 'sj30i', label: 'SJ30i Product Page', page: '/sj30i' },
  { id: 'performance', label: 'Performance Page', page: '/performance' },
  { id: 'ownership', label: 'Ownership Page', page: '/ownership' },
  { id: 'contact', label: 'Contact Page', page: '/contact' },
  { id: 'social', label: 'Social Media Referral' },
  { id: 'search', label: 'Organic Search' },
];

export default function UserJourneyMapCard({ trafficData = [], socialAccounts = [], posts = [] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedEntryPoint, setSelectedEntryPoint] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const analyzeJourneys = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a user experience and conversion optimization AI. Analyze user journeys across website and social media touchpoints for a business aviation company (SyberJet).

Provide comprehensive journey mapping including:

1. USER PERSONAS (3-4 distinct personas):
- Name, description, goals, pain points
- Preferred channels (social, search, direct)
- Decision-making factors

2. JOURNEY STAGES:
- Awareness, Consideration, Decision, Retention
- For each stage: touchpoints, user actions, emotions, opportunities

3. KEY CONVERSION PATHS (top 5):
- Path sequence with touchpoints
- Conversion rate, avg time to convert
- Key success factors

4. DROP-OFF POINTS (top 5):
- Where users abandon, drop-off rate
- Likely reasons, recommended fixes
- Priority level

5. CROSS-CHANNEL JOURNEYS:
- Social to website paths
- Multi-touch attribution insights
- Channel synergies

6. OPTIMIZATION RECOMMENDATIONS (5-7):
- Specific, actionable improvements
- Expected impact, effort level
- Priority ranking

Be specific with realistic percentages and metrics for a luxury aviation website.`,
        response_json_schema: {
          type: "object",
          properties: {
            personas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  goals: { type: "array", items: { type: "string" } },
                  pain_points: { type: "array", items: { type: "string" } },
                  preferred_channels: { type: "array", items: { type: "string" } },
                  decision_factors: { type: "array", items: { type: "string" } },
                  percentage: { type: "number" }
                }
              }
            },
            journey_stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  touchpoints: { type: "array", items: { type: "string" } },
                  user_actions: { type: "array", items: { type: "string" } },
                  user_emotions: { type: "string" },
                  opportunities: { type: "array", items: { type: "string" } },
                  conversion_rate: { type: "number" },
                  avg_time: { type: "string" }
                }
              }
            },
            conversion_paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  path: { type: "array", items: { type: "string" } },
                  conversion_rate: { type: "number" },
                  avg_time_to_convert: { type: "string" },
                  success_factors: { type: "array", items: { type: "string" } },
                  volume_percentage: { type: "number" }
                }
              }
            },
            drop_off_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  stage: { type: "string" },
                  drop_off_rate: { type: "number" },
                  likely_reasons: { type: "array", items: { type: "string" } },
                  recommended_fixes: { type: "array", items: { type: "string" } },
                  priority: { type: "string" },
                  potential_recovery: { type: "number" }
                }
              }
            },
            cross_channel_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from_channel: { type: "string" },
                  to_channel: { type: "string" },
                  transition_rate: { type: "number" },
                  avg_touchpoints: { type: "number" },
                  insight: { type: "string" }
                }
              }
            },
            optimization_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  expected_impact: { type: "string" },
                  effort_level: { type: "string" },
                  priority: { type: "number" },
                  affected_stages: { type: "array", items: { type: "string" } }
                }
              }
            },
            summary_metrics: {
              type: "object",
              properties: {
                overall_conversion_rate: { type: "number" },
                avg_touchpoints_to_convert: { type: "number" },
                avg_time_to_convert: { type: "string" },
                top_performing_channel: { type: "string" },
                biggest_opportunity: { type: "string" }
              }
            }
          }
        }
      });

      setJourneyData(result);
    } catch (error) {
      console.error('Failed to analyze journeys:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'awareness': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'consideration': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
      case 'decision': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'retention': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-4 h-4 text-violet-500" />
            AI User Journey Mapping
          </CardTitle>
          <Button 
            onClick={analyzeJourneys} 
            disabled={isAnalyzing}
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : 'Map Journeys'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!journeyData ? (
          <div className="text-center py-12 text-gray-500">
            <Route className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Discover Your User Journeys</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              AI will analyze touchpoints across your website and social media to map user journeys, identify conversion paths, and find optimization opportunities.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="personas" className="text-xs">Personas</TabsTrigger>
              <TabsTrigger value="journeys" className="text-xs">Journeys</TabsTrigger>
              <TabsTrigger value="dropoffs" className="text-xs">Drop-offs</TabsTrigger>
              <TabsTrigger value="optimize" className="text-xs">Optimize</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-violet-600">{journeyData.summary_metrics?.overall_conversion_rate}%</p>
                  <p className="text-xs text-gray-500">Conversion Rate</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{journeyData.summary_metrics?.avg_touchpoints_to_convert}</p>
                  <p className="text-xs text-gray-500">Avg Touchpoints</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{journeyData.summary_metrics?.avg_time_to_convert}</p>
                  <p className="text-xs text-gray-500">Avg Time to Convert</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">{journeyData.summary_metrics?.top_performing_channel}</p>
                  <p className="text-xs text-gray-500">Top Channel</p>
                </div>
              </div>

              {/* Journey Stages Funnel */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Journey Stages</h4>
                <div className="space-y-2">
                  {journeyData.journey_stages?.map((stage, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex items-center gap-3">
                        <div className={`w-24 sm:w-32 shrink-0 px-3 py-2 rounded-lg text-center font-medium text-sm ${getStageColor(stage.stage)}`}>
                          {stage.stage}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-end px-3"
                            style={{ width: `${stage.conversion_rate}%` }}
                          >
                            <span className="text-xs font-medium text-white">{stage.conversion_rate}%</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{stage.avg_time}</span>
                      </div>
                      {idx < journeyData.journey_stages.length - 1 && (
                        <div className="ml-14 sm:ml-16 my-1 text-gray-300">
                          <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Conversion Path */}
              {journeyData.conversion_paths?.[0] && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Top Conversion Path</span>
                    <Badge className="bg-emerald-100 text-emerald-700 ml-auto">{journeyData.conversion_paths[0].conversion_rate}% conversion</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {journeyData.conversion_paths[0].path?.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded font-medium">{step}</span>
                        {idx < journeyData.conversion_paths[0].path.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Biggest Opportunity */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Biggest Opportunity</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{journeyData.summary_metrics?.biggest_opportunity}</p>
              </div>
            </TabsContent>

            {/* Personas Tab */}
            <TabsContent value="personas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journeyData.personas?.map((persona, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{persona.name}</h4>
                      <Badge variant="outline">{persona.percentage}% of users</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{persona.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Goals</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.goals?.map((goal, gIdx) => (
                            <Badge key={gIdx} className="bg-emerald-100 text-emerald-700 text-xs">{goal}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Pain Points</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.pain_points?.map((pain, pIdx) => (
                            <Badge key={pIdx} className="bg-red-100 text-red-700 text-xs">{pain}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Preferred Channels</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.preferred_channels?.map((ch, cIdx) => (
                            <Badge key={cIdx} variant="outline" className="text-xs">{ch}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Journeys Tab */}
            <TabsContent value="journeys" className="space-y-4">
              {/* Conversion Paths */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Conversion Paths</h4>
                <div className="space-y-3">
                  {journeyData.conversion_paths?.map((path, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{path.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700">{path.conversion_rate}%</Badge>
                          <span className="text-xs text-gray-500">{path.volume_percentage}% of traffic</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {path.path?.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded">{step}</span>
                            {sIdx < path.path.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" />}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {path.avg_time_to_convert}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Success factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {path.success_factors?.map((f, fIdx) => (
                            <span key={fIdx} className="text-xs text-emerald-600">✓ {f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Channel Insights */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cross-Channel Journeys</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {journeyData.cross_channel_insights?.map((insight, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{insight.from_channel}</Badge>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <Badge variant="outline">{insight.to_channel}</Badge>
                        <span className="text-sm font-medium text-blue-600 ml-auto">{insight.transition_rate}%</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{insight.insight}</p>
                      <p className="text-xs text-gray-500 mt-1">Avg {insight.avg_touchpoints} touchpoints</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Drop-offs Tab */}
            <TabsContent value="dropoffs" className="space-y-4">
              <div className="space-y-3">
                {journeyData.drop_off_points?.map((dropoff, idx) => (
                  <div key={idx} className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-900 dark:text-white">{dropoff.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStageColor(dropoff.stage)}>{dropoff.stage}</Badge>
                        <Badge className={getPriorityColor(dropoff.priority)}>{dropoff.priority}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-medium">{dropoff.drop_off_rate}% drop-off</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">{dropoff.potential_recovery}% recoverable</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Likely Reasons:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {dropoff.likely_reasons?.map((reason, rIdx) => (
                            <li key={rIdx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-emerald-600 mb-1">Recommended Fixes:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {dropoff.recommended_fixes?.map((fix, fIdx) => (
                            <li key={fIdx}>✓ {fix}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Optimize Tab */}
            <TabsContent value="optimize" className="space-y-4">
              <div className="space-y-3">
                {journeyData.optimization_recommendations?.sort((a, b) => a.priority - b.priority).map((rec, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-medium">
                          {rec.priority}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{rec.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">{rec.expected_impact}</Badge>
                        <Badge variant="outline">{rec.effort_level} effort</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.affected_stages?.map((stage, sIdx) => (
                        <Badge key={sIdx} className={`text-xs ${getStageColor(stage)}`}>{stage}</Badge>
                      ))}
                    </div>
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