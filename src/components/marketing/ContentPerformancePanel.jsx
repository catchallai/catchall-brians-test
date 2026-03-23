import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Clock, TrendingUp, Link2, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ContentPerformancePanel() {
  const { data: performance = [] } = useQuery({
    queryKey: ['content-performance'],
    queryFn: () => base44.entities.ContentPerformance.list('-pageviews', 50),
  });

  const totalViews = performance.reduce((sum, p) => sum + (p.pageviews || 0), 0);
  const totalConversions = performance.reduce((sum, p) => sum + (p.conversions || 0), 0);
  const totalBacklinks = performance.reduce((sum, p) => sum + (p.backlinks_earned || 0), 0);
  const avgTimeOnPage =
    performance.length > 0
      ? (
          performance.reduce((sum, p) => sum + (p.avg_time_on_page || 0), 0) / performance.length
        ).toFixed(0)
      : 0;

  const chartData = performance.slice(0, 8).map((p) => ({
    name: p.title?.slice(0, 20) + '...',
    views: p.pageviews || 0,
    conversions: p.conversions || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Content Performance</h2>
        <p className="text-sm text-gray-500">
          Track how your content drives traffic and conversions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{totalConversions}</p>
            <p className="text-sm text-gray-500">Conversions</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgTimeOnPage}s</p>
            <p className="text-sm text-gray-500">Avg. Time on Page</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Link2 className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBacklinks}</p>
            <p className="text-sm text-gray-500">Backlinks Earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No performance data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#8b5cf6" name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Content List */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Content Details</CardTitle>
          </CardHeader>
          <CardContent>
            {performance.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No content tracked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {performance.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.pageviews?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.conversions || 0} conv
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {item.social_shares || 0} shares
                      </span>
                    </div>
                    {item.keyword_rankings?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {item.keyword_rankings.slice(0, 2).map((kw, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{kw.position} {kw.keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
