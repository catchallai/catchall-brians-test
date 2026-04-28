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
import { MapPin, Monitor, Smartphone, Tablet } from 'lucide-react';

const devices = [
  { value: 'all', label: 'All Devices', icon: Monitor },
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
];

const locations = [
  { value: 'all', label: 'All Locations' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
];

export default function MultiLocationCard({ keywords, keywordHistory }) {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const filteredData = useMemo(() => {
    let filtered = keywordHistory;

    if (selectedDevice !== 'all') {
      filtered = filtered.filter((h) => h.device === selectedDevice);
    }
    if (selectedLocation !== 'all') {
      filtered = filtered.filter((h) => h.location === selectedLocation);
    }

    // Group by keyword
    const byKeyword = {};
    filtered.forEach((h) => {
      if (!byKeyword[h.keyword_id]) {
        byKeyword[h.keyword_id] = [];
      }
      byKeyword[h.keyword_id].push(h);
    });

    // Calculate averages per keyword
    return Object.entries(byKeyword)
      .map(([keywordId, history]) => {
        const keyword = keywords.find((k) => k.id === keywordId);
        const avgPosition = Math.round(
          history.reduce((sum, h) => sum + h.position, 0) / history.length
        );
        const latestPosition =
          history.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.position || 0;

        return {
          keyword: keyword?.keyword || 'Unknown',
          avgPosition,
          latestPosition,
          dataPoints: history.length,
        };
      })
      .sort((a, b) => a.latestPosition - b.latestPosition);
  }, [keywordHistory, keywords, selectedDevice, selectedLocation]);

  const deviceStats = useMemo(() => {
    const stats = { desktop: [], mobile: [], tablet: [] };

    keywordHistory.forEach((h) => {
      if (h.device && stats[h.device]) {
        stats[h.device].push(h.position);
      }
    });

    return Object.entries(stats).map(([device, positions]) => ({
      device,
      avgPosition:
        positions.length > 0
          ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
          : '-',
      count: positions.length,
    }));
  }, [keywordHistory]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Multi-Location & Device</CardTitle>
              <p className="text-xs text-gray-500">Track rankings by location and device</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Device Overview */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {deviceStats.map((stat) => (
            <div
              key={stat.device}
              className={`text-center p-3 rounded-lg ${
                selectedDevice === stat.device ? 'bg-cyan-50 ring-1 ring-cyan-200' : 'bg-gray-50'
              }`}
            >
              {stat.device === 'desktop' && (
                <Monitor className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              )}
              {stat.device === 'mobile' && (
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              )}
              {stat.device === 'tablet' && (
                <Tablet className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              )}
              <p className="text-lg font-bold">{stat.avgPosition}</p>
              <p className="text-xs text-gray-500 capitalize">{stat.device}</p>
            </div>
          ))}
        </div>

        {/* Filtered Keywords */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredData.length > 0 ? (
            filteredData.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium truncate flex-1">{item.keyword}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{item.latestPosition}
                  </Badge>
                  <span className="text-xs text-gray-400">{item.dataPoints} pts</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No data for selected filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
