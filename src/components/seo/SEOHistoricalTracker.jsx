import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function SEOHistoricalTracker({ keywords, keywordHistory }) {
  // Group history by keyword
  const keywordHistoryMap = {};
  keywordHistory.forEach((h) => {
    if (!keywordHistoryMap[h.keyword_id]) {
      keywordHistoryMap[h.keyword_id] = [];
    }
    keywordHistoryMap[h.keyword_id].push(h);
  });

  // Get keywords with significant changes
  const keywordsWithHistory = keywords
    .filter((k) => keywordHistoryMap[k.id]?.length > 1)
    .map((k) => {
      const history = keywordHistoryMap[k.id].sort((a, b) => new Date(a.date) - new Date(b.date));
      const oldestPosition = history[0].position;
      const latestPosition = history[history.length - 1].position;
      const change = oldestPosition - latestPosition; // Positive = improvement
      return { ...k, history, change, oldestPosition, latestPosition };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  if (keywordsWithHistory.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No historical data yet. Analyze websites to build tracking history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Top Ranking Changes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {keywordsWithHistory.map((kw) => (
          <div key={kw.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{kw.keyword}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Position {kw.latestPosition}
                  </Badge>
                  {kw.change > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />+{Math.abs(kw.change)} positions
                    </Badge>
                  )}
                  {kw.change < 0 && (
                    <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />-{Math.abs(kw.change)} positions
                    </Badge>
                  )}
                  {kw.change === 0 && (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                      <Minus className="w-3 h-3 mr-1" />
                      No change
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={kw.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis reversed domain={[1, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="position" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
