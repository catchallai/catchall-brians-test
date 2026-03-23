import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const platforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'];

export default function DraftPostsPlatformAssigner({ posts = [], onUpdatePost }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const draftPostsWithoutPlatforms = posts.filter(
    (p) => p.status === 'draft' && (!p.platforms || p.platforms.length === 0)
  );

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setSelectedPlatforms(post.platforms || []);
  };

  const togglePlatform = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleSave = () => {
    if (selectedPost && selectedPlatforms.length > 0) {
      onUpdatePost({ id: selectedPost.id, platforms: selectedPlatforms });
      setSelectedPost(null);
      setSelectedPlatforms([]);
    }
  };

  if (draftPostsWithoutPlatforms.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                {draftPostsWithoutPlatforms.length} Draft Post
                {draftPostsWithoutPlatforms.length !== 1 ? 's' : ''} Missing Platforms
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                These posts won't appear in the platform view until you assign them to social media
                platforms.
              </p>
              <div className="flex flex-wrap gap-2">
                {draftPostsWithoutPlatforms.map((post) => (
                  <Button
                    key={post.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectPost(post)}
                    className="gap-2 bg-white dark:bg-gray-800"
                  >
                    {post.title || 'Untitled'}
                    <span className="text-xs text-gray-500">
                      ({format(new Date(post.scheduled_date), 'MMM d')})
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Platforms to "{selectedPost?.title || 'Untitled'}"</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select which platforms to post this to:
              </p>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <Badge
                    key={platform}
                    className={`cursor-pointer px-4 py-2 ${
                      selectedPlatforms.includes(platform)
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">PREVIEW</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Scheduled:{' '}
                {selectedPost && format(new Date(selectedPost.scheduled_date), 'MMM d, yyyy')} at{' '}
                {selectedPost?.scheduled_time || '09:00'}
              </p>
              {selectedPost?.caption && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {selectedPost.caption}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedPlatforms.length === 0}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Assign & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
