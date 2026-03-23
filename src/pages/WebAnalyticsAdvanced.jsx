import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

import HeatmapViewer from '@/components/web/HeatmapViewer';
import ConversionFunnelChart from '@/components/web/ConversionFunnelChart';
import PerformanceMonitor from '@/components/web/PerformanceMonitor';
import UserJourneyFlow from '@/components/web/UserJourneyFlow';
import CohortRetention from '@/components/web/CohortRetention';
import PredictiveInsights from '@/components/web/PredictiveInsights';

export default function WebAnalyticsAdvanced() {
  const [selectedPage, setSelectedPage] = useState(null);
  const queryClient = useQueryClient();

  const { data: heatmaps = [] } = useQuery({
    queryKey: ['heatmaps', selectedPage],
    queryFn: () => (selectedPage ? base44.entities.Heatmap.filter({ page_url: selectedPage }) : []),
    enabled: !!selectedPage,
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ['conversion-funnels'],
    queryFn: () => base44.entities.ConversionFunnel.list('-date', 20),
  });

  const { data: performances = [] } = useQuery({
    queryKey: ['page-performance', selectedPage],
    queryFn: () =>
      selectedPage
        ? base44.entities.PagePerformance.filter({ page_url: selectedPage }, '-timestamp', 50)
        : base44.entities.PagePerformance.list('-timestamp', 50),
  });

  const { data: journeys = [] } = useQuery({
    queryKey: ['user-journeys'],
    queryFn: () => base44.entities.UserJourney.list('-created_date', 100),
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['user-cohorts'],
    queryFn: () => base44.entities.UserCohort.list('-acquisition_period', 20),
  });

  const { data: predictiveScores = [] } = useQuery({
    queryKey: ['predictive-scores'],
    queryFn: () => base44.entities.PredictiveScore.list('-calculated_at', 50),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['visitor-sessions'],
    queryFn: () => base44.entities.VisitorSession.list('-created_date', 10),
  });

  const analyzeFunnelMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('analyzeFunnelData', {
        funnel_name: 'Main Conversion Funnel',
        steps: [
          { step_name: 'Landing Page', page_url: '/', order: 1 },
          { step_name: 'Product Page', page_url: '/products', order: 2 },
          { step_name: 'Checkout', page_url: '/checkout', order: 3 },
          { step_name: 'Complete', page_url: '/success', order: 4 },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-funnels'] });
    },
  });

  const analyzePerformanceMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('analyzePagePerformance', {
        page_url: selectedPage || '/',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-performance'] });
    },
  });

  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const recentSession = sessions[0];
      if (!recentSession) {
        return;
      }

      await base44.functions.invoke('generatePredictiveScores', {
        visitor_session_id: recentSession.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive-scores'] });
    },
  });

  const generateCohortMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('generateCohortAnalysis', {
        period: '2026-01',
        acquisition_source: 'google',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cohorts'] });
    },
  });

  const totalSessions = journeys.length;
  const avgConversionRate =
    funnels.length > 0
      ? funnels.reduce((sum, f) => sum + (f.conversion_rate || 0), 0) / funnels.length
      : 0;
  const avgPerformanceScore =
    performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.performance_score || 0), 0) / performances.length
      : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Web Analytics</h1>
        <p className="text-gray-500 mt-1">
          Deep insights into user behavior, performance, and conversions
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-3xl font-bold text-violet-600">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Avg Conversion Rate</p>
            <p className="text-3xl font-bold text-emerald-600">{avgConversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Performance Score</p>
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(avgPerformanceScore)}/100
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active Cohorts</p>
            <p className="text-3xl font-bold text-amber-600">{cohorts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="journeys">Journeys</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Conversion Funnels */}
        <TabsContent value="funnels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Conversion Funnels</h3>
            <Button
              onClick={() => analyzeFunnelMutation.mutate()}
              disabled={analyzeFunnelMutation.isPending}
              className="gap-2"
            >
              {analyzeFunnelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Analyze Funnel
                </>
              )}
            </Button>
          </div>

          {funnels.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {funnels.slice(0, 4).map((funnel) => (
                <ConversionFunnelChart key={funnel.id} funnel={funnel} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center text-gray-500">
                No funnel data yet. Click "Analyze Funnel" to get started.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Heatmaps */}
        <TabsContent value="heatmaps" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedPage === '/' ? 'default' : 'outline'}
              onClick={() => setSelectedPage('/')}
            >
              Home
            </Button>
            <Button
              variant={selectedPage === '/products' ? 'default' : 'outline'}
              onClick={() => setSelectedPage('/products')}
            >
              Products
            </Button>
            <Button
              variant={selectedPage === '/checkout' ? 'default' : 'outline'}
              onClick={() => setSelectedPage('/checkout')}
            >
              Checkout
            </Button>
          </div>

          <HeatmapViewer pageUrl={selectedPage || '/'} heatmaps={heatmaps} />
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Page Performance</h3>
            <Button
              onClick={() => analyzePerformanceMutation.mutate()}
              disabled={analyzePerformanceMutation.isPending}
              className="gap-2"
            >
              {analyzePerformanceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Run Test
                </>
              )}
            </Button>
          </div>

          <PerformanceMonitor performances={performances} />
        </TabsContent>

        {/* User Journeys */}
        <TabsContent value="journeys">
          <UserJourneyFlow journeys={journeys} />
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohorts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cohort Retention Analysis</h3>
            <Button
              onClick={() => generateCohortMutation.mutate()}
              disabled={generateCohortMutation.isPending}
              className="gap-2"
            >
              {generateCohortMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Generate Cohort
                </>
              )}
            </Button>
          </div>

          <CohortRetention cohorts={cohorts} />
        </TabsContent>

        {/* Predictive Analytics */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Predictive Insights</h3>
            <Button
              onClick={() => generatePredictionsMutation.mutate()}
              disabled={generatePredictionsMutation.isPending || !sessions.length}
              className="gap-2"
            >
              {generatePredictionsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Generate Predictions
                </>
              )}
            </Button>
          </div>

          <PredictiveInsights scores={predictiveScores} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
