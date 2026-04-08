import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { PLATFORM_MAP, PLATFORM_MAP_LOWER } from '@/constants/platforms';

export default function PlatformGridView({ posts = [], onAddPost, onEditPost, onDeletePost }) {
  // Expand posts to individual platform posts
  const platformPosts = posts.flatMap((post) => {
    if (!post.platforms || post.platforms.length === 0) {
      return [{ ...post, platform: 'none', originalPost: post }];
    }
    return post.platforms.map((platform) => ({
      ...post,
      platform,
      originalPost: post,
    }));
  });

  // Group by platform
  const groupedByPlatform = {};
  platformPosts.forEach((post) => {
    const platform = post.platform || 'none';
    if (!groupedByPlatform[platform]) {
      groupedByPlatform[platform] = [];
    }
    groupedByPlatform[platform].push(post);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedByPlatform).map(([platform, platformPostsList]) => {
        const platformEntry = PLATFORM_MAP[platform] ?? PLATFORM_MAP_LOWER[platform?.toLowerCase()];
        const PlatformIcon = platformEntry?.icon;
        const platformBg =
          platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';
        const platformLabel = platformEntry?.label || platform || 'No Platform';

        return (
          <Card key={platform} className="p-6 border-2">
            {/* Platform Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${platformBg} flex items-center justify-center shadow-lg`}
                >
                  {PlatformIcon && <PlatformIcon size={24} color="white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {platformLabel}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {platformPostsList.length} posts scheduled
                  </p>
                </div>
              </div>
              <Button onClick={onAddPost} className="gap-2">
                <Plus className="w-4 h-4" />
                Add {platformLabel} Post
              </Button>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {platformPostsList.map((post) => (
                <Card
                  key={`${post.id}-${post.platform}`}
                  className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2"
                  onClick={() => onEditPost(post.originalPost, post.platform)}
                >
                  {/* Media Preview */}
                  {post.image_url && (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {post.video_url && !post.image_url && (
                    <div className="aspect-square bg-gray-900 flex items-center justify-center">
                      <div className="text-white text-4xl">▶️</div>
                    </div>
                  )}
                  {!post.image_url && !post.video_url && (
                    <div
                      className={`aspect-square ${platformBg} flex items-center justify-center opacity-20`}
                    >
                      {PlatformIcon && <PlatformIcon size={64} color="white" />}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {post.title || 'Untitled Post'}
                      </h4>
                      <Badge
                        className={`${
                          post.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : post.status === 'approved'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {post.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.caption || 'No caption'}
                    </p>

                    {post.scheduled_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.scheduled_date), 'MMM d, yyyy')}
                        {post.scheduled_time && ` at ${post.scheduled_time}`}
                      </div>
                    )}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {post.hashtags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.hashtags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPost(post.originalPost, post.platform);
                      }}
                      className="gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePost(post.originalPost);
                      }}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {platformPostsList.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <p className="text-lg mb-2">No posts scheduled for {platformLabel}</p>
                <Button variant="outline" onClick={onAddPost} className="gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Create First Post
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
