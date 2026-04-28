import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Loader2, Zap } from 'lucide-react';

export default function SEOAnomalyDetector({ onDetectAnomalies }) {
  const [anomalies, setAnomalies] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetect = async () => {
    setIsDetecting(true);
    const result = await onDetectAnomalies();
    setAnomalies(result);
    setIsDetecting(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            SEO Anomaly Detection
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDetect} disabled={isDetecting}>
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" /> Detect Issues
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!anomalies ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Run detection to find ranking drops, traffic anomalies, and technical issues
            </p>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">All Clear!</p>
            <p className="text-gray-500 text-sm">
              No anomalies detected. Your SEO is performing normally.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      anomaly.severity === 'critical'
                        ? 'text-red-600'
                        : anomaly.severity === 'high'
                          ? 'text-orange-600'
                          : 'text-amber-600'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{anomaly.title}</h4>
                      <Badge
                        className={`text-xs ${
                          anomaly.severity === 'critical'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : anomaly.severity === 'high'
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-amber-100 text-amber-700 border-amber-300'
                        }`}
                      >
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {anomaly.description}
                    </p>
                    {anomaly.recommendation && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-400">
                        💡 {anomaly.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
