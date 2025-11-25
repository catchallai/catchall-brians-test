import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from '@/components/crm/StatsCard';
import { Users, Building2, DollarSign, TrendingUp, Target, Search, Link2, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
      <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here's what's happening with your business.</p>
      </div>

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
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Deals by Stage</CardTitle>
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
                      <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No deals yet. <Link to={createPageUrl('Deals')} className="text-violet-600 ml-1 hover:underline">Add your first deal</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts by Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contacts by Status</CardTitle>
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
                      <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No contacts yet. <Link to={createPageUrl('Contacts')} className="text-violet-600 ml-1 hover:underline">Add your first contact</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={createPageUrl('Contacts')}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Contacts</span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl('Deals')}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                <Target className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Deals</span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl('SEODashboard')}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">SEO</span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl('Keywords')}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Keywords</span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}