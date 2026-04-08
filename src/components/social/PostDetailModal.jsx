import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heart, MessageSquare, Share2, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import PostScreenshot from './PostScreenshot';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

const sentimentConfig = {
  positive: { color: 'text-emerald-600', bg: 'bg-emerald-100' },
  neutral: { color: 'text-gray-600', bg: 'bg-gray-100' },
  negative: { color: 'text-red-600', bg: 'bg-red-100' },
};

export default function PostDetailModal({ open, onClose, post, accountName }) {
  if (!post) {
    return null;
  }

  const sentiment = sentimentConfig[post.sentiment] || sentimentConfig.neutral;
  const platformEntry = PLATFORM_MAP_LOWER[post.platform];
  const PlatformIcon = platformEntry?.icon;
  const platformBg = platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';
  const platformLabel = platformEntry?.label || post.platform || 'Unknown';
  const totalEngagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg ${platformBg} flex items-center justify-center`}>
              {PlatformIcon && <PlatformIcon size={16} color="white" />}
            </span>
            Post from @{accountName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post Preview Screenshot */}
          <PostScreenshot post={post} accountName={accountName} platform={post.platform} />

          {/* Meta info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${platformBg} text-white`}>{platformLabel}</Badge>
            <Badge className={`${sentiment.bg} ${sentiment.color} border-0`}>
              {post.sentiment} sentiment
            </Badge>
            {post.post_date && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(post.post_date), 'MMM d, yyyy h:mm a')}
              </span>
            )}
          </div>

          {/* Full content */}
          <Card className="p-4 bg-gray-50 border-0">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </Card>

          {/* Topics/Hashtags */}
          {post.topics?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Topics & Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {post.topics.map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-sm">
                    #{topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Engagement</h4>
            <div className="grid grid-cols-4 gap-3">
              <Card className="p-3 text-center border-0 bg-pink-50">
                <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {(post.likes || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Likes</p>
              </Card>
              <Card className="p-3 text-center border-0 bg-blue-50">
                <MessageSquare className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {(post.comments || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Comments</p>
              </Card>
              <Card className="p-3 text-center border-0 bg-green-50">
                <Share2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {(post.shares || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Shares</p>
              </Card>
              <Card className="p-3 text-center border-0 bg-violet-50">
                <p className="text-lg font-bold text-violet-600">
                  {totalEngagement.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </Card>
            </div>
          </div>

          {/* View on Platform Button */}
          <a
            href={post.post_url || getPlatformSearchUrl(post.platform, post.content, accountName)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on {platformLabel}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getPlatformSearchUrl(platform, content, accountName) {
  const query = encodeURIComponent(content?.slice(0, 50) || accountName || '');
  const handle = accountName || '';

  switch (platform) {
    case 'twitter':
      return handle ? `https://x.com/${handle}` : `https://x.com/search?q=${query}`;
    case 'linkedin':
      return handle
        ? `https://linkedin.com/in/${handle}`
        : `https://linkedin.com/search/results/content/?keywords=${query}`;
    case 'facebook':
      return `https://facebook.com/search/posts/?q=${query}`;
    case 'instagram':
      return handle
        ? `https://instagram.com/${handle}`
        : `https://instagram.com/explore/tags/${query.replace(/\s+/g, '')}`;
    case 'youtube':
      return handle
        ? `https://youtube.com/@${handle}`
        : `https://youtube.com/results?search_query=${query}`;
    default:
      return `https://google.com/search?q=${query}`;
  }
}
