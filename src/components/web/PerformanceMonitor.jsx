import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Zap, Clock, Layout } from 'lucide-react';

export default function PerformanceMonitor({ performances = [] }) {
  if (!performances.length) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center text-gray-500">
          No performance data available
        </CardContent>
      </Card>
    );
  }

  const latest = performances[performances.length - 1];
  const avgLCP = performances.reduce((sum, p) => sum + (p.lcp || 0), 0) / performances.length;
  const avgFID = performances.reduce((sum, p) => sum + (p.fid || 0), 0) / performances.length;
  const avgCLS = performances.reduce((sum, p) => sum + (p.cls || 0), 0) / performances.length;

  const getScoreColor = (score) => {
    if (score >= 75) {
      return 'text-emerald-600 bg-emerald-100';
    }
    if (score >= 50) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-medium">LCP</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(avgLCP)}ms</p>
            <p className="text-xs text-gray-500 mt-1">Largest Contentful Paint</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">FID</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(avgFID)}ms</p>
            <p className="text-xs text-gray-500 mt-1">First Input Delay</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Layout className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">CLS</span>
            </div>
            <p className="text-2xl font-bold">{avgCLS.toFixed(3)}</p>
            <p className="text-xs text-gray-500 mt-1">Cumulative Layout Shift</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Score</span>
            <Badge className={getScoreColor(latest.performance_score)}>
              {latest.performance_score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performances.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => new Date(val).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="performance_score" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
