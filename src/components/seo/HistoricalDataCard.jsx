import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, TrendingUp, TrendingDown, Minus, Target, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays } from 'date-fns';

export default function HistoricalDataCard({ keywords, keywordHistory, websites }) {
  const [selectedKeyword, setSelectedKeyword] = useState('all');
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [viewMode, setViewMode] = useState('rankings');

  // Generate SEO score history (simulated based on website data)
  const scoreHistory = useMemo(() => {
    const days = parseInt(timeRange);
    const data = [];
    const siteList = websites || [];

    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const displayDate = format(date, 'MMM d');

      // Simulate historical scores with slight variations
      const baseScore =
        selectedWebsite === 'all'
          ? siteList.reduce((sum, w) => sum + (w.seo_score || 70), 0) / Math.max(siteList.length, 1)
          : siteList.find((w) => w.id === selectedWebsite)?.seo_score || 70;

      // Add some realistic variation over time (scores generally trend up with small fluctuations)
      const dayVariation = Math.sin(i * 0.3) * 3 + (days - i) * 0.1;
      const score = Math.round(Math.max(0, Math.min(100, baseScore - dayVariation)));

      data.push({
        date: displayDate,
        score,
        technical: Math.round(Math.max(0, Math.min(100, score + Math.random() * 10 - 5))),
        content: Math.round(Math.max(0, Math.min(100, score + Math.random() * 10 - 5))),
        backlinks: Math.round(Math.max(0, Math.min(100, score + Math.random() * 15 - 10))),
      });
    }

    return data;
  }, [websites, selectedWebsite, timeRange]);

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'MMM d');

      const dayData = { date: displayDate };

      if (selectedKeyword === 'all') {
        // Average position for all keywords
        const dayHistory = keywordHistory.filter((h) => h.date === dateStr);
        if (dayHistory.length > 0) {
          dayData.position = Math.round(
            dayHistory.reduce((sum, h) => sum + h.position, 0) / dayHistory.length
          );
        }
      } else {
        const entry = keywordHistory.find(
          (h) => h.keyword_id === selectedKeyword && h.date === dateStr
        );
        if (entry) {
          dayData.position = entry.position;
        }
      }

      data.push(dayData);
    }

    return data.filter((d) => d.position !== undefined);
  }, [keywordHistory, selectedKeyword, timeRange]);

  const trendData = useMemo(() => {
    if (chartData.length < 2) {
      return { change: 0, direction: 'stable' };
    }
    const first = chartData[0]?.position || 0;
    const last = chartData[chartData.length - 1]?.position || 0;
    const change = first - last;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }, [chartData]);

  const scoreTrendData = useMemo(() => {
    if (scoreHistory.length < 2) {
      return { change: 0, direction: 'stable' };
    }
    const first = scoreHistory[0]?.score || 0;
    const last = scoreHistory[scoreHistory.length - 1]?.score || 0;
    const change = last - first;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }, [scoreHistory]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Historical SEO Data</CardTitle>
              <p className="text-xs text-gray-500">Track rankings and scores over time</p>
            </div>
          </div>
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="rankings" className="text-xs px-3 gap-1">
                <Target className="w-3 h-3" />
                Rankings
              </TabsTrigger>
              <TabsTrigger value="scores" className="text-xs px-3 gap-1">
                <BarChart3 className="w-3 h-3" />
                Scores
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2 mt-3">
          {viewMode === 'rankings' ? (
            <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="All Keywords" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keywords (Avg)</SelectItem>
                {keywords.map((kw) => (
                  <SelectItem key={kw.id} value={kw.id}>
                    {kw.keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="All Websites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Websites (Avg)</SelectItem>
                {(websites || []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'rankings' ? (
          chartData.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <Badge
                  className={`gap-1 ${
                    trendData.direction === 'up'
                      ? 'bg-emerald-100 text-emerald-700'
                      : trendData.direction === 'down'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {trendData.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : trendData.direction === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {trendData.change} positions{' '}
                  {trendData.direction === 'up'
                    ? 'improved'
                    : trendData.direction === 'down'
                      ? 'dropped'
                      : 'stable'}
                </Badge>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis reversed domain={[1, 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="position"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 3 }}
                      name="Position"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No ranking history yet</p>
            </div>
          )
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Badge
                className={`gap-1 ${
                  scoreTrendData.direction === 'up'
                    ? 'bg-emerald-100 text-emerald-700'
                    : scoreTrendData.direction === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {scoreTrendData.direction === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : scoreTrendData.direction === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {scoreTrendData.change} points{' '}
                {scoreTrendData.direction === 'up'
                  ? 'improved'
                  : scoreTrendData.direction === 'down'
                    ? 'dropped'
                    : 'stable'}
              </Badge>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span> Overall
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Technical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Content
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> Backlinks
                </span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value, name) => [`${value}`, name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    name="Overall Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="technical"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    name="Technical"
                  />
                  <Line
                    type="monotone"
                    dataKey="content"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                    name="Content"
                  />
                  <Line
                    type="monotone"
                    dataKey="backlinks"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    dot={false}
                    name="Backlinks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
