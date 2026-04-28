import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowUp,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Users,
  Heart,
  BarChart3,
} from 'lucide-react';

export default function ComparativeReportCard({ report, yourBrandName, competitorName }) {
  if (!report?.comparative_data) {
    return null;
  }

  const { comparative_data } = report;
  const yourMetrics = comparative_data.your_metrics || {};
  const compMetrics = comparative_data.competitor_metrics || {};

  const metrics = [
    {
      label: 'Followers',
      yours: yourMetrics.followers,
      theirs: compMetrics.followers,
      format: 'number',
      icon: Users,
    },
    {
      label: 'Engagement Rate',
      yours: yourMetrics.engagement_rate,
      theirs: compMetrics.engagement_rate,
      format: 'percent',
      icon: Heart,
    },
    {
      label: 'Posts/Week',
      yours: yourMetrics.posts_per_week,
      theirs: compMetrics.posts_per_week,
      format: 'number',
      icon: BarChart3,
    },
    {
      label: 'Avg Likes',
      yours: yourMetrics.avg_likes,
      theirs: compMetrics.avg_likes,
      format: 'number',
      icon: Heart,
    },
    {
      label: 'Sentiment Score',
      yours: yourMetrics.sentiment_score,
      theirs: compMetrics.sentiment_score,
      format: 'score',
      icon: TrendingUp,
    },
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    if (format === 'score') {
      return `${value}/100`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getComparison = (yours, theirs) => {
    if (yours === null || yours === undefined || theirs === null || theirs === undefined) {
      return 'neutral';
    }
    if (yours > theirs) {
      return 'winning';
    }
    if (yours < theirs) {
      return 'losing';
    }
    return 'neutral';
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-500" />
          Comparative Analysis: {yourBrandName || 'Your Brand'} vs {competitorName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Comparison */}
        <div className="space-y-3">
          {metrics.map((metric, i) => {
            const comparison = getComparison(metric.yours, metric.theirs);
            const Icon = metric.icon;
            return (
              <div key={i} className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right">
                  <span
                    className={`font-bold ${comparison === 'winning' ? 'text-emerald-600' : comparison === 'losing' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}
                  >
                    {formatValue(metric.yours, metric.format)}
                  </span>
                  {comparison === 'winning' && (
                    <ArrowUp className="w-3 h-3 inline ml-1 text-emerald-500" />
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Icon className="w-3 h-3" />
                    {metric.label}
                  </div>
                </div>
                <div className="text-left">
                  <span
                    className={`font-bold ${comparison === 'losing' ? 'text-emerald-600' : comparison === 'winning' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}
                  >
                    {formatValue(metric.theirs, metric.format)}
                  </span>
                  {comparison === 'losing' && (
                    <ArrowUp className="w-3 h-3 inline ml-1 text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-t pt-2">
          <div className="text-right">{yourBrandName || 'Your Brand'}</div>
          <div className="text-center">Metric</div>
          <div className="text-left">{competitorName}</div>
        </div>

        {/* Areas You Lead */}
        {comparative_data.areas_you_lead?.length > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">
                Where You Lead
              </span>
            </div>
            <ul className="space-y-1">
              {comparative_data.areas_you_lead.map((area, i) => (
                <li
                  key={i}
                  className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2"
                >
                  <span className="text-emerald-500 mt-1">✓</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to Improve */}
        {comparative_data.areas_to_improve?.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400 text-sm">
                Areas to Improve
              </span>
            </div>
            <ul className="space-y-1">
              {comparative_data.areas_to_improve.map((area, i) => (
                <li
                  key={i}
                  className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
                >
                  <span className="text-amber-500 mt-1">!</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Opportunities */}
        {comparative_data.strategic_opportunities?.length > 0 && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-600" />
              <span className="font-medium text-violet-700 dark:text-violet-400 text-sm">
                Strategic Opportunities
              </span>
            </div>
            <ul className="space-y-1">
              {comparative_data.strategic_opportunities.map((opp, i) => (
                <li
                  key={i}
                  className="text-sm text-violet-700 dark:text-violet-300 flex items-start gap-2"
                >
                  <span className="text-violet-500 mt-1">→</span>
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comparison Insights */}
        {comparative_data.comparison_insights?.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Key Insights</p>
            <ul className="space-y-1">
              {comparative_data.comparison_insights.map((insight, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
