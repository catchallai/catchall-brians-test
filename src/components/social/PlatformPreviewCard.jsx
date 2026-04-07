import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2, Calendar } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';
import { format, parseISO } from 'date-fns';

const PLATFORM_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
};

const PLATFORM_COLORS = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
  linkedin: 'bg-blue-700',
  twitter: 'bg-sky-500',
  youtube: 'bg-red-600',
};

export default function PlatformPreviewCard({ platform, posts, onEditPost }) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] || Calendar;
  const colorClass = PLATFORM_COLORS[platform.toLowerCase()] || 'bg-violet-600';

  // Get the first 9 posts for this platform
  const platformPosts = posts
    .filter(
      (post) =>
        post.platforms &&
        Array.isArray(post.platforms) &&
        post.platforms.some((p) => p.toLowerCase() === platform.toLowerCase())
    )
    .slice(0, 9);

  return (
    <>
      <Card
        className="glass-card rounded-2xl hover:shadow-xl transition-all cursor-pointer border-2 hover:border-violet-300"
        onClick={() => setShowDetailModal(true)}
      >
        <CardHeader className={`${colorClass} text-white rounded-t-2xl p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <CardTitle className="text-lg font-bold capitalize">{platform}</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {platformPosts.length} posts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Layout Thumbnail Preview */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, index) => {
              const post = platformPosts[index];
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-lg overflow-hidden ${
                    post
                      ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {post ? (
                    post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                        <Calendar className="w-6 h-6 text-violet-400" />
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-300 dark:text-gray-600 text-xs">Empty</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to view and edit all posts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${colorClass} p-3 rounded-xl`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl capitalize">{platform} Posts</DialogTitle>
                <p className="text-gray-500">{platformPosts.length} scheduled posts</p>
              </div>
            </div>
          </DialogHeader>

          {/* Grid of all posts for this platform */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {platformPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.caption || 'Post'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                      <Calendar className="w-12 h-12 text-violet-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(parseISO(post.scheduled_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {post.caption && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {post.caption}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      onEditPost(post);
                      setShowDetailModal(false);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Post
                  </Button>
                </CardContent>
              </Card>
            ))}

            {platformPosts.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No {platform} posts scheduled
                </h3>
                <p className="text-gray-500">Create posts and assign them to {platform}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
