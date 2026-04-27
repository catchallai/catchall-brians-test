import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  Calendar,
  FileBarChart,
  ArrowRight,
  Target,
  DollarSign,
  Activity,
  AlertCircle,
  Zap,
  BarChart3,
  Clock,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import ExecutiveMetricCard from '@/components/dashboard/ExecutiveMetricCard';
import AlertWidget from '@/components/dashboard/AlertWidget';

export default function ExecutiveDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: competitors = [], isLoading: loadingCompetitors } = useQuery({
    queryKey: ['competitors', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.Competitor.filter(
        { business_id: user.current_business_id },
        '-last_analyzed',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: visitors = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ['visitor-sessions', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.VisitorSession.filter(
        { business_id: user.current_business_id },
        '-created_date',
        200
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['reservations', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.SalesReservation.filter(
        { business_id: user.current_business_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.Deal.filter(
        { business_id: user.current_business_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  // Calculate lead score for visitor
  const calculateLeadScore = (visitor) => {
    let score = 0;
    score += Math.min(visitor.pages_viewed * 5, 30);
    score += Math.min(Math.floor((visitor.time_on_site || 0) / 60) * 3, 25);
    if (visitor.company_name) {
      score += 20;
    }
    if (visitor.company_tier === 'tier_1') {
      score += 25;
    }
    if (visitor.company_tier === 'tier_2') {
      score += 15;
    }
    if (visitor.company_tier === 'tier_3') {
      score += 5;
    }
    return Math.min(score, 100);
  };

  const highQualityLeads = visitors.filter((v) => calculateLeadScore(v) >= 70).length;
  const upcomingReservations = reservations.filter(
    (r) => r.status === 'confirmed' && new Date(r.reservation_date) > new Date()
  ).length;

  const pipelineValue = deals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const recentCompetitors = competitors.slice(0, 3);
  const highValueLeads = visitors
    .map((v) => ({ ...v, score: calculateLeadScore(v) }))
    .filter((v) => v.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Calculate trends (mock data - replace with real calculations)
  const winRate =
    deals.filter((d) => d.stage === 'won').length > 0
      ? `${Math.round((deals.filter((d) => d.stage === 'won').length / deals.length) * 100)}%`
      : '0%';

  const alertsData = [
    deals.filter((d) => d.stage === 'stuck' || d.stage === 'at_risk').length > 0 && {
      type: 'warning',
      title: `${deals.filter((d) => d.stage === 'stuck' || d.stage === 'at_risk').length} deals at risk`,
      message: 'Review stalled opportunities',
    },
    highQualityLeads > 0 && {
      type: 'info',
      title: `${highQualityLeads} high-value leads`,
      message: 'Ready for outreach',
    },
    upcomingReservations > 0 && {
      type: 'info',
      title: `${upcomingReservations} meetings scheduled`,
      message: 'Next 7 days',
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 glass-topbar p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Executive Dashboard
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">Real-time business overview</p>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Alerts Section */}
        {alertsData.length > 0 && (
          <div>
            <AlertWidget alerts={alertsData} />
          </div>
        )}

        {/* Key Metrics - Super Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <ExecutiveMetricCard
            label="High-Value Leads"
            value={loadingVisitors ? <Skeleton className="h-8 w-12" /> : highQualityLeads}
            icon={Target}
            color="violet"
            trend={highQualityLeads > 0 ? `+${highQualityLeads}` : null}
            trendDirection="up"
            subtext="This week"
          />

          <ExecutiveMetricCard
            label="Pipeline Value"
            value={`$${(pipelineValue / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            color="amber"
            trend={deals.length > 0 ? `${deals.length} deals` : null}
            subtext="Open deals"
          />

          <ExecutiveMetricCard
            label="Meetings"
            value={loadingReservations ? <Skeleton className="h-8 w-12" /> : upcomingReservations}
            icon={Calendar}
            color="emerald"
            subtext="Upcoming"
          />

          <ExecutiveMetricCard
            label="Win Rate"
            value={winRate}
            icon={TrendingUp}
            color="blue"
            trend={deals.length > 0 ? 'On track' : 'No data'}
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <Link to={createPageUrl('SalesHub')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium">Sales Hub</span>
            </Button>
          </Link>
          <Link to={createPageUrl('MarketingHub')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium">Marketing</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Reports')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <FileBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Reports</span>
            </Button>
          </Link>
          <Link to={createPageUrl('VisitorProfiles')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-medium">Leads</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Reservations')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium">Calendar</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ICS')}>
            <Button
              variant="outline"
              className="w-full flex flex-col items-center gap-2 h-auto py-3 dark:border-gray-700"
            >
              <Activity className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-medium">Team</span>
            </Button>
          </Link>
        </div>

        {/* Quick Access Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Competitor Analysis */}
          <Card className="p-4 lg:p-6 glass-card">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">
                    Competitors
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                    Monitor landscape
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('CompetitorAnalysis')}>
                <Button variant="ghost" size="sm" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                  <span className="hidden lg:inline">View All</span>
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </Link>
            </div>

            {loadingCompetitors ? (
              <div className="space-y-2 lg:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />
                ))}
              </div>
            ) : recentCompetitors.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-xs lg:text-sm">No competitors yet</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3">
                {recentCompetitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">
                        {competitor.name}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">
                        {competitor.website}
                      </p>
                    </div>
                    {competitor.tier && (
                      <Badge
                        variant={competitor.tier === 'tier_1' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {competitor.tier.replace('tier_', 'T')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Lead Analysis */}
          <Card className="p-4 lg:p-6 glass-card">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 lg:w-5 lg:h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">
                    High-Value Leads
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Top prospects</p>
                </div>
              </div>
              <Link to={createPageUrl('VisitorProfiles')}>
                <Button variant="ghost" size="sm" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                  <span className="hidden lg:inline">View All</span>
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </Link>
            </div>

            {loadingVisitors ? (
              <div className="space-y-2 lg:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />
                ))}
              </div>
            ) : highValueLeads.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-xs lg:text-sm">No high-value leads yet</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3">
                {highValueLeads.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">
                        {visitor.company_name || 'Anonymous Visitor'}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {visitor.pages_viewed} pages •{' '}
                        {Math.floor((visitor.time_on_site || 0) / 60)}m
                      </p>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-xs">
                      {visitor.score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reservations */}
          <Card className="p-4 lg:p-6 glass-card">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">
                    Reservations
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                    Upcoming meetings
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('Reservations')}>
                <Button variant="ghost" size="sm" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                  <span className="hidden lg:inline">View All</span>
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </Link>
            </div>

            {loadingReservations ? (
              <div className="space-y-2 lg:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />
                ))}
              </div>
            ) : reservations.filter(
                (r) => r.status === 'confirmed' && new Date(r.reservation_date) > new Date()
              ).length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-xs lg:text-sm">No reservations yet</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3">
                {reservations
                  .filter(
                    (r) => r.status === 'confirmed' && new Date(r.reservation_date) > new Date()
                  )
                  .slice(0, 5)
                  .map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">
                          {reservation.title}
                        </p>
                        <p className="text-xs lg:text-sm text-gray-500">
                          {new Date(reservation.reservation_date).toLocaleDateString()} •{' '}
                          {reservation.duration || 60}m
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                        {reservation.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Reports */}
          <Card className="p-4 lg:p-6 glass-card">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileBarChart className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">
                    Reports
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                    Business insights
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('Reports')}>
                <Button variant="ghost" size="sm" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                  <span className="hidden lg:inline">View All</span>
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-2 lg:space-y-3">
              <Link to={createPageUrl('Reports')}>
                <div className="p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">
                        Campaign Performance
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                        Marketing ROI & metrics
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl('MarketingHub')}>
                <div className="p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">
                        Marketing Hub
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                        Comprehensive analytics
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl('SalesHub')}>
                <div className="p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">
                        Sales Hub
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                        Pipeline & forecasts
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
