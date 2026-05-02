import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Building2,
  Target,
  Search,
  TrendingUp,
  DollarSign,
  Zap,
  Award,
} from 'lucide-react';

const iconMap = {
  users: Users,
  building: Building2,
  target: Target,
  search: Search,
  trending: TrendingUp,
  dollar: DollarSign,
  zap: Zap,
  award: Award,
};

export default function BusinessOverviewCards({ metrics, onCardClick }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric) => {
        const IconComponent = iconMap[metric.icon];
        return (
          <Card
            key={metric.id}
            className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onCardClick(metric.id)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.bgColor} group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`w-5 h-5 ${metric.textColor}`} />
                </div>
                {metric.trend && (
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${metric.trendColor}`}>
                    {metric.trend}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {metric.label}
              </p>
              {metric.sublabel && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {metric.sublabel}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}