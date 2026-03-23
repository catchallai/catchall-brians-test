import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Target,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Zap,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import SalesPipelineKanban from '@/components/sales/SalesPipelineKanban';
import SalesActivityFeed from '@/components/sales/SalesActivityFeed';
import QuotaProgressTracker from '@/components/sales/QuotaProgressTracker';
import WinLossAnalysis from '@/components/sales/WinLossAnalysis';

export default function SalesDashboard() {
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 100),
  });

  const { data: quotas = [], isLoading: loadingQuotas } = useQuery({
    queryKey: ['sales-quotas'],
    queryFn: () => base44.entities.SalesQuota.list('-created_date', 50),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['sales-activities'],
    queryFn: () => base44.entities.Activity.filter({ entity_type: 'deal' }, '-created_date', 50),
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['sales-forecasts'],
    queryFn: () => base44.entities.SalesForecast.list('-created_date', 50),
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const handleDealDrop = (deal, newStage) => {
    updateDealMutation.mutate({
      id: deal.id,
      data: { ...deal, stage: newStage },
    });
  };

  const isLoading = loadingDeals || loadingProposals || loadingQuotas;

  const stats = {
    pipeline: {
      value: deals
        .filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
        .reduce((sum, d) => sum + (d.value || 0), 0),
      count: deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage)).length,
    },
    won: {
      value: deals
        .filter((d) => d.stage === 'closed_won')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      count: deals.filter((d) => d.stage === 'closed_won').length,
    },
    proposals: {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === 'sent').length,
    },
  };

  const quickLinks = [
    { name: 'Sales Hub', icon: Target, page: 'SalesHub', color: 'violet' },
    { name: 'Lead Enrichment', icon: Users, page: 'LeadEnrichment', color: 'blue' },
    { name: 'Sequences', icon: Zap, page: 'SalesSequences', color: 'emerald' },
    {
      name: 'Proposals',
      icon: FileText,
      page: 'Proposals',
      count: stats.proposals.total,
      color: 'amber',
    },
    { name: 'Meeting Scheduler', icon: Calendar, page: 'MeetingScheduler', color: 'cyan' },
    { name: 'Sales Quotas', icon: TrendingUp, page: 'SalesQuotas', color: 'pink' },
    { name: 'Reservations', icon: Calendar, page: 'Reservations', color: 'indigo' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pipeline, forecasts, and team performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pipeline Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.pipeline.value / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.pipeline.count} active deals</p>
              </div>
              <Target className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Won Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.won.value / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stats.won.count} deals closed
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Proposals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.proposals.total}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {stats.proposals.pending} pending
                </p>
              </div>
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Win/Loss Analysis */}
      <div className="col-span-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Win/Loss Analysis
        </h2>
        <WinLossAnalysis deals={deals} />
      </div>

      {/* Pipeline Kanban */}
      <div className="col-span-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sales Pipeline</h2>
        <SalesPipelineKanban deals={deals} onDealDrop={handleDealDrop} />
      </div>

      {/* Activity & Quota */}
      <div className="col-span-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesActivityFeed activities={activities} />

        {quotas.map((quota) => (
          <QuotaProgressTracker
            key={quota.id}
            quota={quota}
            forecast={forecasts.find((f) => f.user_email === quota.user_email)}
          />
        ))}
      </div>

      {/* Quick Access */}
      <div className="col-span-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.page} to={createPageUrl(link.page)}>
                <Card className="glass-card hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-${link.color}-100 dark:bg-${link.color}-900/40 flex items-center justify-center`}
                        >
                          <Icon className={`w-6 h-6 text-${link.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {link.name}
                          </h3>
                          {link.count !== undefined && (
                            <p className="text-sm text-gray-500">{link.count} items</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
