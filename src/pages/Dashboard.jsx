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
  // CRM Data
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 100),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  // SEO Data
  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 200),
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 200),
  });

  // Social Data
  const { data: mentions = [] } = useQuery({
    queryKey: ['dashboard-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 100),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => base44.entities.ListeningAlert.filter({ is_dismissed: false }, '-created_date', 20),
  });

  const { data: listeningKeywords = [] } = useQuery({
    queryKey: ['listening-keywords'],
    queryFn: () => base44.entities.SocialListening.list('-created_date', 50),
  });

  // Content Data
  const { data: calendarPosts = [] } = useQuery({
    queryKey: ['dashboard-posts'],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 50),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 50),
  });

  // Marketing Data
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 50),
  });

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date', 50),
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
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-white">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Good evening, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-violet-100 text-lg">Here's what's happening with your brand today</p>
            </div>
            <div className="flex gap-4 lg:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <p className="text-violet-100 text-sm mb-1">Pipeline</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                <p className="text-emerald-300 text-xs font-medium">+12% this month</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <p className="text-violet-100 text-sm mb-1">SEO Score</p>
                <p className="text-white text-2xl font-bold">{avgSEOScore || '-'}</p>
                <p className="text-emerald-300 text-xs font-medium">{avgSEOScore > 70 ? '+5pts' : 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <p className="text-violet-100 text-sm mb-1">Mentions</p>
                <p className="text-white text-2xl font-bold">{mentions.length}</p>
                <p className="text-amber-300 text-xs font-medium">{mentions.length > 10 ? 'Active' : 'Low'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Metrics Grid - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Contacts')}>
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('SEODashboard')}>
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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