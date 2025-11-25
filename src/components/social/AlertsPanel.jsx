import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, AlertTriangle, Users, Target, Zap, Check, X } from "lucide-react";
import { format } from "date-fns";

const alertConfig = {
  spike: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
  negative_sentiment: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  influencer: { icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
  competitor: { icon: Target, color: "text-orange-500", bg: "bg-orange-50" },
  viral: { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50" },
};

const severityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function AlertsPanel({ alerts, onMarkRead, onDismiss }) {
  const unreadAlerts = alerts.filter(a => !a.is_read && !a.is_dismissed);
  const recentAlerts = alerts.filter(a => !a.is_dismissed).slice(0, 10);

  if (recentAlerts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No alerts yet</p>
          <p className="text-sm text-gray-400">Alerts will appear when mentions spike or sentiment changes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-500" />
            Alerts
            {unreadAlerts.length > 0 && (
              <Badge className="bg-red-500 text-white border-0 text-xs">
                {unreadAlerts.length}
              </Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {recentAlerts.map((alert) => {
          const config = alertConfig[alert.type] || alertConfig.spike;
          const Icon = config.icon;
          
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition-all ${
                alert.is_read ? 'bg-white border-gray-100' : 'bg-violet-50 border-violet-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">{alert.title}</span>
                    <Badge className={`${severityColors[alert.severity]} text-xs border-0`}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(alert.created_date), 'MMM d, h:mm a')}
                  </p>
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
  );
}