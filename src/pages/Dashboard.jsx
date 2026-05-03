import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createPageUrl } from '@/utils';
import {
  Users,
  Building2,
  Target,
  Search,
  TrendingUp,
  Calendar,
  Mail,
  Radio,
  Globe,
  ArrowUp,
  ArrowDown,
  BarChart3,
  DollarSign,
  Activity,
} from 'lucide-react';

const PipelineCard = React.lazy(() => import('@/components/dashboard/PipelineCard'));
const SEOHealthCard = React.lazy(() => import('@/components/dashboard/SEOHealthCard'));
const SocialSentimentCard = React.lazy(() => import('@/components/dashboard/SocialSentimentCard'));
const ContentCalendarCard = React.lazy(() => import('@/components/dashboard/ContentCalendarCard'));
const RecentActivityFeed = React.lazy(() => import('@/components/dashboard/RecentActivityFeed'));
const AlertsSummary = React.lazy(() => import('@/components/dashboard/AlertsSummary'));
import QuickActions from '@/components/dashboard/QuickActions';
import BusinessOverviewCards from '@/components/dashboard/BusinessOverviewCards';

export default function Dashboard() {
  // CRM Data
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 1000),
    staleTime: 5 * 60 * 1000,
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 1000),
    staleTime: 5 * 60 * 1000,
  });

  // SEO Data
  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 200),
    staleTime: 10 * 60 * 1000,
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 200),
    staleTime: 10 * 60 * 1000,
  });

  // Social Data
  const { data: mentions = [] } = useQuery({
    queryKey: ['dashboard-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () =>
      base44.entities.ListeningAlert.filter({ is_dismissed: false }, '-created_date', 20),
    staleTime: 2 * 60 * 1000,
  });

  const { data: listeningKeywords = [] } = useQuery({
    queryKey: ['listening-keywords'],
    queryFn: () => base44.entities.SocialListening.list('-created_date', 50),
    staleTime: 10 * 60 * 1000,
  });

  // Content Data
  const { data: calendarPosts = [] } = useQuery({
    queryKey: ['dashboard-posts'],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 50),
    staleTime: 5 * 60 * 1000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 50),
    staleTime: 10 * 60 * 1000,
  });

  // Marketing Data
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 50),
    staleTime: 10 * 60 * 1000,
  });

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date', 50),
    staleTime: 10 * 60 * 1000,
  });

  // User
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isLoading = loadingContacts || loadingDeals || loadingUser;

  // Filter out deleted and duplicate contacts (match Contacts module logic)
  const activeContacts = contacts.filter((c) => !c.deleted && !c.duplicate_of_id);

  // Calculate metrics
  const totalPipelineValue = deals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonDealsValue = deals
    .filter((d) => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const avgSEOScore =
    websites.length > 0
      ? Math.round(websites.reduce((sum, w) => sum + (w.seo_score || 0), 0) / websites.length)
      : 0;

  const top10Keywords = keywords.filter(
    (k) => k.current_position && k.current_position <= 10
  ).length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const scheduledPosts = calendarPosts.filter((p) => p.status === 'scheduled').length;

  const monthlyTraffic = websites.reduce((sum, w) => sum + (w.organic_traffic || 0), 0);
  const totalEngagement = mentions.reduce((sum, m) => sum + (m.engagement_rate || 0), 0);
  const avgEngagementRate =
    mentions.length > 0 ? (totalEngagement / mentions.length).toFixed(1) : 0;
  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  ).length;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Calculate revenue and conversion metrics
  const thisMonthDeals = deals.filter((d) => {
    const createdDate = new Date(d.created_date);
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    );
  });

  const lastMonthDeals = deals.filter((d) => {
    const createdDate = new Date(d.created_date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      createdDate.getMonth() === lastMonth.getMonth() &&
      createdDate.getFullYear() === lastMonth.getFullYear()
    );
  });

  const thisMonthRevenue = thisMonthDeals
    .filter((d) => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const lastMonthRevenue = lastMonthDeals
    .filter((d) => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const revenueChange =
    lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(0)
      : 0;

  const thisMonthPipelineValue = thisMonthDeals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const lastMonthPipelineValue = lastMonthDeals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const pipelineChange =
    lastMonthPipelineValue > 0
      ? (
          ((thisMonthPipelineValue - lastMonthPipelineValue) / lastMonthPipelineValue) *
          100
        ).toFixed(0)
      : 0;

  // Stable navigation handler (avoids full-page reload for better INP)
  const navigate = (page) => (window.location.href = createPageUrl(page));

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 min-h-screen">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 sm:p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-violet-100 text-sm sm:text-base lg:text-lg">
                Here's your complete business overview
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              {/* Revenue Card */}
              <button onClick={() => navigate('Deals')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">Revenue</p>
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">
                  {formatCurrency(wonDealsValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {revenueChange >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-300" />
                  )}
                  <p
                    className={`text-[10px] sm:text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                  >
                    {Math.abs(revenueChange)}% month
                  </p>
                </div>
              </button>
              {/* Pipeline Card */}
              <button onClick={() => navigate('Deals')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">Pipeline</p>
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-orange-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">
                  {formatCurrency(totalPipelineValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {pipelineChange >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-300" />
                  )}
                  <p
                    className={`text-[10px] sm:text-xs font-medium ${pipelineChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                  >
                    {Math.abs(pipelineChange)}% month
                  </p>
                </div>
              </button>
              {/* SEO Score Card */}
              <button onClick={() => navigate('SEODashboard')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">SEO Score</p>
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">{avgSEOScore || '-'}</p>
                <p className="text-blue-300 text-[10px] sm:text-xs font-medium mt-1">
                  {avgSEOScore > 70 ? '✓ Good' : avgSEOScore > 0 ? '◐ Fair' : 'N/A'}
                </p>
              </button>
              {/* Web Traffic Card */}
              <button onClick={() => navigate('TrafficAnalytics')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">Web Traffic</p>
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">
                  {monthlyTraffic >= 1000
                    ? `${(monthlyTraffic / 1000).toFixed(1)}K`
                    : monthlyTraffic}
                </p>
                <p className="text-cyan-300 text-[10px] sm:text-xs font-medium mt-1">visits/mo</p>
              </button>
              {/* Social Mentions Card */}
              <button onClick={() => navigate('SocialListening')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">Social</p>
                  <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-pink-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">{mentions.length}</p>
                <p className="text-pink-300 text-[10px] sm:text-xs font-medium mt-1">
                  {avgEngagementRate}% eng.
                </p>
              </button>
              {/* Alerts Card */}
              <button onClick={() => navigate('SocialListening')} className="text-left bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-violet-100 text-xs sm:text-sm">Alerts</p>
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
                </div>
                <p className="text-white text-lg sm:text-2xl font-bold">{criticalAlerts}</p>
                <p
                  className={`text-[10px] sm:text-xs font-medium mt-1 ${criticalAlerts > 0 ? 'text-red-300' : 'text-emerald-300'}`}
                >
                  {criticalAlerts > 0 ? '⚠ action' : '✓ clear'}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Business Overview Metrics */}
        <BusinessOverviewCards
          metrics={[
            {
              id: 'contacts',
              icon: 'users',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              textColor: 'text-blue-600',
              value: activeContacts.length,
              label: 'Total Contacts',
              sublabel: `${activeContacts.filter((c) => c.status === 'lead').length} leads`,
              trend: '+12%',
              trendColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            },
            {
              id: 'companies',
              icon: 'building',
              bgColor: 'bg-purple-50 dark:bg-purple-900/20',
              textColor: 'text-purple-600',
              value: companies.length,
              label: 'Companies',
              trend: '+5%',
              trendColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            },
            {
              id: 'deals',
              icon: 'target',
              bgColor: 'bg-orange-50 dark:bg-orange-900/20',
              textColor: 'text-orange-600',
              value: deals.filter((d) => !['won', 'lost'].includes(d.stage)).length,
              label: 'Active Deals',
              sublabel: formatCurrency(totalPipelineValue),
            },
            {
              id: 'keywords',
              icon: 'search',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              textColor: 'text-green-600',
              value: keywords.length,
              label: 'Tracked Keywords',
              sublabel: `${top10Keywords} in top 10`,
            },
            {
              id: 'websites',
              icon: 'award',
              bgColor: 'bg-violet-50 dark:bg-violet-900/20',
              textColor: 'text-violet-600',
              value: websites.length,
              label: 'Websites',
              sublabel: `Avg score: ${avgSEOScore}`,
            },
            {
              id: 'listening',
              icon: 'zap',
              bgColor: 'bg-pink-50 dark:bg-pink-900/20',
              textColor: 'text-pink-600',
              value: listeningKeywords.filter((k) => k.is_active).length,
              label: 'Social Listening',
              sublabel: `${mentions.length} mentions`,
              trend: 'Active',
              trendColor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
            },
            {
              id: 'posts',
              icon: 'trending',
              bgColor: 'bg-amber-50 dark:bg-amber-900/20',
              textColor: 'text-amber-600',
              value: scheduledPosts,
              label: 'Scheduled Posts',
              sublabel: `${brands.length} brands`,
            },
            {
              id: 'campaigns',
              icon: 'dollar',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              textColor: 'text-blue-600',
              value: activeCampaigns,
              label: 'Active Campaigns',
              sublabel: `${emailCampaigns.length} email`,
            },
          ]}
          onCardClick={(id) => {
            const pageMap = {
              contacts: 'Contacts',
              companies: 'Companies',
              deals: 'Deals',
              keywords: 'Keywords',
              websites: 'SEODashboard',
              listening: 'SocialListening',
              posts: 'SocialCalendar',
              campaigns: 'Campaigns',
            };
            navigate(pageMap[id]);
          }}
        />

        {/* Main Dashboard Cards */}
        <React.Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PipelineCard deals={deals} />
            <SEOHealthCard websites={websites} keywords={keywords} backlinks={backlinks} />
            <SocialSentimentCard mentions={mentions} alerts={alerts} />
          </div>
        </React.Suspense>

        {/* Content & Activity Row */}
        <React.Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContentCalendarCard posts={calendarPosts} brands={brands} />
            <AlertsSummary alerts={alerts} keywords={listeningKeywords} mentions={mentions} />
          </div>
        </React.Suspense>

        {/* Recent Activity */}
        <React.Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
          <RecentActivityFeed contacts={contacts} deals={deals} mentions={mentions} />
        </React.Suspense>
      </div>
    </div>
  );
}