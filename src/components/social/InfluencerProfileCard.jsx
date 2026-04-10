import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ExternalLink,
  Loader2,
  Heart,
  MessageCircle,
  CheckCircle,
  MapPin,
  Link2,
  UserPlus,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

export default function InfluencerProfileCard({ mention, onClose }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Research and provide detailed social media profile information for @${mention.author} on ${mention.platform}.
      
      Provide comprehensive profile data including:
      1. Full name and bio/description
      2. Location if available
      3. Website/links
      4. Follower count and following count
      5. Post frequency and engagement patterns
      6. Content niche/topics they cover
      7. Average engagement rate
      8. Best performing content types
      9. Audience demographics (estimated)
      10. Brand affinity - brands they've worked with or mentioned
      11. Influence score breakdown
      12. Collaboration potential assessment`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          username: { type: 'string' },
          bio: { type: 'string' },
          location: { type: 'string' },
          website: { type: 'string' },
          profile_image_url: { type: 'string' },
          followers: { type: 'number' },
          following: { type: 'number' },
          total_posts: { type: 'number' },
          engagement_rate: { type: 'number' },
          avg_likes: { type: 'number' },
          avg_comments: { type: 'number' },
          content_niche: { type: 'array', items: { type: 'string' } },
          post_frequency: { type: 'string' },
          best_content_types: { type: 'array', items: { type: 'string' } },
          audience_demographics: {
            type: 'object',
            properties: {
              age_range: { type: 'string' },
              gender_split: { type: 'string' },
              top_locations: { type: 'array', items: { type: 'string' } },
            },
          },
          brand_mentions: { type: 'array', items: { type: 'string' } },
          influence_breakdown: {
            type: 'object',
            properties: {
              reach: { type: 'number' },
              relevance: { type: 'number' },
              resonance: { type: 'number' },
              overall: { type: 'number' },
            },
          },
          collaboration_fit: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              reasons: { type: 'array', items: { type: 'string' } },
              outreach_tips: { type: 'array', items: { type: 'string' } },
            },
          },
          recent_posts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                likes: { type: 'number' },
                comments: { type: 'number' },
                date: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setProfile(result);
    setLoading(false);
  };

  React.useEffect(() => {
    if (mention && !profile) {
      fetchProfile();
    }
  }, [mention]);

  const platformEntry = PLATFORM_MAP_LOWER[mention?.platform];
  const PlatformIcon = platformEntry?.icon;
  const platformBg = platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';

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
    <Dialog open={!!mention} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${platformBg} flex items-center justify-center`}>
              {PlatformIcon && <PlatformIcon size={12} color="white" />}
            </div>
            Influencer Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500 mb-3" />
            <p className="text-gray-600">Fetching profile data...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile.profile_image_url} />
                <AvatarFallback className="text-lg">
                  {profile.full_name?.[0] || mention.author?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {profile.full_name || mention.author}
                </h3>
                <p className="text-gray-500">@{profile.username || mention.author}</p>
                {profile.location && (
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
                {profile.bio && <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {profile.influence_breakdown?.overall || mention.influence_score || 0}
                </p>
                <p className="text-xs text-gray-500">Influence Score</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{formatNumber(profile.followers)}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{formatNumber(profile.following)}</p>
                <p className="text-xs text-gray-500">Following</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">
                  {profile.engagement_rate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500">Engagement</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(profile.total_posts)}
                </p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
            </div>

            {/* Influence Breakdown */}
            {profile.influence_breakdown && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Influence Breakdown</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Reach</span>
                      <span className="font-medium">{profile.influence_breakdown.reach}/100</span>
                    </div>
                    <Progress value={profile.influence_breakdown.reach} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Relevance</span>
                      <span className="font-medium">
                        {profile.influence_breakdown.relevance}/100
                      </span>
                    </div>
                    <Progress value={profile.influence_breakdown.relevance} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resonance</span>
                      <span className="font-medium">
                        {profile.influence_breakdown.resonance}/100
                      </span>
                    </div>
                    <Progress value={profile.influence_breakdown.resonance} className="h-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Content Niche */}
            {profile.content_niche?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Niche</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.content_niche.map((niche, idx) => (
                    <Badge key={idx} variant="outline">
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Audience Demographics */}
            {profile.audience_demographics && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Audience Demographics</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Age Range</p>
                    <p className="font-medium">{profile.audience_demographics.age_range}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gender</p>
                    <p className="font-medium">{profile.audience_demographics.gender_split}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Top Locations</p>
                    <p className="font-medium">
                      {profile.audience_demographics.top_locations?.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Collaboration Fit */}
            {profile.collaboration_fit && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Collaboration Fit</h4>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {profile.collaboration_fit.score}/100
                  </Badge>
                </div>
                <div className="space-y-2">
                  {profile.collaboration_fit.reasons?.map((reason, idx) => (
                    <p key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {reason}
                    </p>
                  ))}
                </div>
                {profile.collaboration_fit.outreach_tips?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Outreach Tips:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {profile.collaboration_fit.outreach_tips.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Brand Mentions */}
            {profile.brand_mentions?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Brands Mentioned</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.brand_mentions.map((brand, idx) => (
                    <Badge key={idx} className="bg-gray-100 text-gray-700">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {profile.recent_posts?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Posts</h4>
                <div className="space-y-2">
                  {profile.recent_posts.slice(0, 3).map((post, idx) => (
                    <div key={idx} className="p-3 bg-white border rounded-lg">
                      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {formatNumber(post.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {formatNumber(post.comments)}
                        </span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Link2 className="w-4 h-4" /> Website
                  </Button>
                </a>
              )}
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" /> Save to Contacts
              </Button>
              {mention.post_url && (
                <a href={mention.post_url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                    <ExternalLink className="w-4 h-4" /> View Post
                  </Button>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Unable to load profile data</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
