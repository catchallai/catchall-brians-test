import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

export default function HistoricalDataCard({ keywords, keywordHistory }) {
  const [selectedKeyword, setSelectedKeyword] = useState('all');
  const [timeRange, setTimeRange] = useState('30');

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
        const dayHistory = keywordHistory.filter(h => h.date === dateStr);
        if (dayHistory.length > 0) {
          dayData.position = Math.round(dayHistory.reduce((sum, h) => sum + h.position, 0) / dayHistory.length);
        }
      } else {
        const entry = keywordHistory.find(h => h.keyword_id === selectedKeyword && h.date === dateStr);
        if (entry) {
          dayData.position = entry.position;
        }
      }
      
      data.push(dayData);
    }
    
    return data.filter(d => d.position !== undefined);
  }, [keywordHistory, selectedKeyword, timeRange]);

  const trendData = useMemo(() => {
    if (chartData.length < 2) return { change: 0, direction: 'stable' };
    const first = chartData[0]?.position || 0;
    const last = chartData[chartData.length - 1]?.position || 0;
    const change = first - last;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }, [chartData]);

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
              <p className="text-xs text-gray-500">Track ranking changes over time</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="All Keywords" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keywords (Avg)</SelectItem>
                {keywords.map(kw => (
                  <SelectItem key={kw.id} value={kw.id}>{kw.keyword}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={`gap-1 ${
                trendData.direction === 'up' ? 'bg-emerald-100 text-emerald-700' :
                trendData.direction === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trendData.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                 trendData.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {trendData.change} positions {trendData.direction === 'up' ? 'improved' : trendData.direction === 'down' ? 'dropped' : 'stable'}
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
            <p className="text-sm">No historical data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}