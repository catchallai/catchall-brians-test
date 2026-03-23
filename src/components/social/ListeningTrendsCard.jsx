import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

export default function ListeningTrendsCard({ keywords, mentions }) {
  // Calculate trends from data
  const keywordStats = keywords
    .map((kw) => {
      const kwMentions = mentions.filter((m) => m.listening_id === kw.id);
      const recentMentions = kwMentions.filter((m) => {
        const date = new Date(m.post_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      });

      return {
        keyword: kw.keyword,
        type: kw.type,
        total: kwMentions.length,
        recent: recentMentions.length,
        sentiment: {
          positive: kwMentions.filter((m) => m.sentiment === 'positive').length,
          neutral: kwMentions.filter((m) => m.sentiment === 'neutral').length,
          negative: kwMentions.filter((m) => m.sentiment === 'negative').length,
        },
        avgInfluence:
          kwMentions.length > 0
            ? Math.round(
                kwMentions.reduce((sum, m) => sum + (m.influence_score || 0), 0) / kwMentions.length
              )
            : 0,
        trending: kw.trending_score || 0,
      };
    })
    .sort((a, b) => b.trending - a.trending);

  // Top trending topics from mentions
  const topicCounts = {};
  mentions.forEach((m) => {
    const words = m.content?.toLowerCase().match(/\b\w{4,}\b/g) || [];
    words.forEach((word) => {
      if (
        ![
          'this',
          'that',
          'with',
          'from',
          'have',
          'been',
          'were',
          'they',
          'their',
          'what',
          'when',
          'where',
          'which',
          'would',
          'could',
          'should',
          'about',
          'there',
          'these',
          'those',
          'being',
          'other',
        ].includes(word)
      ) {
        topicCounts[word] = (topicCounts[word] || 0) + 1;
      }
    });
  });
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Keyword Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            Keyword Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {keywordStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No keywords tracked yet</p>
          ) : (
            keywordStats.slice(0, 5).map((stat, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {stat.type === 'hashtag' ? '#' : stat.type === 'mention' ? '@' : ''}
                    {stat.keyword}
                  </span>
                  <div className="flex items-center gap-2">
                    {stat.trending > 50 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : stat.trending < 30 ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {stat.trending} trend
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{stat.total} mentions</span>
                  <span className="text-emerald-600">+{stat.sentiment.positive} positive</span>
                  <span className="text-red-600">-{stat.sentiment.negative} negative</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Discovered Topics */}
      {topTopics.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Discovered Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTopics.map(([topic, count], i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`${i < 3 ? 'bg-violet-50 border-violet-200' : ''}`}
                >
                  {topic} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
