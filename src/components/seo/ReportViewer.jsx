import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Globe, Search, Link2, Activity } from 'lucide-react';
import moment from 'moment';

export default function ReportViewer({ onClose, report }) {
  if (!report?.report_data) {
    return null;
  }

  const data = report.report_data;

  const getTrendIcon = (change) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    }
    if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatChange = (change) => {
    if (!change) {
      return '0%';
    }
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}%`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report.name}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Generated {moment(data.generated_at).format('MMM D, YYYY h:mm A')}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overview */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Performance Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-3 text-center">
                  <Globe className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-2xl font-bold">{data.seo_score || '-'}</p>
                  <p className="text-xs text-gray-500">SEO Score</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getTrendIcon(data.seo_score_change)}
                    <span className="text-xs">{formatChange(data.seo_score_change)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-3 text-center">
                  <Activity className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">
                    {data.organic_traffic?.toLocaleString() || '-'}
                  </p>
                  <p className="text-xs text-gray-500">Monthly Traffic</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getTrendIcon(data.traffic_change)}
                    <span className="text-xs">{formatChange(data.traffic_change)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-3 text-center">
                  <Search className="w-5 h-5 mx-auto text-violet-500 mb-1" />
                  <p className="text-2xl font-bold">{data.total_keywords || '-'}</p>
                  <p className="text-xs text-gray-500">Keywords</p>
                  <p className="text-xs text-emerald-600">{data.top_10_keywords || 0} in top 10</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-3 text-center">
                  <Link2 className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold">{data.total_backlinks || '-'}</p>
                  <p className="text-xs text-gray-500">Backlinks</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getTrendIcon(data.backlinks_change)}
                    <span className="text-xs">{formatChange(data.backlinks_change)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Keywords */}
          {data.top_keywords?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Top Ranking Keywords</h3>
              <div className="space-y-2">
                {data.top_keywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{kw.keyword}</p>
                      <p className="text-xs text-gray-500">
                        {kw.search_volume?.toLocaleString()} monthly searches
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Position {kw.position}</Badge>
                      {kw.change !== 0 && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(-kw.change)}
                          <span
                            className={`text-sm ${kw.change < 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {kw.change < 0 ? `↑${Math.abs(kw.change)}` : `↓${kw.change}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends Summary */}
          {data.trends_summary && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Trends & Insights</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{data.trends_summary}</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
