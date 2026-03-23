import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Eye, ThumbsUp, ExternalLink, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

const sourceConfig = {
  forum: { color: 'bg-amber-100 text-amber-700', label: 'Forum' },
  reddit: { color: 'bg-orange-500 text-white', label: 'Reddit' },
  discord: { color: 'bg-indigo-500 text-white', label: 'Discord' },
  slack: { color: 'bg-purple-500 text-white', label: 'Slack' },
  telegram: { color: 'bg-blue-400 text-white', label: 'Telegram' },
  quora: { color: 'bg-red-600 text-white', label: 'Quora' },
  blog_comments: { color: 'bg-green-100 text-green-700', label: 'Blog' },
  news_comments: { color: 'bg-gray-700 text-white', label: 'News' },
  other: { color: 'bg-gray-100 text-gray-700', label: 'Other' },
};

const sentimentColors = {
  positive: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-red-100 text-red-700',
};

export default function ForumMentionCard({ mention, onClick }) {
  const source = sourceConfig[mention.source_type] || sourceConfig.other;
  const sentiment = sentimentColors[mention.sentiment] || sentimentColors.neutral;

  const formatNumber = (num) => {
    if (!num) {
      return '0';
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
    <Card
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`px-3 py-1.5 rounded-lg ${source.color} text-sm font-medium flex-shrink-0`}>
          {source.label}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              {mention.thread_title && (
                <h4 className="font-medium text-gray-900 line-clamp-1">{mention.thread_title}</h4>
              )}
              <p className="text-sm text-gray-500">{mention.source_name || 'Unknown source'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={`${sentiment} border-0 text-xs`}>{mention.sentiment}</Badge>
              {mention.source_url && (
                <a
                  href={mention.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{mention.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-gray-500">
              {mention.replies_count > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> {formatNumber(mention.replies_count)}{' '}
                  replies
                </span>
              )}
              {mention.views_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {formatNumber(mention.views_count)} views
                </span>
              )}
              {mention.upvotes > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" /> {formatNumber(mention.upvotes)}
                </span>
              )}
            </div>
            {mention.post_date && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(mention.post_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {mention.topics?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {mention.topics.slice(0, 4).map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {mention.author && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Posted by {mention.author}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
