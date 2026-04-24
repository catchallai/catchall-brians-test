import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Hash, AtSign, Search, TrendingUp, Loader2, Trash2, Pencil } from 'lucide-react';
import { PlatformBadges } from '@/components/ui/PlatformBadges';

const typeConfig = {
  keyword: { icon: Search, color: 'bg-blue-100 text-blue-700' },
  hashtag: { icon: Hash, color: 'bg-violet-100 text-violet-700' },
  mention: { icon: AtSign, color: 'bg-pink-100 text-pink-700' },
};

export default function ListeningKeywordCard({
  keyword,
  onClick,
  onToggle,
  onScan,
  onDelete,
  onEdit,
  isScanning,
  isSelected,
}) {
  const config = typeConfig[keyword.type] || typeConfig.keyword;
  const Icon = config.icon;

  const sentimentTotal =
    (keyword.sentiment_breakdown?.positive || 0) +
    (keyword.sentiment_breakdown?.neutral || 0) +
    (keyword.sentiment_breakdown?.negative || 0);

  return (
    <Card
      className={`p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-violet-500 bg-violet-50/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {keyword.type === 'hashtag' ? '#' : keyword.type === 'mention' ? '@' : ''}
              {keyword.keyword}
            </h4>
            <div className="mt-1">
              <PlatformBadges platforms={keyword.platforms ?? []} size="sm" maxVisible={4} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch checked={keyword.is_active} onCheckedChange={() => onToggle(keyword)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900">{keyword.total_mentions || 0}</p>
          <p className="text-xs text-gray-500">Mentions</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-violet-600">{keyword.trending_score || 0}</p>
          <p className="text-xs text-gray-500">Trend Score</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          {sentimentTotal > 0 ? (
            <div className="flex h-2 rounded-full overflow-hidden mb-1">
              <div
                className="bg-emerald-500"
                style={{
                  width: `${(keyword.sentiment_breakdown?.positive / sentimentTotal) * 100}%`,
                }}
              />
              <div
                className="bg-gray-400"
                style={{
                  width: `${(keyword.sentiment_breakdown?.neutral / sentimentTotal) * 100}%`,
                }}
              />
              <div
                className="bg-red-500"
                style={{
                  width: `${(keyword.sentiment_breakdown?.negative / sentimentTotal) * 100}%`,
                }}
              />
            </div>
          ) : (
            <div className="h-2 bg-gray-200 rounded-full mb-1" />
          )}
          <p className="text-xs text-gray-500">Sentiment</p>
        </div>
      </div>

      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-gray-400">
          {keyword.last_scanned
            ? `Last scan: ${new Date(keyword.last_scanned).toLocaleDateString()}`
            : 'Not scanned yet'}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            onClick={() => onEdit(keyword)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(keyword.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onScan(keyword)}
            disabled={isScanning || !keyword.is_active}
          >
            {isScanning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            Scan
          </Button>
        </div>
      </div>
    </Card>
  );
}
