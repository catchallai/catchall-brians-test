import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users,
  Building2,
  Target,
  Mail,
  Calendar,
  Zap,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Activity,
  Award,
  BarChart3,
} from 'lucide-react';

export default function CRMDashboard() {
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 200),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100),
  });

  const { data: emailLogs = [], isLoading: loadingEmailLogs } = useQuery({
    queryKey: ['email-logs'],
    queryFn: () => base44.entities.EmailLog.list('-sent_at', 100),
  });

  const isLoading =
    loadingContacts ||
    loadingCompanies ||
    loadingOpportunities ||
    loadingDeals ||
    loadingActivities ||
    loadingEmailLogs;

  // Alert data
  const unownedContacts = contacts.filter((c) => !c.owner_email && c.status === 'lead').length;
  const overdueDealsProbability = deals.filter((d) => {
    const daysUntilClose = new Date(d.expected_close_date) - new Date();
    return daysUntilClose < 0 && d.stage !== 'won' && d.stage !== 'lost';
  }).length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    contacts: {
      total: contacts.length,
      leads: contacts.filter((c) => c.status === 'lead').length,
      customers: contacts.filter((c) => c.status === 'customer').length,
      prospects: contacts.filter((c) => c.status === 'prospect').length,
      newThisWeek: contacts.filter((c) => new Date(c.created_date) > sevenDaysAgo).length,
      newThisMonth: contacts.filter((c) => new Date(c.created_date) > thirtyDaysAgo).length,
    },
    companies: {
      total: companies.length,
      newThisMonth: companies.filter((c) => new Date(c.created_date) > thirtyDaysAgo).length,
    },
    opportunities: {
      total: opportunities.length,
      open: opportunities.filter((o) => o.status === 'open').length,
      qualified: opportunities.filter((o) => o.status === 'qualified').length,
      won: opportunities.filter((o) => o.status === 'won').length,
    },
    deals: {
      total: deals.length,
      active: deals.filter((d) => !['won', 'lost'].includes(d.stage)).length,
      totalValue: deals
        .filter((d) => !['won', 'lost'].includes(d.stage))
        .reduce((sum, d) => sum + (d.value || 0), 0),
      won: deals.filter((d) => d.stage === 'won').length,
      wonValue: deals.filter((d) => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0),
      avgDealSize:
        deals.length > 0
          ? Math.round(deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length)
          : 0,
    },
    activities: {
      total: activities.length,
      thisWeek: activities.filter((a) => new Date(a.created_date) > sevenDaysAgo).length,
      byType: {
        notes: activities.filter((a) => a.activity_type === 'note_added').length,
        calls: activities.filter((a) => a.activity_type === 'called').length,
        meetings: activities.filter((a) => a.activity_type === 'met').length,
      },
    },
    emails: {
      sent: emailLogs.length,
      opened: emailLogs.filter((e) => e.status === 'opened' || e.status === 'clicked').length,
      clicked: emailLogs.filter((e) => e.status === 'clicked').length,
      openRate:
        emailLogs.length > 0
          ? Math.round(
              (emailLogs.filter((e) => e.status === 'opened' || e.status === 'clicked').length /
                emailLogs.length) *
                100
            )
          : 0,
    },
    pipeline: deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage)).length,
  };

  const quickLinks = [
    { name: 'Contacts', icon: Users, page: 'Contacts', count: stats.contacts.total, color: 'blue' },
    {
      name: 'Companies',
      icon: Building2,
      page: 'Companies',
      count: stats.companies.total,
      color: 'violet',
    },
    {
      name: 'Opportunities',
      icon: Target,
      page: 'Opportunities',
      count: stats.opportunities.total,
      color: 'emerald',
    },
    { name: 'Pipeline', icon: Target, page: 'Deals', count: stats.pipeline, color: 'amber' },
    { name: 'Email Marketing', icon: Mail, page: 'EmailMarketing', color: 'cyan' },
    { name: 'Activities', icon: Calendar, page: 'Activities', color: 'pink' },
    { name: 'Automation', icon: Zap, page: 'Automation', color: 'indigo' },
    { name: 'Marketing Hub', icon: TrendingUp, page: 'MarketingHub', color: 'green' },
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
        <h1 className="text-3xl font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
          CRM
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customer relationship management overview
        </p>
      </div>

      {/* Alerts */}
      {unownedContacts > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ <strong>{unownedContacts} leads</strong> need owner assignment to prevent duplicate
            outreach
          </p>
        </div>
      )}
      {overdueDealsProbability > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-200">
            🔴 <strong>{overdueDealsProbability} deals</strong> past expected close date
          </p>
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Contacts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.contacts.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.contacts.leads} leads, {stats.contacts.customers} customers
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  +{stats.contacts.newThisWeek} this week
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pipeline Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.deals.totalValue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.deals.active} active deals</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Avg: ${(stats.deals.avgDealSize / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Won Deals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.deals.wonValue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.deals.won} deals closed</p>
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                  {stats.opportunities.won} opportunities won
                </p>
              </div>
              <Award className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email Performance
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.emails.openRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.emails.sent} emails sent</p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {stats.emails.clicked} clicked
                </p>
              </div>
              <Mail className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.activities.thisWeek}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Notes</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.activities.byType.notes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Calls</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.activities.byType.calls}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Meetings</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.activities.byType.meetings}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-500" />
              Companies & Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Companies</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.companies.total}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">New This Month</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{stats.companies.newThisMonth}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Open Opportunities</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.opportunities.open}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Qualified</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.opportunities.qualified}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Contact Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Leads</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.contacts.leads}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Prospects</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.contacts.prospects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Customers</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.contacts.customers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">New This Month</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{stats.contacts.newThisMonth}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
