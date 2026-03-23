import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function SentimentOverview({ mentions }) {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  const negative = mentions.filter((m) => m.sentiment === 'negative').length;
  const neutral = mentions.filter((m) => m.sentiment === 'neutral').length;
  const positive = mentions.filter((m) => m.sentiment === 'positive').length;
  const total = mentions.length;

  const negativePercent = Math.round((negative / total) * 100);
  const neutralPercent = Math.round((neutral / total) * 100);
  const positivePercent = Math.round((positive / total) * 100);

  let level = 'Healthy';
  let levelColor = 'text-emerald-500';
  if (negativePercent > 30) {
    level = 'Needs Attention';
    levelColor = 'text-red-500';
  } else if (negativePercent > 15) {
    level = 'Monitor';
    levelColor = 'text-amber-500';
  }

  const platforms = [...new Set(mentions.map((m) => m.platform))].length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <CardTitle className="text-base font-semibold">Brand Sentiment</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-2xl font-bold ${levelColor}`}>{level}</span>
          <span className="text-sm text-gray-500">across {platforms} platforms</span>
        </div>

        <div className="flex h-2.5 rounded-full overflow-hidden mb-4">
          <div className="bg-emerald-500" style={{ width: `${positivePercent}%` }} />
          <div className="bg-gray-300" style={{ width: `${neutralPercent}%` }} />
          <div className="bg-red-500" style={{ width: `${negativePercent}%` }} />
        </div>

        <div className="flex justify-between text-sm">
          <div className="text-center">
            <p className="font-semibold text-emerald-600">{positive}</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-600">{neutral}</p>
            <p className="text-xs text-gray-500">Neutral</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-red-600">{negative}</p>
            <p className="text-xs text-gray-500">Negative</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-blue-600">{total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
