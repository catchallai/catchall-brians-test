import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  Zap,
  Check,
  X,
  Brain,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

const alertConfig = {
  spike: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  negative_sentiment: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  influencer: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  competitor: { icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' },
  viral: { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  anomaly: { icon: Brain, color: 'text-violet-500', bg: 'bg-violet-50' },
  sentiment_shift: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  brand_risk: { icon: Shield, color: 'text-red-500', bg: 'bg-red-50' },
};

const severityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function AlertsPanel({
  alerts,
  mentions = [],
  onMarkRead,
  onDismiss,
  onViewMention,
}) {
  const [filter, setFilter] = useState('all');

  const unreadAlerts = alerts.filter((a) => !a.is_read && !a.is_dismissed);
  const allAlerts = alerts.filter((a) => !a.is_dismissed);
  const aiAlerts = allAlerts.filter((a) => a.is_ai_generated);
  const standardAlerts = allAlerts.filter((a) => !a.is_ai_generated);

  // Sort by impact score (AI alerts) or severity, then by date
  const sortedAlerts = [...allAlerts].sort((a, b) => {
    // Critical severity first
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    // Then by impact score
    if ((b.impact_score || 0) !== (a.impact_score || 0)) {
      return (b.impact_score || 0) - (a.impact_score || 0);
    }
    // Then by date
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const filteredAlerts =
    filter === 'all'
      ? sortedAlerts
      : filter === 'ai'
        ? sortedAlerts.filter((a) => a.is_ai_generated)
        : sortedAlerts.filter((a) => !a.is_ai_generated);

  if (allAlerts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No alerts yet</p>
          <p className="text-sm text-gray-400">
            Alerts will appear when mentions spike or sentiment changes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-0 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{unreadAlerts.length}</p>
          <p className="text-xs text-gray-500">Unread</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-600">
            {allAlerts.filter((a) => a.severity === 'critical').length}
          </p>
          <p className="text-xs text-gray-500">Critical</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm text-center bg-violet-50">
          <div className="flex items-center justify-center gap-1">
            <Brain className="w-4 h-4 text-violet-500" />
            <p className="text-2xl font-bold text-violet-600">{aiAlerts.length}</p>
          </div>
          <p className="text-xs text-gray-500">AI Detected</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{allAlerts.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="all">All ({allAlerts.length})</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1">
            <Brain className="w-3 h-3" /> AI ({aiAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="standard">Standard ({standardAlerts.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alerts List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-500" />
              {filter === 'ai'
                ? 'AI-Detected Alerts'
                : filter === 'standard'
                  ? 'Standard Alerts'
                  : 'All Alerts'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredAlerts.slice(0, 20).map((alert) => {
            const config = alertConfig[alert.type] || alertConfig.spike;
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-all ${
                  alert.is_read ? 'bg-white border-gray-100' : 'bg-violet-50 border-violet-200'
                } ${alert.severity === 'critical' ? 'ring-1 ring-red-200' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 relative`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    {alert.is_ai_generated && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                        <Brain className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{alert.title}</span>
                      <Badge className={`${severityColors[alert.severity]} text-xs border-0`}>
                        {alert.severity}
                      </Badge>
                      {alert.impact_score && (
                        <Badge variant="outline" className="text-xs">
                          Impact: {alert.impact_score}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{alert.description}</p>

                    {/* AI Recommended Action */}
                    {alert.recommended_action && (
                      <div className="mt-2 p-2 bg-violet-50 rounded text-xs text-violet-700 flex items-start gap-1">
                        <Brain className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Suggested:</strong> {alert.recommended_action}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400">
                        {format(new Date(alert.created_date), 'MMM d, h:mm a')}
                      </p>
                      {alert.mention_id &&
                        (() => {
                          const relatedMention = mentions.find((m) => m.id === alert.mention_id);
                          if (relatedMention?.post_url) {
                            return (
                              <a
                                href={relatedMention.post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View original post
                              </a>
                            );
                          }
                          if (onViewMention) {
                            return (
                              <button
                                onClick={() => onViewMention(alert.mention_id)}
                                className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View details
                              </button>
                            );
                          }
                          return null;
                        })()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!alert.is_read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-emerald-500 hover:text-emerald-700"
                        onClick={() => onMarkRead(alert.id)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-gray-400 hover:text-gray-600"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
