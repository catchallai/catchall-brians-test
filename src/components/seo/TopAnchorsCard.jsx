import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Type } from 'lucide-react';

export default function TopAnchorsCard({ backlinks }) {
  const topAnchors = useMemo(() => {
    const anchorCounts = {};
    backlinks.forEach((b) => {
      if (b.anchor_text) {
        const anchor = b.anchor_text.toLowerCase().trim();
        anchorCounts[anchor] = (anchorCounts[anchor] || 0) + 1;
      }
    });

    const sorted = Object.entries(anchorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([text, count]) => ({ text, count }));

    const max = sorted[0]?.count || 1;
    return sorted.map((a) => ({ ...a, percentage: (a.count / max) * 100 }));
  }, [backlinks]);

  const anchorTypes = useMemo(() => {
    let exact = 0,
      partial = 0,
      generic = 0,
      naked = 0;

    backlinks.forEach((b) => {
      const anchor = (b.anchor_text || '').toLowerCase();
      if (!anchor) {
        return;
      }

      if (anchor.includes('http') || anchor.includes('www.')) {
        naked++;
      } else if (
        ['click here', 'read more', 'learn more', 'visit', 'website'].some((g) =>
          anchor.includes(g)
        )
      ) {
        generic++;
      } else if (anchor.length < 20) {
        exact++;
      } else {
        partial++;
      }
    });

    return [
      { type: 'Exact Match', count: exact, color: 'bg-emerald-500' },
      { type: 'Partial Match', count: partial, color: 'bg-blue-500' },
      { type: 'Generic', count: generic, color: 'bg-amber-500' },
      { type: 'Naked URL', count: naked, color: 'bg-gray-500' },
    ].filter((t) => t.count > 0);
  }, [backlinks]);

  const total = anchorTypes.reduce((sum, t) => sum + t.count, 0);

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Type className="w-4 h-4 text-violet-500" />
          Top Anchor Texts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Anchor Distribution Bar */}
        <div className="space-y-2">
          <div className="flex h-2 rounded-full overflow-hidden">
            {anchorTypes.map((t, i) => (
              <div
                key={i}
                className={`${t.color} transition-all`}
                style={{ width: `${(t.count / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {anchorTypes.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${t.color}`} />
                <span className="text-gray-500">{t.type}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Anchors List */}
        <div className="space-y-2">
          {topAnchors.map((anchor, i) => (
            <div key={i} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                  "{anchor.text}"
                </span>
                <span className="text-xs text-gray-400">{anchor.count}x</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${anchor.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
