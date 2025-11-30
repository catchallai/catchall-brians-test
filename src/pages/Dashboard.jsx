import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from '@/components/crm/StatsCard';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import AlertsSummary from '@/components/dashboard/AlertsSummary';
import QuickActions from '@/components/dashboard/QuickActions';
import SocialStats from '@/components/dashboard/SocialStats';
import UpcomingPosts from '@/components/dashboard/UpcomingPosts';
import BrandOverview from '@/components/dashboard/BrandOverview';
import { Users, Building2, DollarSign, TrendingUp, Target, Search, Link2, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 100),
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 100),
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['dashboard-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 50),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => base44.entities.ListeningAlert.filter({ is_dismissed: false }, '-created_date', 10),
  });

  const { data: calendarPosts = [] } = useQuery({
    queryKey: ['dashboard-posts'],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 20),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 50),
  });

  const isLoading = loadingContacts || loadingCompanies || loadingDeals || loadingWebsites || loadingKeywords;

  const totalPipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonDealsValue = deals
    .filter(d => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const avgSEOScore = websites.length > 0 
    ? Math.round(websites.reduce((sum, w) => sum + (w.seo_score || 0), 0) / websites.length)
    : 0;

  const topRankingKeywords = keywords.filter(k => k.current_position && k.current_position <= 10).length;

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const dealsByStage = [
    { name: 'Lead', value: deals.filter(d => d.stage === 'lead').length, color: '#6366f1' },
    { name: 'Qualified', value: deals.filter(d => d.stage === 'qualified').length, color: '#8b5cf6' },
    { name: 'Proposal', value: deals.filter(d => d.stage === 'proposal').length, color: '#a855f7' },
    { name: 'Negotiation', value: deals.filter(d => d.stage === 'negotiation').length, color: '#d946ef' },
    { name: 'Won', value: deals.filter(d => d.stage === 'won').length, color: '#10b981' },
    { name: 'Lost', value: deals.filter(d => d.stage === 'lost').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const contactsByStatus = [
    { name: 'Leads', value: contacts.filter(c => c.status === 'lead').length, color: '#6366f1' },
    { name: 'Prospects', value: contacts.filter(c => c.status === 'prospect').length, color: '#f59e0b' },
    { name: 'Customers', value: contacts.filter(c => c.status === 'customer').length, color: '#10b981' },
    { name: 'Churned', value: contacts.filter(c => c.status === 'churned').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
            <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here's what's happening with your business.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Contacts"
          value={contacts.length}
          icon={Users}
          color="blue"
          change="+12%"
          changeType="up"
        />
        <StatsCard
          title="Companies"
          value={companies.length}
          icon={Building2}
          color="purple"
        />
        <StatsCard
          title="Pipeline Value"
          value={formatCurrency(totalPipelineValue)}
          icon={Target}
          color="orange"
          change="+8%"
          changeType="up"
        />
        <StatsCard
          title="Won Revenue"
          value={formatCurrency(wonDealsValue)}
          icon={DollarSign}
          color="green"
          change="+24%"
          changeType="up"
        />
      </div>

      {/* SEO Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tracked Websites"
          value={websites.length}
          icon={Search}
          color="blue"
        />
        <StatsCard
          title="Total Keywords"
          value={keywords.length}
          icon={Target}
          color="purple"
        />
        <StatsCard
          title="Top 10 Rankings"
          value={topRankingKeywords}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Avg SEO Score"
          value={avgSEOScore || '-'}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals by Stage */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Deals by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {dealsByStage.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dealsByStage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dealsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {dealsByStage.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No deals yet. <Link to={createPageUrl('Deals')} className="text-violet-600 dark:text-violet-400 ml-1 hover:underline">Add your first deal</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts by Status */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Contacts by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {contactsByStatus.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contactsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {contactsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {contactsByStatus.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No contacts yet. <Link to={createPageUrl('Contacts')} className="text-violet-600 dark:text-violet-400 ml-1 hover:underline">Add your first contact</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Brands & Upcoming Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BrandOverview brands={brands} posts={calendarPosts} />
                <UpcomingPosts posts={calendarPosts} brands={brands} />
              </div>

              {/* Social Stats */}
              <SocialStats mentions={mentions} posts={calendarPosts} />

              {/* Activity & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed contacts={contacts} deals={deals} mentions={mentions} />
        <AlertsSummary alerts={alerts} keywords={keywords} mentions={mentions} />
      </div>
    </div>
  );
}