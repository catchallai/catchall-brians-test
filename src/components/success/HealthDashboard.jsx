import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

const healthColors = {
  healthy: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  at_risk: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    bar: 'bg-red-500',
  },
};

const trendIcons = {
  improving: { icon: TrendingUp, color: 'text-emerald-500' },
  stable: { icon: Minus, color: 'text-gray-500' },
  declining: { icon: TrendingDown, color: 'text-red-500' },
};

export default function HealthDashboard({ healthScores, contacts }) {
  const [selectedHealth, setSelectedHealth] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredScores =
    filter === 'all' ? healthScores : healthScores.filter((h) => h.health_status === filter);

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({healthScores.length})
        </Button>
        <Button
          variant={filter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('critical')}
          className={filter === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          Critical ({healthScores.filter((h) => h.health_status === 'critical').length})
        </Button>
        <Button
          variant={filter === 'at_risk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('at_risk')}
          className={filter === 'at_risk' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          At Risk ({healthScores.filter((h) => h.health_status === 'at_risk').length})
        </Button>
        <Button
          variant={filter === 'healthy' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('healthy')}
          className={filter === 'healthy' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          Healthy ({healthScores.filter((h) => h.health_status === 'healthy').length})
        </Button>
      </div>

      {/* Health Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScores.map((health) => {
          const contact = contacts.find((c) => c.id === health.contact_id);
          const colors = healthColors[health.health_status] || healthColors.healthy;
          const TrendIcon = trendIcons[health.trend]?.icon || Minus;
          const trendColor = trendIcons[health.trend]?.color || 'text-gray-500';
          const isExpanded = selectedHealth?.id === health.id;

          return (
            <Card key={health.id} className="glass-card hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {contact?.first_name} {contact?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact?.company || 'No company'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${colors.bg} ${colors.text} border-0 font-bold`}>
                      {health.health_score}/100
                    </Badge>
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  </div>
                </div>

                <Progress value={health.health_score} className="h-2 mb-3" />

                <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {health.usage_score}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Usage</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {health.engagement_score}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Engage</p>
                  </div>
                  <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                    <p className="font-semibold text-violet-700 dark:text-violet-300">
                      {health.satisfaction_score}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">CSAT</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      {health.support_score}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Support</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedHealth(isExpanded ? null : health)}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </Button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {/* Risk Factors */}
                    {health.risk_factors?.length > 0 && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Risk Factors:
                        </p>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {health.risk_factors.map((risk, i) => (
                            <li key={i}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Positive Signals */}
                    {health.positive_signals?.length > 0 && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Positive Signals:
                        </p>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {health.positive_signals.map((signal, i) => (
                            <li key={i}>• {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {health.recommended_actions?.length > 0 && (
                      <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                        <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                          Recommended Actions:
                        </p>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {health.recommended_actions.map((action, i) => (
                            <li key={i}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
