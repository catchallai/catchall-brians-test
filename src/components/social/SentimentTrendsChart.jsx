import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

export default function SentimentTrendsChart({ mentions }) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({
      start: subDays(today, 13),
      end: today,
    });

    return days.map((day) => {
      const dayMentions = mentions.filter((m) => {
        const mentionDate = startOfDay(new Date(m.post_date || m.created_date));
        return mentionDate.getTime() === day.getTime();
      });

      const positive = dayMentions.filter((m) => m.sentiment === 'positive').length;
      const neutral = dayMentions.filter((m) => m.sentiment === 'neutral').length;
      const negative = dayMentions.filter((m) => m.sentiment === 'negative').length;

      return {
        date: format(day, 'MMM d'),
        positive,
        neutral,
        negative,
        total: positive + neutral + negative,
      };
    });
  }, [mentions]);

  const hasData = chartData.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Sentiment Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No sentiment data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Sentiment Over Time (14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorPositive)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stroke="#6B7280"
                fillOpacity={1}
                fill="url(#colorNeutral)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorNegative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
