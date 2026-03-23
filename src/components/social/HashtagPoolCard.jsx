import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hash, Plus, X, Copy, Sparkles, TrendingUp } from 'lucide-react';

export default function HashtagPoolCard({ hashtags = [], onAdd, onDelete, isAddLoading }) {
  const [newHashtag, setNewHashtag] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = () => {
    if (newHashtag.trim()) {
      onAdd(newHashtag.trim());
      setNewHashtag('');
    }
  };

  const handleCopyAll = () => {
    const allHashtags = hashtags.map((h) => `#${h.hashtag}`).join(' ');
    navigator.clipboard.writeText(allHashtags);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group hashtags by category or usage
  const popularHashtags = hashtags.filter((h) => (h.usage_count || 0) >= 5);
  const recentHashtags = hashtags.filter((h) => (h.usage_count || 0) < 5);

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Hash className="w-4 h-4 text-white" />
            </div>
            Hashtag Pool
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {hashtags.length} hashtags
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Hashtag */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Add new hashtag..."
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              className="pl-9 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newHashtag.trim() || isAddLoading}
            className="bg-violet-600 hover:bg-violet-700 gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {/* Popular Hashtags */}
        {popularHashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3 h-3" />
              Popular
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              {popularHashtags.map((h) => (
                <Badge
                  key={h.id}
                  variant="secondary"
                  className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group transition-all pl-2 pr-1 py-1"
                >
                  <span className="text-violet-600 dark:text-violet-400 font-medium">
                    #{h.hashtag}
                  </span>
                  {h.usage_count > 0 && (
                    <span className="text-gray-400 text-xs ml-1">({h.usage_count})</span>
                  )}
                  <button
                    className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(h.id)}
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* All Hashtags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Sparkles className="w-3 h-3" />
            {popularHashtags.length > 0 ? 'Recent' : 'All Hashtags'}
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 min-h-[60px]">
            {(popularHashtags.length > 0 ? recentHashtags : hashtags).map((h) => (
              <Badge
                key={h.id}
                variant="outline"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group transition-all pl-2 pr-1 py-1"
              >
                <span className="text-blue-600 dark:text-blue-400">#{h.hashtag}</span>
                <button
                  className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(h.id)}
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
              </Badge>
            ))}
            {hashtags.length === 0 && (
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                No hashtags added yet. Add your first hashtag above!
              </span>
            )}
          </div>
        </div>

        {/* Copy All Button */}
        {hashtags.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="w-full gap-2 mt-2">
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy All Hashtags'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
