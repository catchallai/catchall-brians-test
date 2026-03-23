import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Target, Clock } from 'lucide-react';

export default function TrendAnalysisCard({ insights }) {
  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Emerging Trends */}
      {insights.emerging_trends?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Emerging Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.emerging_trends.map((trend, i) => (
              <div key={i} className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{trend.topic}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    +{trend.growth_rate}% growth
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Predicted peak: {trend.predicted_peak}</span>
                </div>
                <Progress value={Math.min(trend.growth_rate, 100)} className="h-1 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Viral Predictions */}
      {insights.viral_predictions?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Viral Potential Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.viral_predictions.map((prediction, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{prediction.content_type}</span>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-violet-500" />
                    <span
                      className={`text-sm font-bold ${
                        prediction.viral_score >= 80
                          ? 'text-emerald-600'
                          : prediction.viral_score >= 60
                            ? 'text-amber-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {prediction.viral_score}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{prediction.reasoning}</p>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      prediction.viral_score >= 80
                        ? 'bg-emerald-500'
                        : prediction.viral_score >= 60
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
                    }`}
                    style={{ width: `${prediction.viral_score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
