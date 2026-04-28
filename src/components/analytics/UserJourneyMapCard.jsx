import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Route,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Globe,
  Filter,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export default function UserJourneyMapCard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedEntryPoint, setSelectedEntryPoint] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Generate segment-specific journey data
  const segmentData = useMemo(() => {
    const segmentLabel =
      VISITOR_SEGMENTS.find((s) => s.id === selectedSegment)?.label || 'All Visitors';
    const entryLabel =
      ENTRY_POINTS.find((e) => e.id === selectedEntryPoint)?.label || 'All Entry Points';

    // Simulated segment-specific metrics
    const segmentMetrics = {
      all: { conversionRate: 3.2, avgTouchpoints: 5.4, avgTime: '18 days', dropOffRate: 68 },
      new: { conversionRate: 1.8, avgTouchpoints: 7.2, avgTime: '24 days', dropOffRate: 78 },
      returning: { conversionRate: 8.4, avgTouchpoints: 3.1, avgTime: '6 days', dropOffRate: 42 },
      high_intent: {
        conversionRate: 12.6,
        avgTouchpoints: 4.8,
        avgTime: '4 days',
        dropOffRate: 28,
      },
      mobile: { conversionRate: 2.1, avgTouchpoints: 4.2, avgTime: '21 days', dropOffRate: 74 },
    };

    const entryMetrics = {
      all: { bounce: 45, exitRate: 32, avgPages: 4.2 },
      homepage: { bounce: 52, exitRate: 28, avgPages: 5.1 },
      sj30i: { bounce: 28, exitRate: 18, avgPages: 6.8 },
      performance: { bounce: 35, exitRate: 22, avgPages: 5.4 },
      ownership: { bounce: 22, exitRate: 15, avgPages: 7.2 },
      contact: { bounce: 18, exitRate: 45, avgPages: 2.1 },
      social: { bounce: 58, exitRate: 35, avgPages: 3.2 },
      search: { bounce: 42, exitRate: 25, avgPages: 4.8 },
    };

    return {
      segment: segmentMetrics[selectedSegment] || segmentMetrics.all,
      entry: entryMetrics[selectedEntryPoint] || entryMetrics.all,
      segmentLabel,
      entryLabel,
    };
  }, [selectedSegment, selectedEntryPoint]);

  // Visual funnel data based on segment
  const funnelData = useMemo(() => {
    const baseFunnel = [
      { stage: 'Landing', visitors: 10000, color: 'bg-blue-500' },
      { stage: 'Engaged', visitors: 5500, color: 'bg-violet-500' },
      { stage: 'Interested', visitors: 2200, color: 'bg-purple-500' },
      { stage: 'Qualified', visitors: 680, color: 'bg-pink-500' },
      { stage: 'Converted', visitors: 320, color: 'bg-emerald-500' },
    ];

    const multipliers = {
      all: 1,
      new: 0.7,
      returning: 1.4,
      high_intent: 1.8,
      mobile: 0.85,
    };

    const mult = multipliers[selectedSegment] || 1;
    return baseFunnel.map((stage, idx) => ({
      ...stage,
      visitors: Math.round(stage.visitors * mult * (idx === 0 ? 1 : Math.pow(0.95, idx))),
      percentage:
        idx === 0
          ? 100
          : Math.round(((stage.visitors * mult) / (baseFunnel[0].visitors * mult)) * 100),
    }));
  }, [selectedSegment]);

  // Common paths based on entry point
  const commonPaths = useMemo(() => {
    const pathsByEntry = {
      all: [
        { path: ['Homepage', 'SJ30i', 'Performance', 'Contact'], percentage: 24, conversions: 8.2 },
        { path: ['Homepage', 'Gallery', 'Specs', 'Contact'], percentage: 18, conversions: 6.4 },
        { path: ['SJ30i', 'Ownership', 'Contact'], percentage: 15, conversions: 12.1 },
      ],
      homepage: [
        { path: ['Homepage', 'SJ30i', 'Performance', 'Contact'], percentage: 32, conversions: 9.4 },
        { path: ['Homepage', 'About', 'Contact'], percentage: 22, conversions: 4.2 },
        { path: ['Homepage', 'Gallery', 'SJ30i', 'Specs'], percentage: 18, conversions: 7.8 },
      ],
      sj30i: [
        {
          path: ['SJ30i', 'Performance', 'Ownership', 'Contact'],
          percentage: 38,
          conversions: 14.2,
        },
        { path: ['SJ30i', 'Specs', 'Gallery', 'Contact'], percentage: 28, conversions: 11.6 },
        {
          path: ['SJ30i', 'Interior', 'Performance', 'Contact'],
          percentage: 22,
          conversions: 10.8,
        },
      ],
      ownership: [
        { path: ['Ownership', 'Contact'], percentage: 45, conversions: 18.4 },
        { path: ['Ownership', 'SJ30i', 'Contact'], percentage: 32, conversions: 15.2 },
        {
          path: ['Ownership', 'Performance', 'Specs', 'Contact'],
          percentage: 18,
          conversions: 12.8,
        },
      ],
      contact: [
        { path: ['Contact', '(Form Submit)'], percentage: 65, conversions: 42.0 },
        { path: ['Contact', 'Ownership', 'Contact'], percentage: 20, conversions: 28.4 },
        { path: ['Contact', 'SJ30i', 'Contact'], percentage: 12, conversions: 22.0 },
      ],
      social: [
        { path: ['Social', 'Homepage', 'SJ30i', 'Gallery'], percentage: 35, conversions: 4.2 },
        { path: ['Social', 'Blog Post', 'SJ30i'], percentage: 28, conversions: 5.8 },
        { path: ['Social', 'Gallery', 'Performance'], percentage: 22, conversions: 6.4 },
      ],
      search: [
        { path: ['Search', 'SJ30i', 'Specs', 'Contact'], percentage: 32, conversions: 8.8 },
        { path: ['Search', 'Homepage', 'SJ30i', 'Performance'], percentage: 26, conversions: 7.2 },
        { path: ['Search', 'Performance', 'Ownership'], percentage: 18, conversions: 9.4 },
      ],
      performance: [
        { path: ['Performance', 'SJ30i', 'Specs', 'Contact'], percentage: 34, conversions: 11.2 },
        { path: ['Performance', 'Ownership', 'Contact'], percentage: 28, conversions: 13.8 },
        { path: ['Performance', 'Gallery', 'Interior'], percentage: 20, conversions: 6.4 },
      ],
    };
    return pathsByEntry[selectedEntryPoint] || pathsByEntry.all;
  }, [selectedEntryPoint]);

  // Drop-off points based on segment
  const dropOffPoints = useMemo(() => {
    const baseDropOffs = [
      {
        location: 'Homepage → Product Pages',
        rate: 48,
        reason: 'Unclear value proposition',
        fix: 'Add clear CTAs and featured product highlights',
      },
      {
        location: 'Product → Specs',
        rate: 35,
        reason: 'Information overload',
        fix: 'Simplify technical information with visuals',
      },
      {
        location: 'Specs → Contact',
        rate: 28,
        reason: 'Missing pricing context',
        fix: 'Add inquiry prompt with ownership options',
      },
      {
        location: 'Contact Form',
        rate: 22,
        reason: 'Form too long',
        fix: 'Reduce required fields, add progress indicator',
      },
    ];

    if (selectedSegment === 'mobile') {
      return [
        {
          location: 'Mobile Homepage',
          rate: 62,
          reason: 'Slow load time',
          fix: 'Optimize images, enable lazy loading',
        },
        {
          location: 'Gallery (Mobile)',
          rate: 45,
          reason: 'Touch interaction issues',
          fix: 'Improve swipe gestures',
        },
        ...baseDropOffs.slice(2),
      ];
    }
    if (selectedSegment === 'new') {
      return [
        {
          location: 'First Page View',
          rate: 58,
          reason: 'No brand familiarity',
          fix: 'Add trust signals and social proof',
        },
        ...baseDropOffs,
      ];
    }
    return baseDropOffs;
  }, [selectedSegment]);

  const analyzeJourneys = async () => {
    setIsAnalyzing(true);
    const segmentContext =
      selectedSegment !== 'all'
        ? `Focus specifically on ${VISITOR_SEGMENTS.find((s) => s.id === selectedSegment)?.label} behavior patterns.`
        : '';
    const entryContext =
      selectedEntryPoint !== 'all'
        ? `Analyze journeys starting from ${ENTRY_POINTS.find((e) => e.id === selectedEntryPoint)?.label}.`
        : '';

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a user experience and conversion optimization AI. Analyze user journeys across website and social media touchpoints for a business aviation company (SyberJet).

${segmentContext}
${entryContext}

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
          type: 'object',
          properties: {
            personas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  goals: { type: 'array', items: { type: 'string' } },
                  pain_points: { type: 'array', items: { type: 'string' } },
                  preferred_channels: { type: 'array', items: { type: 'string' } },
                  decision_factors: { type: 'array', items: { type: 'string' } },
                  percentage: { type: 'number' },
                },
              },
            },
            journey_stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  touchpoints: { type: 'array', items: { type: 'string' } },
                  user_actions: { type: 'array', items: { type: 'string' } },
                  user_emotions: { type: 'string' },
                  opportunities: { type: 'array', items: { type: 'string' } },
                  conversion_rate: { type: 'number' },
                  avg_time: { type: 'string' },
                },
              },
            },
            conversion_paths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  path: { type: 'array', items: { type: 'string' } },
                  conversion_rate: { type: 'number' },
                  avg_time_to_convert: { type: 'string' },
                  success_factors: { type: 'array', items: { type: 'string' } },
                  volume_percentage: { type: 'number' },
                },
              },
            },
            drop_off_points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                  stage: { type: 'string' },
                  drop_off_rate: { type: 'number' },
                  likely_reasons: { type: 'array', items: { type: 'string' } },
                  recommended_fixes: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string' },
                  potential_recovery: { type: 'number' },
                },
              },
            },
            cross_channel_insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from_channel: { type: 'string' },
                  to_channel: { type: 'string' },
                  transition_rate: { type: 'number' },
                  avg_touchpoints: { type: 'number' },
                  insight: { type: 'string' },
                },
              },
            },
            optimization_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  expected_impact: { type: 'string' },
                  effort_level: { type: 'string' },
                  priority: { type: 'number' },
                  affected_stages: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            summary_metrics: {
              type: 'object',
              properties: {
                overall_conversion_rate: { type: 'number' },
                avg_touchpoints_to_convert: { type: 'number' },
                avg_time_to_convert: { type: 'string' },
                top_performing_channel: { type: 'string' },
                biggest_opportunity: { type: 'string' },
              },
            },
          },
        },
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
      case 'awareness':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'consideration':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
      case 'decision':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'retention':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const currentSegment = VISITOR_SEGMENTS.find((s) => s.id === selectedSegment);

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="w-4 h-4 text-violet-500" />
              AI User Journey Mapping
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1"
              >
                <Filter className="w-3 h-3" />
                Filters
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </Button>
              <Button onClick={analyzeJourneys} disabled={isAnalyzing} size="sm" className="gap-2">
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Map Journeys'}
              </Button>
            </div>
          </div>

          {/* Segment & Entry Point Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Visitor Segment
                </label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISITOR_SEGMENTS.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>
                        <div className="flex items-center gap-2">
                          <seg.icon className="w-3 h-3" />
                          {seg.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Entry Point</label>
                <Select value={selectedEntryPoint} onValueChange={setSelectedEntryPoint}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_POINTS.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedSegment !== 'all' || selectedEntryPoint !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Filtering:</span>
              {selectedSegment !== 'all' && (
                <Badge variant="outline" className="text-xs gap-1">
                  {currentSegment && <currentSegment.icon className="w-3 h-3" />}
                  {currentSegment?.label}
                  <button
                    onClick={() => setSelectedSegment('all')}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedEntryPoint !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {ENTRY_POINTS.find((e) => e.id === selectedEntryPoint)?.label}
                  <button
                    onClick={() => setSelectedEntryPoint('all')}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!journeyData ? (
          <div className="space-y-6">
            {/* Quick Visual Funnel */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                Conversion Funnel
                <Badge variant="outline" className="ml-2 text-xs">
                  {segmentData.segmentLabel}
                </Badge>
              </h4>
              <div className="relative">
                {funnelData.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-2">
                    <div className="w-20 text-xs text-gray-600 dark:text-gray-400 text-right">
                      {stage.stage}
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${stage.color} transition-all duration-500`}
                        style={{ width: `${stage.percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {stage.visitors.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                    {idx < funnelData.length - 1 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-12 text-center">
                              <span className="text-xs text-red-500 font-medium">
                                -
                                {Math.round(
                                  100 - (funnelData[idx + 1].visitors / stage.visitors) * 100
                                )}
                                %
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Drop-off to next stage</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-violet-600">
                  {segmentData.segment.conversionRate}%
                </p>
                <p className="text-xs text-gray-500">Conversion Rate</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">
                  {segmentData.segment.avgTouchpoints}
                </p>
                <p className="text-xs text-gray-500">Avg Touchpoints</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{segmentData.entry.bounce}%</p>
                <p className="text-xs text-gray-500">Bounce Rate</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-600">{segmentData.segment.dropOffRate}%</p>
                <p className="text-xs text-gray-500">Drop-off Rate</p>
              </div>
            </div>

            {/* Common Paths */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Common Paths {selectedEntryPoint !== 'all' && `from ${segmentData.entryLabel}`}
              </h4>
              <div className="space-y-2">
                {commonPaths.map((path, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {path.path.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded font-medium">
                              {step}
                            </span>
                            {sIdx < path.path.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">{path.percentage}% of traffic</span>
                      <span className="text-emerald-600 font-medium">
                        {path.conversions}% converts
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${path.conversions * 5}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop-off Points */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Key Drop-off Points
              </h4>
              <div className="space-y-2">
                {dropOffPoints.map((drop, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600">{drop.rate}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {drop.location}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{drop.reason}</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
                            Fix
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">{drop.fix}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 mb-2">Want deeper AI-powered insights?</p>
              <Button onClick={analyzeJourneys} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Run Full Analysis
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="personas" className="text-xs">
                Personas
              </TabsTrigger>
              <TabsTrigger value="journeys" className="text-xs">
                Journeys
              </TabsTrigger>
              <TabsTrigger value="dropoffs" className="text-xs">
                Drop-offs
              </TabsTrigger>
              <TabsTrigger value="optimize" className="text-xs">
                Optimize
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-violet-600">
                    {journeyData.summary_metrics?.overall_conversion_rate}%
                  </p>
                  <p className="text-xs text-gray-500">Conversion Rate</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {journeyData.summary_metrics?.avg_touchpoints_to_convert}
                  </p>
                  <p className="text-xs text-gray-500">Avg Touchpoints</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {journeyData.summary_metrics?.avg_time_to_convert}
                  </p>
                  <p className="text-xs text-gray-500">Avg Time to Convert</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">
                    {journeyData.summary_metrics?.top_performing_channel}
                  </p>
                  <p className="text-xs text-gray-500">Top Channel</p>
                </div>
              </div>

              {/* Journey Stages Funnel */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Journey Stages
                </h4>
                <div className="space-y-2">
                  {journeyData.journey_stages?.map((stage, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-24 sm:w-32 shrink-0 px-3 py-2 rounded-lg text-center font-medium text-sm ${getStageColor(stage.stage)}`}
                        >
                          {stage.stage}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-end px-3"
                            style={{ width: `${stage.conversion_rate}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {stage.conversion_rate}%
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {stage.avg_time}
                        </span>
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
                    <span className="font-medium text-gray-900 dark:text-white">
                      Top Conversion Path
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700 ml-auto">
                      {journeyData.conversion_paths[0].conversion_rate}% conversion
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {journeyData.conversion_paths[0].path?.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded font-medium">
                          {step}
                        </span>
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
                  <span className="font-medium text-gray-900 dark:text-white">
                    Biggest Opportunity
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {journeyData.summary_metrics?.biggest_opportunity}
                </p>
              </div>
            </TabsContent>

            {/* Personas Tab */}
            <TabsContent value="personas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journeyData.personas?.map((persona, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{persona.name}</h4>
                      <Badge variant="outline">{persona.percentage}% of users</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {persona.description}
                    </p>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Goals</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.goals?.map((goal, gIdx) => (
                            <Badge key={gIdx} className="bg-emerald-100 text-emerald-700 text-xs">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Pain Points</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.pain_points?.map((pain, pIdx) => (
                            <Badge key={pIdx} className="bg-red-100 text-red-700 text-xs">
                              {pain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Preferred Channels</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.preferred_channels?.map((ch, cIdx) => (
                            <Badge key={cIdx} variant="outline" className="text-xs">
                              {ch}
                            </Badge>
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
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Top Conversion Paths
                </h4>
                <div className="space-y-3">
                  {journeyData.conversion_paths?.map((path, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {path.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {path.conversion_rate}%
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {path.volume_percentage}% of traffic
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {path.path?.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded">
                              {step}
                            </span>
                            {sIdx < path.path.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {path.avg_time_to_convert}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Success factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {path.success_factors?.map((f, fIdx) => (
                            <span key={fIdx} className="text-xs text-emerald-600">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Channel Insights */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cross-Channel Journeys
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {journeyData.cross_channel_insights?.map((insight, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{insight.from_channel}</Badge>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <Badge variant="outline">{insight.to_channel}</Badge>
                        <span className="text-sm font-medium text-blue-600 ml-auto">
                          {insight.transition_rate}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{insight.insight}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg {insight.avg_touchpoints} touchpoints
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Drop-offs Tab */}
            <TabsContent value="dropoffs" className="space-y-4">
              <div className="space-y-3">
                {journeyData.drop_off_points?.map((dropoff, idx) => (
                  <div
                    key={idx}
                    className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dropoff.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStageColor(dropoff.stage)}>{dropoff.stage}</Badge>
                        <Badge className={getPriorityColor(dropoff.priority)}>
                          {dropoff.priority}
                        </Badge>
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
                        <p className="text-xs font-medium text-emerald-600 mb-1">
                          Recommended Fixes:
                        </p>
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
                {journeyData.optimization_recommendations
                  ?.sort((a, b) => a.priority - b.priority)
                  .map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-medium">
                            {rec.priority}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {rec.expected_impact}
                          </Badge>
                          <Badge variant="outline">{rec.effort_level} effort</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rec.affected_stages?.map((stage, sIdx) => (
                          <Badge key={sIdx} className={`text-xs ${getStageColor(stage)}`}>
                            {stage}
                          </Badge>
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
