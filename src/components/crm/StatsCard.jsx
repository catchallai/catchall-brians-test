import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, change, changeType, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    purple: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    orange: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  };

  return (
    <Card className="p-6 glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${changeType === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {change}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}