import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'violet',
  trend,
  trendValue,
  onClick,
}) {
  const colorClasses = {
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card
      className={`p-4 lg:p-5 border-0 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3 lg:mt-4">
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
}
