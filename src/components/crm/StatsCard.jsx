import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, change, changeType, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    orange: "bg-amber-50 text-amber-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
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
              <span className="text-sm text-gray-400">vs last month</span>
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