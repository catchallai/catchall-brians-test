import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, Target, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';

export default function SessionInsightsCard() {
  // Common user paths through SyberJet website
  const topPaths = [
    {
      path: ['/', '/sj30i', '/performance', '/contact'],
      sessions: 1245,
      conversionRate: 12.4,
      avgTime: '8m 32s',
    },
    {
      path: ['/', '/sj30i', '/interior', '/ownership'],
      sessions: 987,
      conversionRate: 8.7,
      avgTime: '10m 15s',
    },
    {
      path: ['/sj30i', '/performance', '/contact'],
      sessions: 756,
      conversionRate: 15.2,
      avgTime: '6m 45s',
    },
    {
      path: ['/', '/ownership', '/contact'],
      sessions: 543,
      conversionRate: 18.5,
      avgTime: '5m 20s',
    },
  ];

  const conversionEvents = [
    { name: 'Contact Form Submitted', count: 342, change: 15.2 },
    { name: 'Brochure Downloaded', count: 1247, change: 8.5 },
    { name: 'Video Watched (>50%)', count: 2156, change: 22.3 },
    { name: 'Configuration Started', count: 189, change: -3.2 },
  ];

  const dropOffPoints = [
    { page: '/ownership', dropRate: 42, issue: 'Long form on mobile' },
    { page: '/performance', dropRate: 28, issue: 'Slow image loading' },
    { page: '/contact', dropRate: 18, issue: 'Required fields unclear' },
  ];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="w-4 h-4 text-emerald-500" />
          Session Insights & Conversions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top User Paths */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top User Journeys
          </h4>
          <div className="space-y-3">
            {topPaths.map((journey, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {journey.path.map((page, pageIdx) => (
                    <React.Fragment key={pageIdx}>
                      <span className="text-xs font-mono bg-white dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                        {page}
                      </span>
                      {pageIdx < journey.path.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{journey.sessions.toLocaleString()} sessions</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Target className="w-3 h-3" />
                    {journey.conversionRate}% conversion
                  </span>
                  <span>{journey.avgTime} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Events */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Conversion Events
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {conversionEvents.map((event) => (
              <div key={event.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{event.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {event.count.toLocaleString()}
                  </span>
                  <Badge
                    className={`text-xs ${event.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 mr-1 ${event.change < 0 ? 'rotate-180' : ''}`}
                    />
                    {event.change > 0 ? '+' : ''}
                    {event.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop-off Points */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Drop-off Points to Investigate
          </h4>
          <div className="space-y-2">
            {dropOffPoints.map((point) => (
              <div
                key={point.page}
                className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3"
              >
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {point.page}
                  </span>
                  <p className="text-xs text-gray-500">{point.issue}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {point.dropRate}% drop
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
