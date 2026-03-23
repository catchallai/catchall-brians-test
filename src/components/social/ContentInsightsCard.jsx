import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Hash, Lightbulb } from 'lucide-react';

export default function ContentInsightsCard({ insights }) {
  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Trending Topics */}
      {insights.trending_topics?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.trending_topics.map((topic, i) => (
                <Badge key={i} className="bg-violet-100 text-violet-700 border-0">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Posting Times */}
      {insights.optimal_times?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Best Times to Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {insights.optimal_times.slice(0, 4).map((time, i) => (
                <div key={i} className="p-2 bg-emerald-50 rounded-lg text-center">
                  <p className="font-medium text-emerald-700">{time.day}</p>
                  <p className="text-sm text-emerald-600">{time.time}</p>
                  <p className="text-xs text-gray-500">{time.engagement_score}% engagement</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag Suggestions */}
      {insights.hashtag_suggestions?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" />
              Recommended Hashtags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.hashtag_suggestions.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Recommendations */}
      {insights.content_recommendations?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Content Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.content_recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
