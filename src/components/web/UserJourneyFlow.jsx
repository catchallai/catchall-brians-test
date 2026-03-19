import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Flag } from 'lucide-react';

export default function UserJourneyFlow({ journeys = [] }) {
  if (!journeys.length) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center text-gray-500">
          No journey data available
        </CardContent>
      </Card>
    );
  }

  // Find most common paths
  const pathCounts = {};
  journeys.forEach((j) => {
    const pathKey = j.journey_path?.map((p) => p.page_url).join(' → ') || '';
    pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
  });

  const topPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const avgPages = journeys.reduce((sum, j) => sum + (j.pages_visited || 0), 0) / journeys.length;
  const avgTime = journeys.reduce((sum, j) => sum + (j.total_time || 0), 0) / journeys.length;
  const conversionRate = (journeys.filter((j) => j.converted).length / journeys.length) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Avg Pages/Session</p>
            <p className="text-3xl font-bold text-violet-600">{avgPages.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Avg Session Time</p>
            <p className="text-3xl font-bold text-emerald-600">{Math.round(avgTime)}s</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-3xl font-bold text-blue-600">{conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top User Paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topPaths.map(([path, count], idx) => {
            const pages = path.split(' → ');
            return (
              <div key={idx} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{count} users</Badge>
                  <span className="text-xs text-gray-500">Path #{idx + 1}</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {pages.map((page, pIdx) => (
                    <React.Fragment key={pIdx}>
                      <div className="px-3 py-1 bg-violet-50 dark:bg-violet-900/30 rounded text-xs whitespace-nowrap">
                        {page.split('/').pop() || 'Home'}
                      </div>
                      {pIdx < pages.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                  <Flag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
