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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header with Key Metrics */}
      <DashboardHeader user={user} stats={headerStats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Contacts"
          value={contacts.length}
          subtitle={`${contacts.filter(c => c.status === 'lead').length} leads`}
          icon={Users}
          color="blue"
          onClick={() => window.location.href = createPageUrl('Contacts')}
        />
        <MetricCard
          title="Companies"
          value={companies.length}
          icon={Building2}
          color="purple"
          onClick={() => window.location.href = createPageUrl('Companies')}
        />
        <MetricCard
          title="Active Deals"
          value={deals.filter(d => !['won', 'lost'].includes(d.stage)).length}
          subtitle={formatCurrency(totalPipelineValue)}
          icon={Target}
          color="orange"
          onClick={() => window.location.href = createPageUrl('Deals')}
        />
        <MetricCard
          title="Tracked Keywords"
          value={keywords.length}
          subtitle={`${top10Keywords} in top 10`}
          icon={Search}
          color="green"
          onClick={() => window.location.href = createPageUrl('Keywords')}
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Websites"
          value={websites.length}
          subtitle={`Avg score: ${avgSEOScore}`}
          icon={Globe}
          color="violet"
          onClick={() => window.location.href = createPageUrl('SEODashboard')}
        />
        <MetricCard
          title="Social Listening"
          value={listeningKeywords.filter(k => k.is_active).length}
          subtitle={`${mentions.length} mentions`}
          icon={Radio}
          color="pink"
          onClick={() => window.location.href = createPageUrl('SocialListening')}
        />
        <MetricCard
          title="Scheduled Posts"
          value={scheduledPosts}
          subtitle={`${brands.length} brands`}
          icon={Calendar}
          color="orange"
          onClick={() => window.location.href = createPageUrl('SocialCalendar')}
        />
        <MetricCard
          title="Active Campaigns"
          value={activeCampaigns}
          subtitle={`${emailCampaigns.length} email campaigns`}
          icon={Mail}
          color="blue"
          onClick={() => window.location.href = createPageUrl('Campaigns')}
        />
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline */}
        <PipelineCard deals={deals} />
        
        {/* SEO Health */}
        <SEOHealthCard 
          websites={websites} 
          keywords={keywords} 
          backlinks={backlinks} 
        />
        
        {/* Social Sentiment */}
        <SocialSentimentCard 
          mentions={mentions} 
          alerts={alerts} 
        />
      </div>

      {/* Content & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Calendar */}
        <ContentCalendarCard 
          posts={calendarPosts} 
          brands={brands} 
        />
        
        {/* Alerts Summary */}
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

      {/* Quick Links / Favorites */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Access</h3>
        <FavoriteLinksManager 
          favorites={favoriteLinks.length > 0 ? favoriteLinks : [
            { page: 'SEOTools', label: 'SEO Tools', icon: 'SEOTools', color: 'bg-blue-500' },
            { page: 'ContentStudio', label: 'Content Studio', icon: 'ContentStudio', color: 'bg-violet-500' },
            { page: 'MarketingHub', label: 'Marketing Hub', icon: 'MarketingHub', color: 'bg-pink-500' },
          ]}
          onUpdate={updateFavoriteLinks}
        />
      </div>
    </div>
  );
}