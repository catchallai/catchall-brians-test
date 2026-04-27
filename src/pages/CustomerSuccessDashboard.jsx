import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Users, CheckCircle, Target, TrendingUp, TrendingDown } from 'lucide-react';
import HealthTrendsChart from '@/components/success/HealthTrendsChart';
import OnboardingCompletionChart from '@/components/success/OnboardingCompletionChart';
import OpportunityConversionChart from '@/components/success/OpportunityConversionChart';
import CSMPerformanceCard from '@/components/success/CSMPerformanceCard';
import ChurnRiskAnalytics from '@/components/success/ChurnRiskAnalytics';
import HealthScoreTrends from '@/components/success/HealthScoreTrends';
import FeedbackSentimentAnalysis from '@/components/success/FeedbackSentimentAnalysis';
import CSMTaskManager from '@/components/success/CSMTaskManager';
import AlertCenter from '@/components/success/AlertCenter';
import RenewalTracker from '@/components/success/RenewalTracker';
import RevenueMetrics from '@/components/success/RevenueMetrics';
import CSMWorkloadView from '@/components/success/CSMWorkloadView';
import ExecutiveScorecard from '@/components/success/ExecutiveScorecard';
import ChurnRiskPredictor from '@/components/success/ChurnRiskPredictor';
import BatchOperations from '@/components/success/BatchOperations';
import CustomerSegmentation from '@/components/success/CustomerSegmentation';
import BusinessReviewScheduler from '@/components/success/BusinessReviewScheduler';

export default function CustomerSuccessDashboard() {
  const [csmFilter, setCsmFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const { data: healthScores = [], isLoading: loadingHealth } = useQuery({
    queryKey: ['customer-health'],
    queryFn: () => base44.entities.CustomerHealth.list('-created_date', 200),
  });

  const { data: onboardings = [], isLoading: loadingOnboarding } = useQuery({
    queryKey: ['customer-onboarding'],
    queryFn: () => base44.entities.CustomerOnboarding.list('-created_date', 200),
  });

  const { data: opportunities = [], isLoading: loadingOpps } = useQuery({
    queryKey: ['upsell-opportunities'],
    queryFn: () => base44.entities.UpsellOpportunity.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['satisfaction-surveys'],
    queryFn: () => base44.entities.SatisfactionSurvey.list('-created_date', 200),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['customer-interactions'],
    queryFn: () => base44.entities.CustomerInteraction.list('-created_date', 200),
  });

  // Get unique CSMs and segments
  const csms = useMemo(() => {
    const csmSet = new Set();
    onboardings.forEach((o) => o.csm_assigned && csmSet.add(o.csm_assigned));
    return Array.from(csmSet);
  }, [onboardings]);

  const segments = useMemo(() => {
    const segmentSet = new Set();
    contacts
      .filter((c) => c.status === 'customer')
      .forEach((c) => {
        if (c.company_size) {
          segmentSet.add(c.company_size);
        }
      });
    return Array.from(segmentSet);
  }, [contacts]);

  // Apply filters
  const filteredHealthScores = useMemo(() => {
    return healthScores.filter((h) => {
      const onboarding = onboardings.find((o) => o.contact_id === h.contact_id);
      const contact = contacts.find((c) => c.id === h.contact_id);

      if (csmFilter !== 'all' && onboarding?.csm_assigned !== csmFilter) {
        return false;
      }
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) {
        return false;
      }

      return true;
    });
  }, [healthScores, onboardings, contacts, csmFilter, segmentFilter]);

  const filteredOnboardings = useMemo(() => {
    return onboardings.filter((o) => {
      const contact = contacts.find((c) => c.id === o.contact_id);

      if (csmFilter !== 'all' && o.csm_assigned !== csmFilter) {
        return false;
      }
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) {
        return false;
      }

      return true;
    });
  }, [onboardings, contacts, csmFilter, segmentFilter]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const contact = contacts.find((c) => c.id === opp.contact_id);
      const onboarding = onboardings.find((o) => o.contact_id === opp.contact_id);

      if (csmFilter !== 'all' && onboarding?.csm_assigned !== csmFilter) {
        return false;
      }
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) {
        return false;
      }

      return true;
    });
  }, [opportunities, contacts, onboardings, csmFilter, segmentFilter]);

  // Calculate metrics
  const avgHealth =
    filteredHealthScores.length > 0
      ? Math.round(
          filteredHealthScores.reduce((sum, h) => sum + (h.health_score || 0), 0) /
            filteredHealthScores.length
        )
      : 0;

  const healthyCount = filteredHealthScores.filter((h) => h.health_status === 'healthy').length;
  const atRiskCount = filteredHealthScores.filter((h) => h.health_status === 'at_risk').length;

  const avgOnboardingProgress =
    filteredOnboardings.length > 0
      ? Math.round(
          filteredOnboardings.reduce((sum, o) => sum + (o.progress_percentage || 0), 0) /
            filteredOnboardings.length
        )
      : 0;

  const totalOppValue = filteredOpportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
  const closedWon = filteredOpportunities.filter((o) => o.status === 'closed_won').length;
  const conversionRate =
    filteredOpportunities.length > 0
      ? Math.round((closedWon / filteredOpportunities.length) * 100)
      : 0;

  const isLoading = loadingHealth || loadingOnboarding || loadingOpps;

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            CS Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tasks, alerts, renewals, revenue, and team performance
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={csmFilter} onValueChange={setCsmFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by CSM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All CSMs</SelectItem>
              {csms.map((csm) => (
                <SelectItem key={csm} value={csm}>
                  {csm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {segments.map((seg) => (
                <SelectItem key={seg} value={seg}>
                  {seg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <Heart className="w-4 sm:w-6 h-4 sm:h-6 text-violet-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-violet-600">{avgHealth}</p>
              <p className="text-xs text-gray-500">Avg Health</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <CheckCircle className="w-4 sm:w-6 h-4 sm:h-6 text-emerald-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-emerald-600">{healthyCount}</p>
              <p className="text-xs text-gray-500">Healthy</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingDown className="w-4 sm:w-6 h-4 sm:h-6 text-amber-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-amber-600">{atRiskCount}</p>
              <p className="text-xs text-gray-500">At Risk</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="w-4 sm:w-6 h-4 sm:h-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-blue-600">
                {avgOnboardingProgress}%
              </p>
              <p className="text-xs text-gray-500">Onboarding Avg</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <Target className="w-4 sm:w-6 h-4 sm:h-6 text-violet-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-violet-600">
                ${(totalOppValue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500">Pipeline</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="w-4 sm:w-6 h-4 sm:h-6 text-emerald-500 mx-auto mb-1 sm:mb-2" />
              <p className="text-xl sm:text-3xl font-bold text-emerald-600">{conversionRate}%</p>
              <p className="text-xs text-gray-500">Conv Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Executive Scorecard */}
      <div className="overflow-x-auto">
        <ExecutiveScorecard />
      </div>

      {/* Tasks & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="overflow-hidden">
          <CSMTaskManager csmFilter={csmFilter} />
        </div>
        <div className="overflow-hidden">
          <AlertCenter />
        </div>
      </div>

      {/* Renewals & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="overflow-hidden">
          <RenewalTracker />
        </div>
        <div className="overflow-hidden">
          <RevenueMetrics />
        </div>
      </div>

      {/* Churn Risk & Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChurnRiskPredictor contacts={contacts} />
        <CustomerSegmentation contacts={contacts} healthScores={filteredHealthScores} />
      </div>

      {/* Batch Operations, Calendar, & CSM Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="overflow-hidden">
          <BatchOperations contacts={contacts} />
        </div>
        <div className="overflow-hidden">
          <BusinessReviewScheduler contacts={contacts} />
        </div>
        <div className="overflow-hidden">
          <CSMWorkloadView />
        </div>
      </div>

      {/* Churn Risk Analytics */}
      <ChurnRiskAnalytics
        healthScores={filteredHealthScores}
        onboardings={filteredOnboardings}
        interactions={interactions}
        opportunities={filteredOpportunities}
      />

      {/* Health Score Trends by Segment and CSM */}
      <HealthScoreTrends healthScores={filteredHealthScores} contacts={contacts} />

      {/* Customer Feedback & Sentiment */}
      <FeedbackSentimentAnalysis surveys={surveys} interactions={interactions} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthTrendsChart healthScores={filteredHealthScores} />
        <OnboardingCompletionChart onboardings={filteredOnboardings} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpportunityConversionChart opportunities={filteredOpportunities} />
        <CSMPerformanceCard
          onboardings={filteredOnboardings}
          healthScores={filteredHealthScores}
          opportunities={filteredOpportunities}
        />
      </div>
    </div>
  );
}
