import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Target } from 'lucide-react';

export default function PredictiveInsights({ scores = [] }) {
  if (!scores.length) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center text-gray-500">
          No predictive data available
        </CardContent>
      </Card>
    );
  }

  const highValueLeads = scores.filter((s) => s.conversion_probability > 70);
  const atRiskUsers = scores.filter((s) => s.churn_risk > 60);
  const avgConversionProb =
    scores.reduce((sum, s) => sum + (s.conversion_probability || 0), 0) / scores.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">High-Value Leads</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{highValueLeads.length}</p>
            <p className="text-xs text-gray-500 mt-1">&gt;70% conversion probability</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">At-Risk Users</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{atRiskUsers.length}</p>
            <p className="text-xs text-gray-500 mt-1">&gt;60% churn risk</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-medium">Avg Conversion Prob</span>
            </div>
            <p className="text-3xl font-bold text-violet-600">{Math.round(avgConversionProb)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scores.slice(0, 5).map((score, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge
                    className={
                      score.conversion_probability > 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : score.conversion_probability > 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {score.conversion_probability}% likely to convert
                  </Badge>
                  {score.churn_risk > 60 && (
                    <Badge className="bg-red-100 text-red-800 ml-2">High churn risk</Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">Score: {score.engagement_score}</span>
              </div>

              <p className="font-medium text-gray-900 dark:text-white mb-2">
                {score.next_best_action}
              </p>

              {score.factors && score.factors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {score.factors.map((factor, fIdx) => (
                    <Badge key={fIdx} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
