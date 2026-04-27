import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function MarketingDashboard() {
  const { data: metrics = [] } = useQuery({
    queryKey: ['marketing-metrics'],
    queryFn: () => base44.entities.MarketingMetrics.list('-date', 90),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 100),
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date', 100),
  });

  // Calculate totals
  const latestMetrics = metrics[metrics.length - 1] || {};
  const totalOrganic = metrics.reduce((sum, m) => sum + (m.organic_revenue || 0), 0);
  const totalSocial = metrics.reduce((sum, m) => sum + (m.social_revenue || 0), 0);

  const channelData = [
    { name: 'Organic', value: totalOrganic, fill: '#8b5cf6' },
    { name: 'Social', value: totalSocial, fill: '#10b981' },
  ];

  const topKeywords = keywords
    .sort((a, b) => (b.current_position || 999) - (a.current_position || 999))
    .slice(0, 5);

  const topPosts = socialPosts
    .sort(
      (a, b) =>
        (b.likes || 0) +
        (b.comments || 0) +
        (b.shares || 0) -
        ((a.likes || 0) + (a.comments || 0) + (a.shares || 0))
    )
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Unified Marketing Dashboard
        </h1>
        <p className="text-gray-500 mt-1">SEO and Social performance across all channels</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Organic Traffic</p>
            <p className="text-3xl font-bold text-violet-600">
              {latestMetrics.organic_traffic?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ROI: {latestMetrics.organic_roi?.toFixed(0) || 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Social Traffic</p>
            <p className="text-3xl font-bold text-emerald-600">
              {latestMetrics.social_traffic?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ROI: {latestMetrics.social_roi?.toFixed(0) || 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Organic Revenue</p>
            <p className="text-3xl font-bold text-violet-600">
              ${(totalOrganic / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Social Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">
              ${(totalSocial / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="posts">Top Posts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="organic_revenue"
                      stroke="#8b5cf6"
                      name="Organic"
                    />
                    <Line type="monotone" dataKey="social_revenue" stroke="#10b981" name="Social" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Organic',
                      traffic: latestMetrics.organic_traffic || 0,
                      conversions: latestMetrics.organic_conversions || 0,
                    },
                    {
                      name: 'Social',
                      traffic: latestMetrics.social_traffic || 0,
                      conversions: latestMetrics.social_conversions || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="traffic" fill="#8b5cf6" name="Traffic" />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Organic (SEO)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Traffic</p>
                      <p className="text-2xl font-bold">
                        {latestMetrics.organic_traffic?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversions</p>
                      <p className="text-2xl font-bold">
                        {latestMetrics.organic_conversions?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {latestMetrics.organic_traffic
                          ? (
                              ((latestMetrics.organic_conversions || 0) /
                                latestMetrics.organic_traffic) *
                              100
                            ).toFixed(2)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {latestMetrics.organic_roi?.toFixed(0) || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Social Media</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Traffic</p>
                      <p className="text-2xl font-bold">
                        {latestMetrics.social_traffic?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversions</p>
                      <p className="text-2xl font-bold">
                        {latestMetrics.social_conversions?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {latestMetrics.social_traffic
                          ? (
                              ((latestMetrics.social_conversions || 0) /
                                latestMetrics.social_traffic) *
                              100
                            ).toFixed(2)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {latestMetrics.social_roi?.toFixed(0) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top Ranking Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Keyword</th>
                      <th className="text-right py-2 px-3">Position</th>
                      <th className="text-right py-2 px-3">Volume</th>
                      <th className="text-right py-2 px-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topKeywords.map((kw) => (
                      <tr key={kw.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3">{kw.keyword}</td>
                        <td className="text-right py-2 px-3 font-semibold">
                          #{kw.current_position || 'N/A'}
                        </td>
                        <td className="text-right py-2 px-3">
                          {kw.search_volume?.toLocaleString() || 0}
                        </td>
                        <td className="text-right py-2 px-3">
                          {kw.previous_position && kw.current_position < kw.previous_position ? (
                            <span className="text-emerald-600">
                              ↑ {kw.previous_position - kw.current_position}
                            </span>
                          ) : (
                            <span className="text-gray-500">→</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top Performing Social Posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {post.platform}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>❤️ {(post.likes || 0).toLocaleString()}</span>
                    <span>💬 {(post.comments || 0).toLocaleString()}</span>
                    <span>↗️ {(post.shares || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
