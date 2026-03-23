import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Building2, MapPin, Monitor, Eye, Target } from 'lucide-react';

const CHART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function SegmentAnalysis({ open, onClose, segment, visitors }) {
  if (!segment || !visitors) {
    return null;
  }

  // Calculate analytics
  const avgScore = Math.round(visitors.reduce((sum, v) => sum + v.leadScore, 0) / visitors.length);
  const avgPages = Math.round(
    visitors.reduce((sum, v) => sum + v.pagesViewed, 0) / visitors.length
  );
  const avgTimeMinutes = Math.round(
    visitors.reduce((sum, v) => sum + parseInt(v.timeOnSite.split('m')[0]), 0) / visitors.length
  );

  // Industry distribution
  const industryData = Object.entries(
    visitors.reduce((acc, v) => {
      acc[v.industry] = (acc[v.industry] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Tier distribution
  const tierData = Object.entries(
    visitors.reduce((acc, v) => {
      const tier = v.scoreData?.tier || 'unknown';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Device distribution
  const deviceData = Object.entries(
    visitors.reduce((acc, v) => {
      acc[v.device] = (acc[v.device] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Country distribution
  const countryData = Object.entries(
    visitors.reduce((acc, v) => {
      acc[v.country] = (acc[v.country] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: segment.color }} />
            {segment.name} - Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Total Visitors</p>
                <p className="text-2xl font-bold text-violet-600">{visitors.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Avg Lead Score</p>
                <p className="text-2xl font-bold text-blue-600">{avgScore}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Avg Pages</p>
                <p className="text-2xl font-bold text-green-600">{avgPages}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Avg Time</p>
                <p className="text-2xl font-bold text-amber-600">{avgTimeMinutes}m</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Lead Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deviceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Top Industries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={industryData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={countryData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Visitors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 10 Visitors by Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visitors
                  .sort((a, b) => b.leadScore - a.leadScore)
                  .slice(0, 10)
                  .map((visitor, idx) => (
                    <div
                      key={visitor.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-400">#{idx + 1}</span>
                        <img src={visitor.logo} alt={visitor.company} className="w-6 h-6 rounded" />
                        <span className="text-sm font-medium">{visitor.company}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {visitor.pagesViewed}
                        </span>
                        <Badge>{visitor.leadScore}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
