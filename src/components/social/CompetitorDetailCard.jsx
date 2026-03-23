import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target } from 'lucide-react';

export default function CompetitorDetailCard({ competitor }) {
  if (!competitor) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Strategy Evolution */}
      {competitor.strategy_evolution?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              Strategy Evolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {competitor.strategy_evolution.map((phase, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 w-4 h-4 rounded-full bg-violet-100 border-2 border-violet-500" />
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{phase.period}</span>
                        <Badge variant="outline" className="text-xs">
                          {phase.performance}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{phase.focus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Successful Campaigns */}
      {competitor.successful_campaigns?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Successful Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {competitor.successful_campaigns.map((campaign, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{campaign.name}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {campaign.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Est. reach: {campaign.estimated_reach?.toLocaleString() || 'N/A'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {campaign.key_elements?.map((element, j) => (
                    <Badge key={j} variant="outline" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content Frequency */}
      {competitor.content_frequency && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Posting Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {competitor.content_frequency.posts_per_week || 0}
                </p>
                <p className="text-xs text-gray-500">Posts/Week</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Best Days</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.content_frequency.best_days?.map((day, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
