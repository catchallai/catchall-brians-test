import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink, Star, TrendingUp, Eye } from 'lucide-react';
import InfluencerProfileCard from './InfluencerProfileCard';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

export default function InfluencersPanel({ mentions, onViewMention }) {
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);

  // Filter and sort by influence score
  const influencers = mentions
    .filter((m) => m.influence_score >= 70 || m.author_followers >= 10000)
    .sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0))
    .slice(0, 10);

  const formatFollowers = (count) => {
    if (!count) {
      return '0';
    }
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (influencers.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No influencers detected yet</p>
          <p className="text-sm text-gray-400">High-influence accounts will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Top Influencers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {influencers.map((mention) => {
          const platformEntry = PLATFORM_MAP_LOWER[mention.platform];
          const PlatformIcon = platformEntry?.icon;
          const platformBg =
            platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';

          return (
            <div
              key={mention.id}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onViewMention(mention)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${platformBg} flex items-center justify-center`}>
                    {PlatformIcon && <PlatformIcon size={12} color="white" />}
                  </div>
                  <span className="font-medium text-gray-900">@{mention.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Star className="w-3 h-3 mr-1" />
                    {mention.influence_score || 0}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfluencer(mention);
                    }}
                  >
                    <Eye className="w-4 h-4 text-violet-500" />
                  </Button>
                  {mention.post_url && (
                    <a
                      href={mention.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-violet-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatFollowers(mention.author_followers)} followers
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {(mention.likes || 0) + (mention.comments || 0) + (mention.shares || 0)}{' '}
                  engagement
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{mention.content}</p>
            </div>
          );
        })}
      </CardContent>

      {/* Influencer Profile Modal */}
      <InfluencerProfileCard
        mention={selectedInfluencer}
        onClose={() => setSelectedInfluencer(null)}
      />
    </Card>
  );
}
