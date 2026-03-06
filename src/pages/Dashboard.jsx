import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, Building2, DollarSign, Target, Search, TrendingUp, 
  MessageSquare, Calendar, Mail, Radio, Globe, Zap, ArrowRight
} from "lucide-react";

const PipelineCard = React.lazy(() => import('@/components/dashboard/PipelineCard'));
const SEOHealthCard = React.lazy(() => import('@/components/dashboard/SEOHealthCard'));
const SocialSentimentCard = React.lazy(() => import('@/components/dashboard/SocialSentimentCard'));
const ContentCalendarCard = React.lazy(() => import('@/components/dashboard/ContentCalendarCard'));
const RecentActivityFeed = React.lazy(() => import('@/components/dashboard/RecentActivityFeed'));
const AlertsSummary = React.lazy(() => import('@/components/dashboard/AlertsSummary'));
import QuickActions from '@/components/dashboard/QuickActions';

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
    queryFn: () => base44.entities.ListeningAlert.filter({ is_dismissed: false }, '-created_date', 20),
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

  // Get favorite links from user data
  const favoriteLinks = user?.favorite_links || [];

  const updateFavoriteLinks = async (newFavorites) => {
    await base44.auth.updateMe({ favorite_links: newFavorites });
  };

  const isLoading = loadingContacts || loadingDeals || loadingUser;

  // Filter out deleted and duplicate contacts (match Contacts module logic)
  const activeContacts = contacts.filter(c => !c.deleted && !c.duplicate_of_id);

  // Calculate metrics
  const totalPipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonDealsValue = deals
    .filter(d => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const avgSEOScore = websites.length > 0 
    ? Math.round(websites.reduce((sum, w) => sum + (w.seo_score || 0), 0) / websites.length)
    : 0;

  const top10Keywords = keywords.filter(k => k.current_position && k.current_position <= 10).length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const scheduledPosts = calendarPosts.filter(p => p.status === 'scheduled').length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  
  const monthlyTraffic = websites.reduce((sum, w) => sum + (w.organic_traffic || 0), 0);
  const totalEngagement = mentions.reduce((sum, m) => sum + (m.engagement_rate || 0), 0);
  const avgEngagementRate = mentions.length > 0 ? (totalEngagement / mentions.length).toFixed(1) : 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Calculate revenue and conversion metrics
  const thisMonthDeals = deals.filter(d => {
    const createdDate = new Date(d.created_date);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  });

  const lastMonthDeals = deals.filter(d => {
    const createdDate = new Date(d.created_date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return createdDate.getMonth() === lastMonth.getMonth() && createdDate.getFullYear() === lastMonth.getFullYear();
  });

  const thisMonthRevenue = thisMonthDeals.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0);
  const lastMonthRevenue = lastMonthDeals.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0);
  const revenueChange = lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(0) : 0;

  const thisMonthPipelineValue = thisMonthDeals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);
  const lastMonthPipelineValue = lastMonthDeals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);
  const pipelineChange = lastMonthPipelineValue > 0 ? (((thisMonthPipelineValue - lastMonthPipelineValue) / lastMonthPipelineValue) * 100).toFixed(0) : 0;

  // Stable navigation handler (avoids full-page reload for better INP)
  const navigate = (page) => window.location.href = createPageUrl(page);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
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
              <p className="text-violet-100 text-sm sm:text-base lg:text-lg">Here's your business overview</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Revenue</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{formatCurrency(wonDealsValue)}</p>
                <p className={`text-[10px] sm:text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange}% month
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Pipeline</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                <p className={`text-[10px] sm:text-xs font-medium ${pipelineChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {pipelineChange >= 0 ? '+' : ''}{pipelineChange}% month
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">SEO Score</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{avgSEOScore || '-'}</p>
                <p className="text-blue-300 text-[10px] sm:text-xs font-medium">{avgSEOScore > 70 ? 'Good' : avgSEOScore > 0 ? 'Fair' : 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Web Traffic</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{monthlyTraffic >= 1000 ? `${(monthlyTraffic/1000).toFixed(1)}K` : monthlyTraffic}</p>
                <p className="text-cyan-300 text-[10px] sm:text-xs font-medium">visits/mo</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Social</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{mentions.length}</p>
                <p className="text-amber-300 text-[10px] sm:text-xs font-medium">{avgEngagementRate}% engage</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Alerts</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{criticalAlerts}</p>
                <p className={`text-[10px] sm:text-xs font-medium ${criticalAlerts > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{criticalAlerts > 0 ? 'need action' : 'all clear'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Metrics Grid - Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('Contacts')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeContacts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Contacts</p>
              <p className="text-xs text-gray-400 mt-1">{activeContacts.filter(c => c.status === 'lead').length} leads</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('Companies')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{companies.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Companies</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('Deals')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{deals.filter(d => !['won', 'lost'].includes(d.stage)).length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Deals</p>
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(totalPipelineValue)}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('Keywords')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{keywords.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tracked Keywords</p>
              <p className="text-xs text-gray-400 mt-1">{top10Keywords} in top 10</p>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid - Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('SEODashboard')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{websites.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Websites</p>
              <p className="text-xs text-gray-400 mt-1">Avg score: {avgSEOScore}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('SocialListening')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-pink-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{listeningKeywords.filter(k => k.is_active).length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Social Listening</p>
              <p className="text-xs text-gray-400 mt-1">{mentions.length} mentions</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('SocialCalendar')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{scheduledPosts}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Posts</p>
              <p className="text-xs text-gray-400 mt-1">{brands.length} brands</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Campaigns')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeCampaigns}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</p>
              <p className="text-xs text-gray-400 mt-1">{emailCampaigns.length} email campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Cards */}
        <React.Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{[0,1,2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PipelineCard deals={deals} />
            <SEOHealthCard 
              websites={websites} 
              keywords={keywords} 
              backlinks={backlinks} 
            />
            <SocialSentimentCard 
              mentions={mentions} 
              alerts={alerts} 
            />
          </div>
        </React.Suspense>

        {/* Content & Activity Row */}
        <React.Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContentCalendarCard 
              posts={calendarPosts} 
              brands={brands} 
            />
            <AlertsSummary 
              alerts={alerts} 
              keywords={listeningKeywords} 
              mentions={mentions} 
            />
          </div>
        </React.Suspense>

        {/* Recent Activity */}
        <React.Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
          <RecentActivityFeed 
            contacts={contacts} 
            deals={deals} 
            mentions={mentions} 
          />
        </React.Suspense>
      </div>
    </div>
  );
}