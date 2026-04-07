import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Image, Video, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import {
  FacebookIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

const platformIcons = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
};

export default function UpcomingPosts({ posts = [], brands = [] }) {
  const upcomingPosts = posts
    .filter((p) => p.status !== 'published' && p.scheduled_date)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  const getBrandForPost = (post) => {
    return brands.find((b) => b.id === post.brand_id);
  };

  if (upcomingPosts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            Upcoming Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No scheduled posts</p>
          <Link to={createPageUrl('SocialCalendar')}>
            <Button variant="link" className="text-violet-600 mt-2">
              Schedule a post <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" />
          Upcoming Posts
        </CardTitle>
        <Link to={createPageUrl('SocialCalendar')}>
          <Button variant="ghost" size="sm" className="text-violet-600">
            View Calendar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingPosts.map((post) => {
          const brand = getBrandForPost(post);
          return (
            <div
              key={post.id}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              style={{ borderLeft: brand ? `4px solid ${brand.color}` : '4px solid #e5e7eb' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {brand && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${brand.color}20`,
                          color: brand.color,
                          border: `1px solid ${brand.color}40`,
                        }}
                      >
                        {brand.name}
                      </Badge>
                    )}
                    {post.media_type === 'image' && <Image className="w-3 h-3 text-gray-400" />}
                    {post.media_type === 'video' && <Video className="w-3 h-3 text-gray-400" />}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {post.platforms?.slice(0, 3).map((platform, idx) => (
                        <span key={idx} className="inline-flex items-center justify-center">
                          {(() => {
                            const PlatformIcon = platformIcons[platform];
                            return PlatformIcon ? (
                              <PlatformIcon className="w-3.5 h-3.5 text-gray-600" />
                            ) : (
                              <span className="text-xs">•</span>
                            );
                          })()}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(post.scheduled_date).format('MMM D, h:mm A')}
                    </span>
                  </div>
                </div>
                <Badge
                  className={
                    post.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : post.status === 'pending_approval'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                  }
                >
                  {post.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
