import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  Calendar,
  FileText,
  Lightbulb,
  MessageSquare,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';

const severityConfig = {
  critical: {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
    textColor: 'text-red-700',
  },
  high: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertTriangle,
    textColor: 'text-orange-700',
  },
  medium: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    textColor: 'text-amber-700',
  },
  low: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle,
    textColor: 'text-blue-700',
  },
};

export default function CompetitorReportModal({ open, onClose, report, competitorName }) {
  if (!report) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            {competitorName} - {report.report_type === 'daily' ? 'Daily' : 'Weekly'} Report
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {report.period_start && report.period_end && (
              <span>
                {format(new Date(report.period_start), 'MMM d')} -{' '}
                {format(new Date(report.period_end), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Executive Summary */}
            {report.summary && (
              <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
                  <p className="text-sm text-gray-700">{report.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {report.alerts?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Alerts & Threats ({report.alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.alerts.map((alert, i) => {
                    const config = severityConfig[alert.severity] || severityConfig.low;
                    const Icon = config.icon;
                    return (
                      <div key={i} className={`p-3 rounded-lg border ${config.color}`}>
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.textColor}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{alert.title}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {alert.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Key Metrics */}
            {report.metrics && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Follower Change</p>
                      <p
                        className={`text-lg font-bold ${report.metrics.follower_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {report.metrics.follower_change >= 0 ? '+' : ''}
                        {report.metrics.follower_change?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-400">
                        ({report.metrics.follower_change_percent >= 0 ? '+' : ''}
                        {report.metrics.follower_change_percent?.toFixed(1) || 0}%)
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Engagement Change</p>
                      <p
                        className={`text-lg font-bold ${report.metrics.engagement_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {report.metrics.engagement_change >= 0 ? '+' : ''}
                        {report.metrics.engagement_change?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Posts Published</p>
                      <p className="text-lg font-bold text-gray-900">
                        {report.metrics.posts_count || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Avg. Engagement</p>
                      <div className="flex justify-center gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3" />
                          {report.metrics.avg_likes || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {report.metrics.avg_comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sentiment Analysis */}
            {report.sentiment_analysis && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-blue-500" />
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Overall:</span>
                      <Badge
                        className={`capitalize ${
                          report.sentiment_analysis.overall === 'positive'
                            ? 'bg-emerald-100 text-emerald-700'
                            : report.sentiment_analysis.overall === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        } border-0`}
                      >
                        {report.sentiment_analysis.overall}
                      </Badge>
                      {report.sentiment_analysis.sentiment_shift && (
                        <span className="text-xs text-gray-500">
                          Shift: {report.sentiment_analysis.sentiment_shift}
                        </span>
                      )}
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-400 h-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${report.sentiment_analysis.positive_percent || 0}%` }}
                      >
                        {report.sentiment_analysis.positive_percent > 15 &&
                          `${report.sentiment_analysis.positive_percent}%`}
                      </div>
                      <div
                        className="bg-gray-300 h-full flex items-center justify-center text-xs text-gray-600 font-medium"
                        style={{ width: `${report.sentiment_analysis.neutral_percent || 0}%` }}
                      >
                        {report.sentiment_analysis.neutral_percent > 15 &&
                          `${report.sentiment_analysis.neutral_percent}%`}
                      </div>
                      <div
                        className="bg-red-400 h-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${report.sentiment_analysis.negative_percent || 0}%` }}
                      >
                        {report.sentiment_analysis.negative_percent > 15 &&
                          `${report.sentiment_analysis.negative_percent}%`}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Positive
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span> Neutral
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span> Negative
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Trends */}
            {report.content_trends?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Content Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.content_trends.map((trend, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {trend.topic}
                          </Badge>
                          <span className="text-xs text-gray-500">{trend.frequency} posts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {trend.engagement} avg engagement
                          </span>
                          {trend.trend === 'up' && (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          )}
                          {trend.trend === 'down' && (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          {trend.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Posts */}
            {report.top_posts?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Top Performing Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.top_posts.map((post, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {post.platform}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {post.engagement?.toLocaleString()} engagements
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-amber-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
