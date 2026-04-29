import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Clock, Calendar, ChevronRight, ChevronDown } from 'lucide-react';

export default function OptimalTimeAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: optimalTimes = [] } = useQuery({
    queryKey: ['optimal-times'],
    queryFn: () => base44.entities.OptimalPostingTime.list('-engagement_score', 50),
  });

  const peakTimes = optimalTimes.filter((t) => t.is_peak_time);
  const platformData = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((platform) => ({
    platform,
    times: optimalTimes.filter((t) => t.platform === platform).slice(0, 3),
  }));

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Optimal Posting Times
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {peakTimes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Analyzing your audience engagement patterns...</p>
              <p className="text-xs mt-2">Post regularly to build engagement data</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Peak Times Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Peak Engagement Windows
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {peakTimes.slice(0, 4).map((time) => (
                    <div
                      key={`${time.platform}-${time.day_of_week}-${time.hour}`}
                      className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800"
                    >
                      <div className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1">
                        {time.platform}
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {dayNames[time.day_of_week].slice(0, 3)} {time.hour}:00
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Score: {Math.round(time.engagement_score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Best Times by Platform
                </h3>
                <div className="space-y-4">
                  {platformData.map(
                    ({ platform, times }) =>
                      times.length > 0 && (
                        <div key={platform} className="border-l-4 border-violet-400 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {platform}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {times.length} time slots
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {times.map((time) => (
                              <div
                                key={`${time.day_of_week}-${time.hour}`}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs"
                              >
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {dayNames[time.day_of_week].slice(0, 3)}
                                </span>{' '}
                                <span className="text-gray-600 dark:text-gray-400">
                                  {time.hour}:00
                                </span>
                                {time.is_peak_time && (
                                  <Badge className="ml-2 bg-violet-500 text-white text-xs">
                                    Peak
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Smart Scheduling Tips
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• Use the queue to automatically schedule posts at optimal times</li>
                      <li>• Peak times are calculated from your historical engagement data</li>
                      <li>• Times update automatically as you post more content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
