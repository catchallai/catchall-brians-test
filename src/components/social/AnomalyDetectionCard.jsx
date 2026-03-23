import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Activity, Zap, CheckCircle } from 'lucide-react';

export default function AnomalyDetectionCard({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            No Anomalies Detected
          </h3>
          <p className="text-sm text-gray-500">
            All metrics are within normal ranges. Your social performance is stable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'engagement_drop':
        return TrendingUp;
      case 'follower_spike':
        return Activity;
      case 'sentiment_shift':
        return AlertTriangle;
      case 'posting_pattern':
        return Zap;
      default:
        return Activity;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly, idx) => {
          const Icon = getTypeIcon(anomaly.type);
          return (
            <div
              key={idx}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{anomaly.title}</h4>
                    <Badge className={`text-xs border ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {anomaly.description}
                  </p>
                  {anomaly.detected_value !== undefined && anomaly.baseline_value !== undefined && (
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <span>Baseline: {anomaly.baseline_value}</span>
                      <span>Current: {anomaly.detected_value}</span>
                      <span className={anomaly.change > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {anomaly.change > 0 ? '+' : ''}
                        {anomaly.change}% change
                      </span>
                    </div>
                  )}
                  {anomaly.recommendation && (
                    <div className="mt-2 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                      <p className="text-xs text-violet-700 dark:text-violet-400">
                        💡 {anomaly.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
