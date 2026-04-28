import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function EmailAnalyticsDashboard({ businessId }) {
  const [timeRange, setTimeRange] = useState('all'); // all, 7d, 30d, 90d

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns', businessId],
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      return await base44.entities.EmailCampaign.list('-created_date', 500);
    },
    enabled: !!businessId,
  });

  // Filter by time range
  const filteredCampaigns = useMemo(() => {
    const filterDate = new Date();

    switch (timeRange) {
      case '7d':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(filterDate.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(filterDate.getDate() - 90);
        break;
      default:
        return emailCampaigns;
    }

    return emailCampaigns.filter((c) => new Date(c.created_date) >= filterDate);
  }, [emailCampaigns, timeRange]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
    const totalOpened = filteredCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
    const totalClicked = filteredCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
    const totalBounced = filteredCampaigns.reduce((sum, c) => sum + (c.total_bounced || 0), 0);

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const conversionRate = totalClicked > 0 ? ((totalClicked * 0.05) / totalSent) * 100 : 0; // Estimated

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate,
      clickRate,
      bounceRate,
      conversionRate,
      campaignsCount: filteredCampaigns.length,
    };
  }, [filteredCampaigns]);

  // Trend data (by week)
  const trendData = useMemo(() => {
    const weeks = {};
    filteredCampaigns.forEach((campaign) => {
      const date = new Date(campaign.created_date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, sent: 0, opened: 0, clicked: 0, bounced: 0 };
      }
      weeks[weekKey].sent += campaign.total_sent || 0;
      weeks[weekKey].opened += campaign.total_opened || 0;
      weeks[weekKey].clicked += campaign.total_clicked || 0;
      weeks[weekKey].bounced += campaign.total_bounced || 0;
    });

    return Object.values(weeks).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [filteredCampaigns]);

  // Campaign performance table
  const campaignPerformance = useMemo(() => {
    return filteredCampaigns
      .map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        sent: campaign.total_sent || 0,
        opened: campaign.total_opened || 0,
        clicked: campaign.total_clicked || 0,
        bounced: campaign.total_bounced || 0,
        openRate:
          campaign.total_sent > 0
            ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)
            : 0,
        clickRate:
          campaign.total_sent > 0
            ? ((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)
            : 0,
        bounceRate:
          campaign.total_sent > 0
            ? ((campaign.total_bounced / campaign.total_sent) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.sent - a.sent);
  }, [filteredCampaigns]);

  // Status distribution
  const statusData = [
    { name: 'Sent', value: metrics.totalSent - metrics.totalBounced, color: '#8b5cf6' },
    { name: 'Bounced', value: metrics.totalBounced, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['all', '7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {range === 'all' ? 'All Time' : range}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open Rate"
          value={metrics.openRate.toFixed(1)}
          unit="%"
          icon={<ArrowUpRight className="w-4 h-4" />}
        />
        <MetricCard
          title="Click Rate"
          value={metrics.clickRate.toFixed(1)}
          unit="%"
          icon={<ArrowUpRight className="w-4 h-4" />}
        />
        <MetricCard
          title="Bounce Rate"
          value={metrics.bounceRate.toFixed(1)}
          unit="%"
          icon={<ArrowDownRight className="w-4 h-4 text-red-500" />}
        />
        <MetricCard
          title="Est. Conversion"
          value={metrics.conversionRate.toFixed(1)}
          unit="%"
          icon={<ArrowUpRight className="w-4 h-4" />}
        />
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Campaign Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#8b5cf6" name="Sent" />
                    <Line type="monotone" dataKey="opened" stroke="#10b981" name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke="#3b82f6" name="Clicked" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {campaignPerformance.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Campaign</th>
                      <th className="text-right py-3 px-4 font-medium">Sent</th>
                      <th className="text-right py-3 px-4 font-medium">Opened</th>
                      <th className="text-right py-3 px-4 font-medium">Open Rate</th>
                      <th className="text-right py-3 px-4 font-medium">Clicked</th>
                      <th className="text-right py-3 px-4 font-medium">Click Rate</th>
                      <th className="text-right py-3 px-4 font-medium">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformance.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4">{campaign.name}</td>
                        <td className="text-right py-3 px-4">{campaign.sent}</td>
                        <td className="text-right py-3 px-4">{campaign.opened}</td>
                        <td className="text-right py-3 px-4 text-emerald-600 font-medium">
                          {campaign.openRate}%
                        </td>
                        <td className="text-right py-3 px-4">{campaign.clicked}</td>
                        <td className="text-right py-3 px-4 text-blue-600 font-medium">
                          {campaign.clickRate}%
                        </td>
                        <td className="text-right py-3 px-4 text-red-600 font-medium">
                          {campaign.bounceRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">No campaigns yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Email Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {metrics.totalSent > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalSent}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Opened</p>
            <p className="text-2xl font-bold text-emerald-600">{metrics.totalOpened}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicked</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.totalClicked}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Campaigns</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.campaignsCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, unit, icon }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
              {unit}
            </p>
          </div>
          <div className="text-violet-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
