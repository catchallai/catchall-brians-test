import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin } from 'lucide-react';

export default function GeographicInsights({ mentions }) {
  const locationData = useMemo(() => {
    const locations = {};

    mentions.forEach((m) => {
      if (m.location || m.country) {
        const loc = m.country || m.location;
        if (!locations[loc]) {
          locations[loc] = {
            count: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            totalEngagement: 0,
          };
        }
        locations[loc].count++;
        locations[loc][m.sentiment || 'neutral']++;
        locations[loc].totalEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
      }
    });

    return Object.entries(locations)
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mentions]);

  const totalWithLocation = locationData.reduce((sum, l) => sum + l.count, 0);

  if (locationData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No geographic data yet</p>
          <p className="text-sm text-gray-400">Location insights will appear when detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Geographic Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {locationData.map((loc) => {
          const percentage = totalWithLocation > 0 ? (loc.count / totalWithLocation) * 100 : 0;
          const dominantSentiment =
            loc.positive >= loc.negative && loc.positive >= loc.neutral
              ? 'positive'
              : loc.negative >= loc.neutral
                ? 'negative'
                : 'neutral';

          return (
            <div key={loc.location} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{loc.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs border-0 ${
                      dominantSentiment === 'positive'
                        ? 'bg-emerald-100 text-emerald-700'
                        : dominantSentiment === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {dominantSentiment}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">{loc.count}</span>
                </div>
              </div>
              <div className="flex gap-1 h-2">
                <div
                  className="bg-emerald-500 rounded-l-full transition-all"
                  style={{ width: `${(loc.positive / loc.count) * 100}%` }}
                />
                <div
                  className="bg-gray-400 transition-all"
                  style={{ width: `${(loc.neutral / loc.count) * 100}%` }}
                />
                <div
                  className="bg-red-500 rounded-r-full transition-all"
                  style={{ width: `${(loc.negative / loc.count) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{percentage.toFixed(0)}% of mentions</span>
                <span>{loc.totalEngagement.toLocaleString()} engagement</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
