import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, Link2, Search, AlertCircle, Loader2 } from 'lucide-react';
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
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function LiveDataIntegration({ website, onDataFetched }) {
  const [activeSource, setActiveSource] = useState('gsc');
  const [liveData, setLiveData] = useState(null);

  const fetchGSCMutation = useMutation({
    mutationFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28); // Last 28 days

      const result = await base44.functions.invoke('fetchGSCData', {
        website_url: website.url,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      setLiveData(result.data);
      onDataFetched?.({ source: 'gsc', data: result.data });
      return result.data;
    },
  });

  const fetchSemrushMutation = useMutation({
    mutationFn: async () => {
      const domain = new URL(website.url).hostname;

      // Get existing keywords to fetch their data
      const existingKeywords = await base44.entities.Keyword.filter({ website_id: website.id });
      const keywordList = existingKeywords.map((k) => k.keyword).slice(0, 10);

      const result = await base44.functions.invoke('fetchSemrushData', {
        domain: domain,
        keywords: keywordList,
      });

      setLiveData(result.data);
      onDataFetched?.({ source: 'semrush', data: result.data });
      return result.data;
    },
  });

  const fetchAhrefsMutation = useMutation({
    mutationFn: async () => {
      const domain = new URL(website.url).hostname;

      const result = await base44.functions.invoke('fetchAhrefsData', {
        domain: domain,
        target_url: website.url,
      });

      setLiveData(result.data);
      onDataFetched?.({ source: 'ahrefs', data: result.data });
      return result.data;
    },
  });

  const handleRefresh = () => {
    switch (activeSource) {
      case 'gsc':
        fetchGSCMutation.mutate();
        break;
      case 'semrush':
        fetchSemrushMutation.mutate();
        break;
      case 'ahrefs':
        fetchAhrefsMutation.mutate();
        break;
    }
  };

  const isLoading =
    fetchGSCMutation.isPending || fetchSemrushMutation.isPending || fetchAhrefsMutation.isPending;
  const hasError =
    fetchGSCMutation.isError || fetchSemrushMutation.isError || fetchAhrefsMutation.isError;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-violet-600" />
            Live SEO Data
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeSource} onValueChange={setActiveSource}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="gsc">
              <Search className="w-4 h-4 mr-2" />
              Google
            </TabsTrigger>
            <TabsTrigger value="semrush">
              <TrendingUp className="w-4 h-4 mr-2" />
              Semrush
            </TabsTrigger>
            <TabsTrigger value="ahrefs">
              <Link2 className="w-4 h-4 mr-2" />
              Ahrefs
            </TabsTrigger>
          </TabsList>

          {/* Google Search Console */}
          <TabsContent value="gsc" className="space-y-4">
            {!liveData && !isLoading && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  Fetch real-time data from Google Search Console
                </p>
                <Button
                  onClick={() => fetchGSCMutation.mutate()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connect & Fetch Data
                </Button>
              </div>
            )}

            {liveData && activeSource === 'gsc' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {liveData.total_clicks?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {liveData.total_impressions?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Position</p>
                    <p className="text-2xl font-bold text-violet-600">
                      {liveData.avg_position?.toFixed(1)}
                    </p>
                  </div>
                </div>

                {liveData.daily_metrics && liveData.daily_metrics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      28-Day Trend
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={liveData.daily_metrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Top Keywords
                  </h4>
                  <div className="space-y-2">
                    {(liveData.keywords || []).slice(0, 5).map((kw, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span className="text-sm font-medium">{kw.keyword}</span>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>Pos: {kw.position?.toFixed(1)}</span>
                          <span>Clicks: {kw.clicks}</span>
                          <span>CTR: {(kw.ctr * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Semrush */}
          <TabsContent value="semrush" className="space-y-4">
            {!liveData && !isLoading && (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Fetch domain metrics from Semrush</p>
                <Button
                  onClick={() => fetchSemrushMutation.mutate()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Fetch Semrush Data
                </Button>
              </div>
            )}

            {liveData && activeSource === 'semrush' && liveData.domain_metrics && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organic Keywords</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {liveData.domain_metrics.organic_keywords?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organic Traffic</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {liveData.domain_metrics.organic_traffic?.toLocaleString()}
                    </p>
                  </div>
                  {liveData.backlinks && (
                    <>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Authority Score</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {liveData.backlinks.authority_score}
                        </p>
                      </div>
                      <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Backlinks</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {liveData.backlinks.total_backlinks?.toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {liveData.keywords && liveData.keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Keyword Rankings
                    </h4>
                    <div className="space-y-2">
                      {liveData.keywords.map((kw, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="text-sm font-medium">{kw.keyword}</span>
                          <div className="flex gap-3 text-xs">
                            <Badge variant="outline">Pos {kw.position}</Badge>
                            <span className="text-gray-500">
                              Vol: {kw.search_volume?.toLocaleString()}
                            </span>
                            <span className="text-gray-500">KD: {kw.difficulty}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Ahrefs */}
          <TabsContent value="ahrefs" className="space-y-4">
            {!liveData && !isLoading && (
              <div className="text-center py-8">
                <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Fetch backlink data from Ahrefs</p>
                <Button
                  onClick={() => fetchAhrefsMutation.mutate()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Fetch Ahrefs Data
                </Button>
              </div>
            )}

            {liveData && activeSource === 'ahrefs' && liveData.domain_metrics && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Domain Rating</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {liveData.domain_metrics.domain_rating}
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Backlinks</p>
                    <p className="text-2xl font-bold text-violet-600">
                      {liveData.domain_metrics.backlinks?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ref Domains</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {liveData.domain_metrics.referring_domains?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organic Traffic</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {liveData.domain_metrics.organic_traffic?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {liveData.backlinks && liveData.backlinks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Top Backlinks (DR)
                    </h4>
                    <div className="space-y-2">
                      {liveData.backlinks.slice(0, 5).map((bl, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-600">
                              {bl.source_domain}
                            </span>
                            <Badge
                              className={
                                bl.is_dofollow
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-700'
                              }
                            >
                              {bl.link_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            DR: {bl.domain_rating} • {bl.anchor_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {hasError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Failed to fetch data. Check API credentials and try again.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
