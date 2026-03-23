import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown } from 'lucide-react';

export default function ChurnRiskPredictor({ contacts = [] }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzePredictiveChurn = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('predictiveChurn', {
        contact_ids: contacts.map((c) => c.id),
      });
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Churn prediction failed:', error);
    }
    setLoading(false);
  };

  const riskColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
  };

  const highRisk = predictions.filter(
    (p) => p.risk_level === 'high' || p.risk_level === 'critical'
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Predictive Churn Analysis
          </span>
          <Button onClick={analyzePredictiveChurn} disabled={loading} size="sm" variant="outline">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Click "Analyze" to run predictive churn analysis
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {predictions
              .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
              .slice(0, 10)
              .map((pred, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pred.contact_name}
                      </p>
                      <Badge className={riskColor[pred.risk_level]}>{pred.risk_level}</Badge>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {pred.churn_risk_score?.toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Risk Factors:</p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                        {pred.primary_risk_factors?.slice(0, 2).map((factor, j) => (
                          <li key={j}>{factor}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Action:</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {pred.recommended_interventions?.[0]}
                      </p>
                    </div>

                    {pred.timeline_to_churn && (
                      <p className="text-gray-600 dark:text-gray-400">
                        ⏱️ ~{pred.timeline_to_churn} days if no action
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {highRisk.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
            <p className="font-semibold text-red-900 dark:text-red-200">
              ⚠️ {highRisk.length} customers at high/critical churn risk - immediate action needed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
