import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

export default function BacklinkAnalytics({ backlinks }) {
  // Referring Domains
  const referringDomains = useMemo(() => {
    const domains = new Set(backlinks.map((b) => b.source_domain).filter(Boolean));
    return domains.size;
  }, [backlinks]);

  // Link Velocity (new links per week over last 4 weeks)
  const linkVelocity = useMemo(() => {
    const now = new Date();
    const weeks = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(now, (i + 1) * 7);
      const weekEnd = subDays(now, i * 7);
      const count = backlinks.filter((b) => {
        if (!b.first_seen) {
          return false;
        }
        const date = new Date(b.first_seen);
        return date >= weekStart && date < weekEnd;
      }).length;
      weeks.push({
        week: `W${4 - i}`,
        label: format(weekStart, 'MMM d'),
        count,
      });
    }

    const currentWeekCount = weeks[weeks.length - 1]?.count || 0;
    const prevWeekCount = weeks[weeks.length - 2]?.count || 0;
    const trend = currentWeekCount - prevWeekCount;

    return { weeks, trend, current: currentWeekCount };
  }, [backlinks]);

  // Toxic Score Trend
  const toxicTrend = useMemo(() => {
    const toxicLinks = backlinks.filter(
      (b) => b.is_toxic || (b.domain_authority && b.domain_authority < 10)
    );
    const toxicPercentage = backlinks.length > 0 ? (toxicLinks.length / backlinks.length) * 100 : 0;

    // Simulate historical trend
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        day: format(subDays(new Date(), i * 7), 'MMM d'),
        score: Math.max(0, Math.min(100, toxicPercentage + (Math.random() * 10 - 5) + i * 0.5)),
      });
    }

    return {
      current: toxicPercentage.toFixed(1),
      count: toxicLinks.length,
      data,
      trend: data.length >= 2 ? data[data.length - 1].score - data[0].score : 0,
    };
  }, [backlinks]);

  // Domain Authority Distribution
  const daDistribution = useMemo(() => {
    const ranges = [
      { name: 'High (60+)', min: 60, max: 100, color: '#10b981' },
      { name: 'Medium (30-59)', min: 30, max: 59, color: '#f59e0b' },
      { name: 'Low (10-29)', min: 10, max: 29, color: '#6366f1' },
      { name: 'Very Low (<10)', min: 0, max: 9, color: '#ef4444' },
    ];

    return ranges
      .map((range) => ({
        ...range,
        value: backlinks.filter(
          (b) => b.domain_authority >= range.min && b.domain_authority <= range.max
        ).length,
      }))
      .filter((r) => r.value > 0);
  }, [backlinks]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Referring Domains */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{referringDomains}</p>
              <p className="text-xs text-gray-500">Referring Domains</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Velocity */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {linkVelocity.current}
                </p>
                <p className="text-xs text-gray-500">Links This Week</p>
              </div>
            </div>
            <Badge
              className={`text-xs ${
                linkVelocity.trend > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : linkVelocity.trend < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {linkVelocity.trend > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : linkVelocity.trend < 0 ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : (
                <Minus className="w-3 h-3 mr-1" />
              )}
              {Math.abs(linkVelocity.trend)}
            </Badge>
          </div>
          <div className="mt-3 flex gap-1">
            {linkVelocity.weeks.map((w, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className="bg-violet-200 dark:bg-violet-800 rounded-sm mx-auto"
                  style={{
                    height: `${Math.max(4, (w.count / Math.max(...linkVelocity.weeks.map((x) => x.count || 1))) * 24)}px`,
                    width: '100%',
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-1">{w.week}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toxic Score */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  parseFloat(toxicTrend.current) > 10
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-emerald-100 dark:bg-emerald-900/30'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    parseFloat(toxicTrend.current) > 10 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {toxicTrend.current}%
                </p>
                <p className="text-xs text-gray-500">Toxic Score</p>
              </div>
            </div>
            <Badge
              className={`text-xs ${
                toxicTrend.trend < 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : toxicTrend.trend > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {toxicTrend.count} links
            </Badge>
          </div>
          <div className="h-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={toxicTrend.data}>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={parseFloat(toxicTrend.current) > 10 ? '#ef4444' : '#10b981'}
                  fill={parseFloat(toxicTrend.current) > 10 ? '#fecaca' : '#d1fae5'}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DA Distribution */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">DA Distribution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={daDistribution}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={15}
                    outerRadius={30}
                  >
                    {daDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {daDistribution.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-500 truncate">{item.name.split(' ')[0]}</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
