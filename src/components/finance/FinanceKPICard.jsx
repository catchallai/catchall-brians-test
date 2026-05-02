import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function FinanceKPICard({ label, value, trend, trendUp, icon: Icon, iconColor, iconBg, subtitle }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1.5 flex items-center gap-0.5 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}