import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

import VisitorTypeCard from '@/components/analytics/VisitorTypeCard';
import TopPagesCard from '@/components/analytics/TopPagesCard';
import UserFlowCard from '@/components/analytics/UserFlowCard';
import EngagementMetricsCard from '@/components/analytics/EngagementMetricsCard';
import ReferralDetailsCard from '@/components/analytics/ReferralDetailsCard';
import BrowserOSCard from '@/components/analytics/BrowserOSCard';
import PeakHoursCard from '@/components/analytics/PeakHoursCard';
import RealTimeCard from '@/components/analytics/RealTimeCard';
import AnalyticsTogglePanel from '@/components/analytics/AnalyticsTogglePanel';
import VisitorProfilesCard from '@/components/analytics/VisitorProfilesCard';
import UserDemographicsCard from '@/components/analytics/UserDemographicsCard';
import SessionInsightsCard from '@/components/analytics/SessionInsightsCard';
import TechnologyStackCard from '@/components/analytics/TechnologyStackCard';
import UserJourneyMapCard from '@/components/analytics/UserJourneyMapCard';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function TrafficAnalytics() {
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [widgetVisibility, setWidgetVisibility] = useState({
    realTime: true,
    visitorType: true,
    topPages: true,
    userFlow: true,
    engagement: true,
    referrals: true,
    browserOS: true,
    peakHours: true,
    visitorProfiles: true,
    demographics: true,
    sessionInsights: true,
    technology: true,
    journeyMap: true,
  });

  const toggleWidget = (key) => {
    setWidgetVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: trafficData = [], isLoading } = useQuery({
    queryKey: ['traffic-data', selectedWebsite, dateRange],
    queryFn: async () => {
      // SyberJet.com traffic data
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

      // Simple seeded random function for consistent data
      const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // SyberJet baseline metrics (realistic for luxury aviation website)
      const baseVisitors = 850;
      const basePageviews = 2400;

      return Array.from({ length: days }, (_, i) => {
        const dateStr = format(subDays(new Date(), days - 1 - i), 'MMM dd');
        const dateSeed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seed = dateSeed + i;

        // Add weekly patterns (higher on weekdays)
        const dayOfWeek = subDays(new Date(), days - 1 - i).getDay();
        const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.7;

        return {
          date: dateStr,
          visitors: Math.floor((baseVisitors + seededRandom(seed) * 400) * weekdayMultiplier),
          pageviews: Math.floor(
            (basePageviews + seededRandom(seed + 1) * 1200) * weekdayMultiplier
          ),
          bounce_rate: Math.floor(seededRandom(seed + 2) * 15) + 28,
          avg_duration: Math.floor(seededRandom(seed + 3) * 120) + 140,
        };
      });
    },
    staleTime: Infinity,
  });

  const totalVisitors = trafficData.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageviews = trafficData.reduce((sum, d) => sum + d.pageviews, 0);
  const avgBounce = trafficData.length
    ? Math.round(trafficData.reduce((sum, d) => sum + d.bounce_rate, 0) / trafficData.length)
    : 0;
  const avgDuration = trafficData.length
    ? Math.round(trafficData.reduce((sum, d) => sum + d.avg_duration, 0) / trafficData.length)
    : 0;

  // Calculate percentage changes by comparing first half vs second half of period
  const calculateChange = (data, key) => {
    if (data.length < 2) {
      return 0;
    }
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d[key], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d[key], 0) / secondHalf.length;

    if (firstAvg === 0) {
      return 0;
    }
    return (((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1);
  };

  const visitorsChange = calculateChange(trafficData, 'visitors');
  const pageviewsChange = calculateChange(trafficData, 'pageviews');
  const bounceChange = calculateChange(trafficData, 'bounce_rate');
  const durationChange = calculateChange(trafficData, 'avg_duration');

  // SyberJet-specific traffic sources
  const trafficSources = [
    { name: 'Organic Search', value: 42, color: '#8b5cf6' },
    { name: 'Direct', value: 28, color: '#06b6d4' },
    { name: 'Social', value: 12, color: '#10b981' },
    { name: 'Referral', value: 11, color: '#f59e0b' },
    { name: 'Paid', value: 7, color: '#ef4444' },
  ];

  // SyberJet audience device breakdown
  const deviceData = [
    { name: 'Desktop', value: 68, icon: Monitor },
    { name: 'Mobile', value: 26, icon: Smartphone },
    { name: 'Tablet', value: 6, icon: Tablet },
  ];

  // SyberJet geographic data (aviation industry focused)
  const regionData = [
    { region: 'United States', visitors: 18500, percentage: 42 },
    { region: 'United Arab Emirates', visitors: 4800, percentage: 11 },
    { region: 'United Kingdom', visitors: 3900, percentage: 9 },
    { region: 'Switzerland', visitors: 3100, percentage: 7 },
    { region: 'Germany', visitors: 2800, percentage: 6 },
    { region: 'Singapore', visitors: 2400, percentage: 5 },
    { region: 'Other', visitors: 8500, percentage: 20 },
  ];

  // SyberJet market overview (private aviation sector)
  const marketOverview = [
    { metric: 'Market Share', value: '8.2%', change: 3.5, trend: 'up' },
    { metric: 'Industry Avg Traffic', value: '32K', change: 4.2, trend: 'up' },
    { metric: 'Private Aviation Growth', value: '+12.4%', change: 2.8, trend: 'up' },
    { metric: 'Brand Ranking', value: '#5', change: 2, trend: 'up' },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Traffic Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Monitor your website traffic and audience insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="All Websites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Websites</SelectItem>
              {websites.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[100px] sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <AnalyticsTogglePanel visibility={widgetVisibility} onToggle={toggleWidget} />
          <Button variant="outline" size="icon" className="shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2 hidden sm:flex">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="icon" className="sm:hidden shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Real-Time + Visitor Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgetVisibility.realTime && <RealTimeCard />}
        {widgetVisibility.visitorType && <VisitorTypeCard />}
        {widgetVisibility.engagement && <EngagementMetricsCard />}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalVisitors.toLocaleString()}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${parseFloat(visitorsChange) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {parseFloat(visitorsChange) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {parseFloat(visitorsChange) >= 0 ? '+' : ''}
                    {visitorsChange}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Page Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalPageviews.toLocaleString()}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${parseFloat(pageviewsChange) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {parseFloat(pageviewsChange) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {parseFloat(pageviewsChange) >= 0 ? '+' : ''}
                    {pageviewsChange}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bounce Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgBounce}%</p>
                <div
                  className={`flex items-center gap-1 text-sm ${parseFloat(bounceChange) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {parseFloat(bounceChange) <= 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  <span>{bounceChange}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${parseFloat(durationChange) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {parseFloat(durationChange) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {parseFloat(durationChange) >= 0 ? '+' : ''}
                    {durationChange}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="trends" className="text-xs sm:text-sm">
            Daily Trends
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs sm:text-sm">
            Traffic Sources
          </TabsTrigger>
          <TabsTrigger value="visitors" className="text-xs sm:text-sm">
            Visitors
          </TabsTrigger>
          <TabsTrigger value="journeys" className="text-xs sm:text-sm">
            User Journeys
          </TabsTrigger>
          <TabsTrigger value="regions" className="text-xs sm:text-sm">
            Regional
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs sm:text-sm">
            Market
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle>Daily Traffic Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#colorPageviews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle>Traffic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={trafficSources}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {trafficSources.map((source) => (
                    <div key={source.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {source.name}
                      </span>
                      <span className="text-sm font-medium ml-auto">{source.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceData.map((device) => (
                    <div key={device.name} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <device.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {device.name}
                          </span>
                          <span className="text-sm text-gray-500">{device.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${device.value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visitors" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {widgetVisibility.visitorProfiles && <VisitorProfilesCard />}
            {widgetVisibility.demographics && <UserDemographicsCard />}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {widgetVisibility.sessionInsights && <SessionInsightsCard />}
            {widgetVisibility.technology && <TechnologyStackCard />}
          </div>
        </TabsContent>

        <TabsContent value="journeys" className="mt-4">
          {widgetVisibility.journeyMap && <UserJourneyMapCard trafficData={trafficData} />}
        </TabsContent>

        <TabsContent value="regions" className="mt-4">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Regional Traffic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {regionData.map((region, index) => (
                  <div key={region.region} className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-medium text-gray-500">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {region.region}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {region.visitors.toLocaleString()} visitors
                          </span>
                          <Badge variant="outline">{region.percentage}%</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${region.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketOverview.map((item) => (
              <Card key={item.metric} className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{item.metric}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <div
                    className={`flex items-center justify-center gap-1 text-sm ${item.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {item.change > 0 ? '+' : ''}
                      {item.change}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {widgetVisibility.topPages && <TopPagesCard />}
        {widgetVisibility.referrals && <ReferralDetailsCard />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {widgetVisibility.userFlow && <UserFlowCard />}
        {widgetVisibility.browserOS && <BrowserOSCard />}
      </div>

      {widgetVisibility.peakHours && <PeakHoursCard />}
    </div>
  );
}
