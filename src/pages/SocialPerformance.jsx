import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SocialPerformance() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['marketing-metrics'],
    queryFn: () => base44.entities.MarketingMetrics.list('-date', 90),
  });

  const { data: audiences = [] } = useQuery({
    queryKey: ['social-audiences', selectedAccount?.id],
    queryFn: () =>
      selectedAccount
        ? base44.entities.SocialAudience.filter({ social_account_id: selectedAccount.id })
        : [],
    enabled: !!selectedAccount?.id,
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['social-mentions'],
    queryFn: () => base44.entities.SocialMention.list('-mentioned_date', 50),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('analyzeSocialAudience', {
        social_account_id: selectedAccount.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-audiences'] });
    },
  });

  const monitorMutation = useMutation({
    mutationFn: async () => {
      // Get company name from first company
      const companies = await base44.entities.Company.list('-created_date', 1);
      await base44.functions.invoke('monitorBrandMentions', {
        brand_name: companies[0]?.name || 'Brand',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-mentions'] });
    },
  });

  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0);
  const totalConversions = metrics.reduce((sum, m) => sum + (m.social_conversions || 0), 0);
  const totalRevenue = metrics.reduce((sum, m) => sum + (m.social_revenue || 0), 0);
  const negativeMentions = mentions.filter((m) => m.sentiment === 'negative').length;
  const audience = audiences[0];

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Social Media Performance
        </h1>
        <p className="text-gray-500 mt-1">Attribution, audience insights, and brand monitoring</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Followers</p>
            <p className="text-3xl font-bold text-violet-600">
              {(totalFollowers / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Social Conversions</p>
            <p className="text-3xl font-bold text-emerald-600">
              {totalConversions.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Social Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ${(totalRevenue / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Negative Mentions</p>
            <p className="text-3xl font-bold text-red-600">{negativeMentions}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-4">
          {metrics.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Social ROI Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="social_conversions"
                      stroke="#8b5cf6"
                      name="Conversions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="social_roi"
                      stroke="#10b981"
                      name="ROI %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Channel Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Organic Traffic</span>
                    <span className="text-sm">
                      {metrics[metrics.length - 1]?.organic_traffic || 0}
                    </span>
                  </div>
                  <div className="bg-violet-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-violet-600 h-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Social Traffic</span>
                    <span className="text-sm">
                      {metrics[metrics.length - 1]?.social_traffic || 0}
                    </span>
                  </div>
                  <div className="bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {accounts.slice(0, 3).map((account) => (
              <Card
                key={account.id}
                className={`glass-card cursor-pointer transition-all ${selectedAccount?.id === account.id ? 'ring-2 ring-violet-500' : ''}`}
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="pt-6">
                  <p className="font-semibold">{account.platform}</p>
                  <p className="text-sm text-gray-500">@{account.account_name}</p>
                  <p className="text-2xl font-bold mt-2">
                    {(account.followers_count / 1000).toFixed(1)}K
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedAccount && (
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="gap-2"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" /> Analyze Audience
                </>
              )}
            </Button>
          )}

          {audience && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Demographics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Top Countries
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {audience.demographics?.top_countries?.map((country) => (
                        <Badge key={country} variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Growth Rate
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      +{audience.follower_growth_rate}%/mo
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Interests & Behaviors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Top Interests
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {audience.interests?.slice(0, 4).map((interest) => (
                        <Badge key={interest} className="bg-violet-100 text-violet-800">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Button
            onClick={() => monitorMutation.mutate()}
            disabled={monitorMutation.isPending}
            className="gap-2"
          >
            {monitorMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" /> Scan Mentions
              </>
            )}
          </Button>

          {mentions.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Mentions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mentions.slice(0, 8).map((mention) => (
                  <div
                    key={mention.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {mention.author}
                      </p>
                      <Badge
                        className={`${
                          mention.sentiment === 'positive'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mention.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mention.sentiment}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {mention.mention_text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mention.source} • {mention.reach?.toLocaleString()} reach
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
