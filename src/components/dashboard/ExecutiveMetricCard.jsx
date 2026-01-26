import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ExecutiveMetricCard({ 
  label, 
  value, 
  trend, 
  trendDirection, 
  icon: Icon,
  color = 'violet',
  subtext 
}) {
  const colorClasses = {
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  };

  const trendColor = trendDirection === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
        </div>
        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} text-xs lg:text-sm font-semibold`}>
            {trendDirection === 'up' ? <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" /> : <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}