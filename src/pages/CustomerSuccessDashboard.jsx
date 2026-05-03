import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Users,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Bell,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
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

function KPICard({ icon: Icon, value, label, sub, color, trend, trendLabel }) {
  const trendPositive = trend === 'up';
  const trendNeutral = trend === undefined || trend === null;
  return (
    <Card className="glass-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${color.bg}`}>
            <Icon className={`w-5 h-5 ${color.icon}`} />
          </div>
          {!trendNeutral && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trendPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendLabel}
            </span>
          )}
        </div>
        <p className={`text-2xl sm:text-3xl font-bold ${color.value}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, color = 'text-gray-700 dark:text-gray-200', description }) {
  return (
    <div className="flex items-center gap-3 pb-1 border-b border-gray-100 dark:border-gray-800">
      <div className={`p-1.5 rounded-md bg-gray-100 dark:bg-gray-800`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h2 className={`text-base font-semibold ${color}`}>{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

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

  const { data: alerts = [] } = useQuery({
    queryKey: ['customer-alerts'],
    queryFn: () => base44.entities.CustomerAlert.filter({ is_active: true }, '-created_date', 50),
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
        if (c.company_size) segmentSet.add(c.company_size);
      });
    return Array.from(segmentSet);
  }, [contacts]);

  // Apply filters
  const filteredHealthScores = useMemo(() => {
    return healthScores.filter((h) => {
      const onboarding = onboardings.find((o) => o.contact_id === h.contact_id);
      const contact = contacts.find((c) => c.id === h.contact_id);
      if (csmFilter !== 'all' && onboarding?.csm_assigned !== csmFilter) return false;
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) return false;
      return true;
    });
  }, [healthScores, onboardings, contacts, csmFilter, segmentFilter]);

  const filteredOnboardings = useMemo(() => {
    return onboardings.filter((o) => {
      const contact = contacts.find((c) => c.id === o.contact_id);
      if (csmFilter !== 'all' && o.csm_assigned !== csmFilter) return false;
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) return false;
      return true;
    });
  }, [onboardings, contacts, csmFilter, segmentFilter]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const contact = contacts.find((c) => c.id === opp.contact_id);
      const onboarding = onboardings.find((o) => o.contact_id === opp.contact_id);
      if (csmFilter !== 'all' && onboarding?.csm_assigned !== csmFilter) return false;
      if (segmentFilter !== 'all' && contact?.company_size !== segmentFilter) return false;
      return true;
    });
  }, [opportunities, contacts, onboardings, csmFilter, segmentFilter]);

  // Metrics
  const customers = contacts.filter((c) => c.status === 'customer');
  const avgHealth =
    filteredHealthScores.length > 0
      ? Math.round(filteredHealthScores.reduce((s, h) => s + (h.health_score || 0), 0) / filteredHealthScores.length)
      : 0;
  const healthyCount = filteredHealthScores.filter((h) => h.health_status === 'healthy').length;
  const atRiskCount = filteredHealthScores.filter((h) => h.health_status === 'at_risk').length;
  const criticalCount = filteredHealthScores.filter((h) => h.health_status === 'critical').length;
  const avgOnboardingProgress =
    filteredOnboardings.length > 0
      ? Math.round(filteredOnboardings.reduce((s, o) => s + (o.progress_percentage || 0), 0) / filteredOnboardings.length)
      : 0;
  const totalOppValue = filteredOpportunities.reduce((s, o) => s + (o.estimated_value || 0), 0);
  const closedWon = filteredOpportunities.filter((o) => o.status === 'closed_won').length;
  const conversionRate =
    filteredOpportunities.length > 0
      ? Math.round((closedWon / filteredOpportunities.length) * 100)
      : 0;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  const isLoading = loadingHealth || loadingOnboarding || loadingOpps;

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Customer Success Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers.length} customers · {filteredHealthScores.length} health records ·{' '}
            {filteredOnboardings.length} onboardings
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {criticalAlerts > 0 && (
            <Badge className="bg-red-100 text-red-700 border border-red-200 gap-1">
              <AlertTriangle className="w-3 h-3" /> {criticalAlerts} Critical
            </Badge>
          )}
          <Select value={csmFilter} onValueChange={setCsmFilter}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue placeholder="All CSMs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All CSMs</SelectItem>
              {csms.map((csm) => (
                <SelectItem key={csm} value={csm}>{csm}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {segments.map((seg) => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          <KPICard icon={Users} value={customers.length} label="Total Customers"
            color={{ bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-500', value: 'text-violet-700 dark:text-violet-300' }} />
          <KPICard icon={Heart} value={avgHealth} label="Avg Health Score"
            color={{ bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-500', value: 'text-pink-700 dark:text-pink-300' }} />
          <KPICard icon={CheckCircle} value={healthyCount} label="Healthy"
            color={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-300' }} />
          <KPICard icon={TrendingDown} value={atRiskCount} label="At Risk"
            color={{ bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500', value: 'text-amber-700 dark:text-amber-300' }} />
          <KPICard icon={AlertTriangle} value={criticalCount} label="Critical"
            color={{ bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-500', value: 'text-red-700 dark:text-red-300' }} />
          <KPICard icon={Activity} value={`${avgOnboardingProgress}%`} label="Onboarding Avg"
            color={{ bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-500', value: 'text-blue-700 dark:text-blue-300' }} />
          <KPICard icon={DollarSign} value={`$${(totalOppValue / 1000).toFixed(0)}K`} label="Opp Pipeline"
            color={{ bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-500', value: 'text-violet-700 dark:text-violet-300' }} />
          <KPICard icon={TrendingUp} value={`${conversionRate}%`} label="Conversion Rate"
            color={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-300' }} />
        </div>
      )}

      {/* Executive Scorecard */}
      <section className="space-y-3">
        <SectionHeader icon={BarChart3} title="Executive Scorecard" color="text-violet-600 dark:text-violet-400"
          description="Period performance overview" />
        <ExecutiveScorecard />
      </section>

      {/* Tasks & Alerts */}
      <section className="space-y-3">
        <SectionHeader icon={Bell} title="Tasks & Alerts" color="text-amber-600 dark:text-amber-400"
          description="Open action items and active customer alerts" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">CSM Tasks</p>
            <CSMTaskManager csmFilter={csmFilter} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alert Center</p>
            <AlertCenter />
          </div>
        </div>
      </section>

      {/* Renewals & Revenue */}
      <section className="space-y-3">
        <SectionHeader icon={Calendar} title="Renewals & Revenue" color="text-blue-600 dark:text-blue-400"
          description="Upcoming renewals and revenue health metrics" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Renewal Tracker</p>
            <RenewalTracker />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue Metrics</p>
            <RevenueMetrics />
          </div>
        </div>
      </section>

      {/* Churn Risk & Segmentation */}
      <section className="space-y-3">
        <SectionHeader icon={AlertTriangle} title="Churn Risk & Segmentation" color="text-red-600 dark:text-red-400"
          description="Predictive churn indicators and customer segments" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ChurnRiskPredictor contacts={contacts} />
          <CustomerSegmentation contacts={contacts} healthScores={filteredHealthScores} />
        </div>
      </section>

      {/* Team Operations */}
      <section className="space-y-3">
        <SectionHeader icon={Users} title="Team Operations" color="text-teal-600 dark:text-teal-400"
          description="Batch actions, QBR scheduling, and CSM workload" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <BatchOperations contacts={contacts} />
          <BusinessReviewScheduler contacts={contacts} />
          <CSMWorkloadView />
        </div>
      </section>

      {/* Churn Analytics */}
      <section className="space-y-3">
        <SectionHeader icon={TrendingDown} title="Churn Risk Analytics" color="text-rose-600 dark:text-rose-400"
          description="Deep dive into churn drivers and at-risk indicators" />
        <ChurnRiskAnalytics
          healthScores={filteredHealthScores}
          onboardings={filteredOnboardings}
          interactions={interactions}
          opportunities={filteredOpportunities}
        />
      </section>

      {/* Health & Sentiment Analysis */}
      <section className="space-y-3">
        <SectionHeader icon={Heart} title="Health & Sentiment Trends" color="text-pink-600 dark:text-pink-400"
          description="Health score evolution by segment, CSM, and customer feedback analysis" />
        <HealthScoreTrends healthScores={filteredHealthScores} contacts={contacts} />
        <FeedbackSentimentAnalysis surveys={surveys} interactions={interactions} />
      </section>

      {/* Charts */}
      <section className="space-y-3">
        <SectionHeader icon={BarChart3} title="Performance Charts" color="text-indigo-600 dark:text-indigo-400"
          description="Visual breakdowns of health trends, onboarding, and opportunities" />
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
      </section>
    </div>
  );
}