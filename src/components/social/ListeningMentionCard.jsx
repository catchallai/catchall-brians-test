import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageSquare,
  Share2,
  Users,
  Calendar,
  Eye,
  Play,
  Bookmark,
  TrendingUp,
  MapPin,
  Hash,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

// Reddit is a listening-only platform not in the social posting config
const REDDIT_CONFIG = { tailwind: 'bg-orange-500', tailwindGradient: '', label: 'Reddit' };

const sentimentConfig = {
  positive: { color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  neutral: { color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
  negative: { color: 'bg-red-100 text-red-700', border: 'border-red-200' },
};

const impactConfig = {
  high: { color: 'bg-red-100 text-red-700', label: 'High Impact' },
  medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium Impact' },
  low: { color: 'bg-blue-100 text-blue-700', label: 'Low Impact' },
  none: null,
};

export default function ListeningMentionCard({ mention, onClick }) {
  const platformEntry =
    PLATFORM_MAP_LOWER[mention.platform] || (mention.platform === 'reddit' ? REDDIT_CONFIG : null);
  const PlatformIcon = platformEntry && 'icon' in platformEntry ? platformEntry.icon : null;
  const platformBg = platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';
  const sentiment = sentimentConfig[mention.sentiment] || sentimentConfig.neutral;
  const impact = impactConfig[mention.business_impact];

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
      className={`p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${mention.action_required ? 'ring-2 ring-amber-400' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${platformBg} flex items-center justify-center flex-shrink-0`}
        >
          {PlatformIcon ? (
            <PlatformIcon size={20} color="white" />
          ) : (
            <span className="text-white text-xs font-bold uppercase">
              {mention.platform?.[0] || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {mention.author_display_name || `@${mention.author || 'unknown'}`}
              </span>
              {mention.author_verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
              {mention.is_influencer && (
                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Influencer</Badge>
              )}
              {mention.author_followers > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(mention.author_followers)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mention.action_required && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Action Required
                </Badge>
              )}
              {impact && (
                <Badge className={`${impact.color} border-0 text-xs`}>{impact.label}</Badge>
              )}
            </div>
          </div>

          {/* Author handle and date */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span>@{mention.author || 'unknown'}</span>
            {mention.post_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(mention.post_date), 'MMM d, yyyy h:mm a')}
              </span>
            )}
            {mention.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {mention.location}
                {mention.country && `, ${mention.country}`}
              </span>
            )}
            {mention.post_type && mention.post_type !== 'text' && (
              <Badge variant="outline" className="text-xs capitalize">
                {mention.post_type}
              </Badge>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{mention.content}</p>

          {/* Hashtags */}
          {mention.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {mention.hashtags.slice(0, 5).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs text-violet-600">
                  <Hash className="w-3 h-3 mr-0.5" />
                  {tag}
                </Badge>
              ))}
              {mention.hashtags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{mention.hashtags.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Topics */}
          {mention.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {mention.topics.slice(0, 4).map((topic, i) => (
                <Badge key={i} className="bg-gray-100 text-gray-600 border-0 text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Engagement metrics */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" /> {formatNumber(mention.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> {formatNumber(mention.comments)}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" /> {formatNumber(mention.shares)}
              </span>
              {mention.views > 0 && (
                <span className="flex items-center gap-1">
                  <Play className="w-4 h-4" /> {formatNumber(mention.views)}
                </span>
              )}
              {mention.saves > 0 && (
                <span className="flex items-center gap-1">
                  <Bookmark className="w-4 h-4" /> {formatNumber(mention.saves)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${sentiment.color} border-0 text-xs`}>{mention.sentiment}</Badge>
              {mention.post_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(mention.post_url, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-md text-xs font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
              )}
            </div>
          </div>

          {/* Influence & Virality scores */}
          {(mention.influence_score > 0 || mention.virality_score > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {mention.influence_score > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Influence:</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${mention.influence_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-violet-600">
                    {mention.influence_score}
                  </span>
                </div>
              )}
              {mention.virality_score > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Viral:
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${mention.virality_score > 70 ? 'bg-red-500' : mention.virality_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${mention.virality_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{mention.virality_score}</span>
                </div>
              )}
            </div>
          )}

          {/* Brand mentions */}
          {mention.brand_mentions?.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>Brands mentioned:</span>
              {mention.brand_mentions.slice(0, 3).map((brand, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {brand}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
