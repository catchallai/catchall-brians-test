import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOrganizationContext } from '@/components/hooks/useOrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, Building2, DollarSign, Target, Search, TrendingUp, 
  MessageSquare, Calendar, Mail, Radio, Globe, Zap, ArrowRight
} from "lucide-react";

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import PipelineCard from '@/components/dashboard/PipelineCard';
import SEOHealthCard from '@/components/dashboard/SEOHealthCard';
import SocialSentimentCard from '@/components/dashboard/SocialSentimentCard';
import ContentCalendarCard from '@/components/dashboard/ContentCalendarCard';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import AlertsSummary from '@/components/dashboard/AlertsSummary';
import QuickActions from '@/components/dashboard/QuickActions';
import FavoriteLinksManager from '@/components/dashboard/FavoriteLinksManager';

export default function Dashboard() {
  const { organizationId } = useOrganizationContext();
  
  // CRM Data
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Contact.filter({ organization_id: organizationId }, '-created_date', 100);
      }
      return base44.entities.Contact.list('-created_date', 100);
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Company.filter({ organization_id: organizationId }, '-created_date', 100);
      }
      return base44.entities.Company.list('-created_date', 100);
    },
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Deal.filter({ organization_id: organizationId }, '-created_date', 100);
      }
      return base44.entities.Deal.list('-created_date', 100);
    },
  });

  // SEO Data
  const { data: websites = [] } = useQuery({
    queryKey: ['websites', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Website.filter({ organization_id: organizationId }, '-created_date', 50);
      }
      return base44.entities.Website.list('-created_date', 50);
    },
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Keyword.filter({ organization_id: organizationId }, '-created_date', 200);
      }
      return base44.entities.Keyword.list('-created_date', 200);
    },
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Backlink.filter({ organization_id: organizationId }, '-created_date', 200);
      }
      return base44.entities.Backlink.list('-created_date', 200);
    },
  });

  // Social Data
  const { data: mentions = [] } = useQuery({
    queryKey: ['dashboard-mentions', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.ListeningMention.filter({ organization_id: organizationId }, '-created_date', 100);
      }
      return base44.entities.ListeningMention.list('-created_date', 100);
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.ListeningAlert.filter({ organization_id: organizationId, is_dismissed: false }, '-created_date', 20);
      }
      return base44.entities.ListeningAlert.filter({ is_dismissed: false }, '-created_date', 20);
    },
  });

  const { data: listeningKeywords = [] } = useQuery({
    queryKey: ['listening-keywords', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.SocialListening.filter({ organization_id: organizationId }, '-created_date', 50);
      }
      return base44.entities.SocialListening.list('-created_date', 50);
    },
  });

  // Content Data
  const { data: calendarPosts = [] } = useQuery({
    queryKey: ['dashboard-posts', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.CalendarPost.filter({ organization_id: organizationId }, '-scheduled_date', 50);
      }
      return base44.entities.CalendarPost.list('-scheduled_date', 50);
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Brand.filter({ organization_id: organizationId }, '-created_date', 50);
      }
      return base44.entities.Brand.list('-created_date', 50);
    },
  });

  // Marketing Data
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.Campaign.filter({ organization_id: organizationId }, '-created_date', 50);
      }
      return base44.entities.Campaign.list('-created_date', 50);
    },
  });

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns', organizationId],
    queryFn: async () => {
      if (organizationId) {
        return base44.entities.EmailCampaign.filter({ organization_id: organizationId }, '-created_date', 50);
      }
      return base44.entities.EmailCampaign.list('-created_date', 50);
    },
  });

  // User
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Get favorite links from user data
  const favoriteLinks = user?.favorite_links || [];

  const updateFavoriteLinks = async (newFavorites) => {
    await base44.auth.updateMe({ favorite_links: newFavorites });
  };

  const isLoading = loadingContacts || loadingDeals;

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

  // Header quick stats
  const headerStats = [
    { label: 'Pipeline', value: formatCurrency(totalPipelineValue), change: '+12%', changeType: 'up' },
    { label: 'Won Revenue', value: formatCurrency(wonDealsValue), change: '+24%', changeType: 'up' },
    { label: 'SEO Score', value: avgSEOScore || '-', change: avgSEOScore > 70 ? '+5pts' : null, changeType: avgSEOScore > 70 ? 'up' : null },
    { label: 'Social Mentions', value: mentions.length, change: mentions.length > 10 ? 'Active' : null },
  ];

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
                Good evening, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-violet-100 text-sm sm:text-base lg:text-lg">Here's what's happening with your brand today</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Pipeline</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                <p className="text-emerald-300 text-[10px] sm:text-xs font-medium">+12% month</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">SEO Score</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{avgSEOScore || '-'}</p>
                <p className="text-emerald-300 text-[10px] sm:text-xs font-medium">{avgSEOScore > 70 ? '+5pts' : 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Web Traffic</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{monthlyTraffic >= 1000 ? `${(monthlyTraffic/1000).toFixed(1)}K` : monthlyTraffic}</p>
                <p className="text-blue-300 text-[10px] sm:text-xs font-medium">monthly visits</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Engagement</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{avgEngagementRate}%</p>
                <p className="text-cyan-300 text-[10px] sm:text-xs font-medium">social rate</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Mentions</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{mentions.length}</p>
                <p className="text-amber-300 text-[10px] sm:text-xs font-medium">{mentions.length > 10 ? 'Active' : 'Low'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/20">
                <p className="text-violet-100 text-xs sm:text-sm mb-1">Alerts</p>
                <p className="text-white text-lg sm:text-2xl font-bold">{criticalAlerts}</p>
                <p className={`text-[10px] sm:text-xs font-medium ${criticalAlerts > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{criticalAlerts > 0 ? 'critical' : 'none'}</p>
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
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Contacts')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{contacts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Contacts</p>
              <p className="text-xs text-gray-400 mt-1">{contacts.filter(c => c.status === 'lead').length} leads</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Companies')}>
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

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Deals')}>
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

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Keywords')}>
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
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('SEODashboard')}>
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

        {/* Content & Activity Row */}
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

        {/* Recent Activity */}
        <RecentActivityFeed 
          contacts={contacts} 
          deals={deals} 
          mentions={mentions} 
        />
      </div>
    </div>
  );
}