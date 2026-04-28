import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Calendar,
  Newspaper,
  Megaphone,
  BarChart3,
  ArrowUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const confidenceColors = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-700',
};

export default function CompetitorInsightsPanel({ competitor }) {
  if (!competitor) {
    return null;
  }

  const getConfidenceLevel = (score) => {
    if (score >= 70) {
      return 'high';
    }
    if (score >= 40) {
      return 'medium';
    }
    return 'low';
  };

  return (
    <div className="space-y-4">
      {/* Content Strategy Analysis */}
      {competitor.content_strategy && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Content Strategy Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {competitor.content_strategy.primary_themes?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Primary Themes</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.content_strategy.primary_themes.map((theme, i) => (
                    <Badge key={i} className="bg-violet-100 text-violet-700 border-0">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {competitor.content_strategy.content_pillars?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Content Pillars</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.content_strategy.content_pillars.map((pillar, i) => (
                    <Badge key={i} variant="outline">
                      {pillar}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {competitor.content_strategy.tone_of_voice && (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Tone of Voice</p>
                  <p className="text-sm font-medium">{competitor.content_strategy.tone_of_voice}</p>
                </div>
              )}
              {competitor.content_strategy.visual_style && (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Visual Style</p>
                  <p className="text-sm font-medium">{competitor.content_strategy.visual_style}</p>
                </div>
              )}
            </div>
            {competitor.content_strategy.cta_patterns?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Common CTAs</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.content_strategy.cta_patterns.slice(0, 4).map((cta, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cta}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predicted Campaigns */}
      {competitor.predicted_campaigns?.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Predicted Upcoming Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {competitor.predicted_campaigns.map((campaign, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg bg-gradient-to-r from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{campaign.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={confidenceColors[getConfidenceLevel(campaign.confidence)]}>
                      {campaign.confidence}% confidence
                    </Badge>
                    <Badge variant="outline">{campaign.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3" />
                  Predicted: {campaign.predicted_launch}
                </div>
                {campaign.signals?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Detection Signals:</p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.signals.map((signal, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {campaign.recommended_response && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded mt-2">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <strong>Recommended Response:</strong> {campaign.recommended_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Industry Benchmark */}
      {competitor.industry_benchmark && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Industry Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: 'Follower Rank',
                  value: competitor.industry_benchmark.follower_percentile,
                  suffix: 'percentile',
                },
                {
                  label: 'Engagement Rank',
                  value: competitor.industry_benchmark.engagement_percentile,
                  suffix: 'percentile',
                },
                {
                  label: 'Growth Rate',
                  value: competitor.industry_benchmark.growth_rate_percentile,
                  suffix: 'percentile',
                },
                {
                  label: 'Content Quality',
                  value: competitor.industry_benchmark.content_quality_score,
                  suffix: '/100',
                },
                {
                  label: 'Brand Strength',
                  value: competitor.industry_benchmark.brand_strength_score,
                  suffix: '/100',
                },
              ]
                .filter((m) => m.value !== null && m.value !== undefined)
                .map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                      <span className="font-medium">
                        {metric.value}
                        {metric.suffix}
                        {metric.suffix === 'percentile' && metric.value >= 75 && (
                          <ArrowUp className="w-3 h-3 inline ml-1 text-emerald-500" />
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          metric.value >= 75
                            ? 'bg-emerald-500'
                            : metric.value >= 50
                              ? 'bg-blue-500'
                              : metric.value >= 25
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              {competitor.industry_benchmark.industry_avg_engagement && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {competitor.industry_benchmark.industry_avg_engagement}%
                    </p>
                    <p className="text-xs text-gray-500">Industry Avg Engagement</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {(competitor.industry_benchmark.industry_avg_followers / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-500">Industry Avg Followers</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News & Press */}
      {(competitor.news_mentions?.length > 0 || competitor.press_releases?.length > 0) && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-500" />
              News & Press Releases
              {competitor.last_news_scan && (
                <span className="text-xs text-gray-400 font-normal ml-auto">
                  Updated: {new Date(competitor.last_news_scan).toLocaleDateString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {competitor.news_mentions?.slice(0, 3).map((news, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {news.category || 'News'}
                      </Badge>
                      <Badge
                        className={
                          news.sentiment === 'positive'
                            ? 'bg-emerald-100 text-emerald-700'
                            : news.sentiment === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {news.sentiment}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {news.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{news.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{news.source}</span>
                      <span>•</span>
                      <span>{news.date}</span>
                    </div>
                  </div>
                  {news.url && (
                    <a href={news.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 text-gray-400 hover:text-violet-600" />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {competitor.press_releases?.slice(0, 2).map((pr, i) => (
              <div
                key={`pr-${i}`}
                className="p-3 border border-violet-200 dark:border-violet-800 rounded-lg bg-violet-50 dark:bg-violet-900/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-violet-600" />
                  <span className="text-xs text-violet-600 font-medium">Press Release</span>
                  <span className="text-xs text-gray-400">{pr.date}</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{pr.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{pr.summary}</p>
                {pr.key_announcements?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pr.key_announcements.map((ann, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {ann}
                      </Badge>
                    ))}
                  </div>
                )}
                {pr.strategic_implications && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                    ⚡ {pr.strategic_implications}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
