import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';

export default function KeywordRankCard({ keyword }) {
  const positionChange = (keyword.previous_position || 0) - (keyword.current_position || 0);

  const getPositionBadge = () => {
    if (!keyword.current_position) {
      return null;
    }
    if (keyword.current_position <= 3) {
      return <Badge className="bg-emerald-100 text-emerald-700 border-0">Top 3</Badge>;
    } else if (keyword.current_position <= 10) {
      return <Badge className="bg-blue-100 text-blue-700 border-0">Page 1</Badge>;
    } else if (keyword.current_position <= 20) {
      return <Badge className="bg-amber-100 text-amber-700 border-0">Page 2</Badge>;
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border-0">
        Page {Math.ceil(keyword.current_position / 10)}
      </Badge>
    );
  };

  const formatNumber = (num) => {
    if (!num) {
      return '-';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="p-4 border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-gray-400" />
            <h4 className="font-semibold text-gray-900 truncate">{keyword.keyword}</h4>
          </div>
          {keyword.target_url && (
            <p className="text-xs text-gray-400 truncate">{keyword.target_url}</p>
          )}
        </div>
        {getPositionBadge()}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-400 mb-1">Position</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-bold text-gray-900">
              {keyword.current_position || '-'}
            </span>
            {positionChange !== 0 && (
              <span
                className={`flex items-center text-sm ${positionChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {positionChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(positionChange)}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Volume</p>
          <span className="text-lg font-semibold text-gray-700">
            {formatNumber(keyword.search_volume)}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Difficulty</p>
          <span
            className={`text-lg font-semibold ${
              keyword.difficulty < 30
                ? 'text-emerald-600'
                : keyword.difficulty < 60
                  ? 'text-amber-600'
                  : 'text-red-600'
            }`}
          >
            {keyword.difficulty || '-'}
          </span>
        </div>
      </div>
    </Card>
  );
}
