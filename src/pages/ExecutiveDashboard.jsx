import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  FileBarChart, 
  ArrowRight,
  Target,
  DollarSign,
  Activity,
  AlertCircle
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from "@/components/ui/skeleton";

export default function ExecutiveDashboard() {
  const [selectedTab, setSelectedTab] = React.useState('overview');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: competitors = [], isLoading: loadingCompetitors } = useQuery({
    queryKey: ['competitors', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Competitor.filter({ business_id: user.current_business_id }, '-last_analyzed', 100);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: visitors = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ['visitor-sessions', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.VisitorSession.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['reservations', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.SalesReservation.filter({ business_id: user.current_business_id }, '-created_date', 100);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Deal.filter({ business_id: user.current_business_id }, '-created_date', 100);
    },
    enabled: !!user?.current_business_id,
  });

  // Calculate lead score for visitor
  const calculateLeadScore = (visitor) => {
    let score = 0;
    score += Math.min(visitor.pages_viewed * 5, 30);
    score += Math.min(Math.floor((visitor.time_on_site || 0) / 60) * 3, 25);
    if (visitor.company_name) score += 20;
    if (visitor.company_tier === 'tier_1') score += 25;
    if (visitor.company_tier === 'tier_2') score += 15;
    if (visitor.company_tier === 'tier_3') score += 5;
    return Math.min(score, 100);
  };

  const highQualityLeads = visitors.filter(v => calculateLeadScore(v) >= 70).length;
  const upcomingReservations = reservations.filter(r => 
    r.status === 'confirmed' && new Date(r.reservation_date) > new Date()
  ).length;
  
  const pipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const recentCompetitors = competitors.slice(0, 3);
  const highValueLeads = visitors
    .map(v => ({ ...v, score: calculateLeadScore(v) }))
    .filter(v => v.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 glass-topbar p-4 lg:p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Executive</h1>
        <p className="text-sm text-gray-500 mt-1">Key metrics and insights</p>
      </div>

      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="p-4 lg:p-6 glass-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 lg:block mb-2 lg:mb-0">
              <div className="w-8 h-8 lg:hidden rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">High-Quality Leads</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {loadingVisitors ? <Skeleton className="h-8 w-12" /> : highQualityLeads}
            </p>
            <div className="hidden lg:flex w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 items-center justify-center">
              <Target className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6 glass-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 lg:block mb-2 lg:mb-0">
              <div className="w-8 h-8 lg:hidden rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Competitors</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {loadingCompetitors ? <Skeleton className="h-8 w-12" /> : competitors.length}
            </p>
            <div className="hidden lg:flex w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6 glass-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 lg:block mb-2 lg:mb-0">
              <div className="w-8 h-8 lg:hidden rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Reservations</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {loadingReservations ? <Skeleton className="h-8 w-12" /> : upcomingReservations}
            </p>
            <div className="hidden lg:flex w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6 glass-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 lg:block mb-2 lg:mb-0">
              <div className="w-8 h-8 lg:hidden rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Pipeline</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              ${(pipelineValue / 1000000).toFixed(1)}M
            </p>
            <div className="hidden lg:flex w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
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
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">Competitors</h3>
                <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Monitor landscape</p>
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
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />)}
            </div>
          ) : recentCompetitors.length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-xs lg:text-sm">No competitors yet</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {recentCompetitors.map((competitor) => (
                <div key={competitor.id} className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">{competitor.name}</p>
                    <p className="text-xs lg:text-sm text-gray-500 truncate">{competitor.website}</p>
                  </div>
                  {competitor.tier && (
                    <Badge variant={competitor.tier === 'tier_1' ? 'default' : 'secondary'} className="text-xs">
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
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">High-Value Leads</h3>
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
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />)}
            </div>
          ) : highValueLeads.length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-xs lg:text-sm">No high-value leads yet</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {highValueLeads.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">
                      {visitor.company_name || 'Anonymous Visitor'}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {visitor.pages_viewed} pages • {Math.floor((visitor.time_on_site || 0) / 60)}m
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
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">Reservations</h3>
                <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Upcoming meetings</p>
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
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 lg:h-16 rounded-lg" />)}
            </div>
          ) : reservations.filter(r => r.status === 'confirmed' && new Date(r.reservation_date) > new Date()).length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-xs lg:text-sm">No reservations yet</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {reservations
                .filter(r => r.status === 'confirmed' && new Date(r.reservation_date) > new Date())
                .slice(0, 5)
                .map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white truncate">{reservation.title}</p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {new Date(reservation.reservation_date).toLocaleDateString()} • {reservation.duration || 60}m
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
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">Reports</h3>
                <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Business insights</p>
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
                    <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">Campaign Performance</p>
                    <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Marketing ROI & metrics</p>
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
                    <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">Marketing Hub</p>
                    <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Comprehensive analytics</p>
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
                    <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">Sales Hub</p>
                    <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Pipeline & forecasts</p>
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