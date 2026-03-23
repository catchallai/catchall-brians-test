import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  AlertTriangle,
  Target,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const riskColors = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-600 text-white',
};

export default function SalesForecastCard({ forecast, onGenerate, isGenerating }) {
  const [period, setPeriod] = useState('this_month');

  const probabilityColor = (prob) => {
    if (prob >= 80) {
      return '#10b981';
    }
    if (prob >= 60) {
      return '#3b82f6';
    }
    if (prob >= 40) {
      return '#f59e0b';
    }
    return '#ef4444';
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          Sales Forecast
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="next_month">Next Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="next_quarter">Next Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => onGenerate(period)}
            disabled={isGenerating}
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Forecast
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!forecast ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No forecast generated yet</p>
            <p className="text-gray-400 text-sm">
              Click "Generate Forecast" to analyze your pipeline
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue Prediction */}
            <div className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Revenue</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ${forecast.predicted_revenue?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-2">
                    {forecast.confidence_score}% Confidence
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    {forecast.trends?.revenue_trend === 'up' ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Trending Up
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" /> Trending Down
                      </>
                    )}
                  </div>
                </div>
              </div>

              {forecast.trends && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-600">Conversion Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {forecast.trends.conversion_rate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Deal Size</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${forecast.trends.avg_deal_size?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Sales Cycle</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {forecast.trends.sales_cycle_days} days
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Deal Probabilities */}
            {forecast.deal_probabilities?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Deal Close Probabilities
                </h4>
                <div className="space-y-2">
                  {forecast.deal_probabilities.slice(0, 5).map((deal, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{deal.deal_name}</p>
                          <p className="text-xs text-gray-600">{deal.current_stage}</p>
                        </div>
                        <Badge className={`${riskColors[deal.risk_level]} border-0 text-xs`}>
                          {deal.close_probability}% likely
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">
                          Value: ${deal.value?.toLocaleString()}
                        </span>
                        {deal.predicted_close_date && (
                          <span className="text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(deal.predicted_close_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {deal.recommendation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                          <p className="font-medium text-blue-700 mb-1">Recommendation:</p>
                          <p>{deal.recommendation}</p>
                        </div>
                      )}

                      {/* Probability Bar */}
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${deal.close_probability}%`,
                            backgroundColor: probabilityColor(deal.close_probability),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {forecast.risks?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Identified Risks
                </h4>
                <div className="space-y-2">
                  {forecast.risks.map((risk, i) => (
                    <div key={i} className="border border-red-200 bg-red-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm text-gray-900">{risk.type}</p>
                        <Badge className={`${riskColors[risk.severity]} border-0 text-xs`}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">{risk.description}</p>
                      {risk.impact_amount > 0 && (
                        <p className="text-xs text-red-600 font-medium mb-2">
                          Potential Impact: ${risk.impact_amount.toLocaleString()}
                        </p>
                      )}
                      <div className="p-2 bg-white rounded text-xs">
                        <p className="font-medium text-gray-700 mb-1">Mitigation:</p>
                        <p className="text-gray-600">{risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {forecast.opportunities?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Growth Opportunities
                </h4>
                <div className="space-y-2">
                  {forecast.opportunities.map((opp, i) => (
                    <div key={i} className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900 mb-1">{opp.type}</p>
                      <p className="text-xs text-gray-700 mb-2">{opp.description}</p>
                      {opp.potential_value > 0 && (
                        <p className="text-xs text-emerald-600 font-medium mb-2">
                          Potential Value: ${opp.potential_value.toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">Action:</span>
                        <span>{opp.action_required}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
