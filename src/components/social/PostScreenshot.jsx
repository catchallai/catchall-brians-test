import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';

const platformStyles = {
  twitter: {
    bg: 'bg-black',
    text: 'text-white',
    accent: 'text-blue-400',
    icon: TwitterIcon,
  },
  linkedin: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-blue-600',
    icon: LinkedInIcon,
  },
  facebook: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-blue-500',
    icon: FacebookIcon,
  },
  instagram: {
    bg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    text: 'text-white',
    accent: 'text-pink-300',
    icon: InstagramIcon,
  },
  youtube: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-red-600',
    icon: YouTubeIcon,
  },
};

export default function PostScreenshot({
  post,
  accountName,
  platform = 'twitter',
  className = '',
}) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const style = platformStyles[platform] || platformStyles.twitter;
  const PlatformIcon = style.icon;
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  // Render a mock social media post preview
  const PostPreview = ({ fullSize = false }) => (
    <div className={`${style.bg} rounded-lg overflow-hidden ${fullSize ? 'p-6' : 'p-3'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`${fullSize ? 'w-12 h-12' : 'w-8 h-8'} rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600`}
        >
          {accountName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className={`font-semibold ${style.text} ${fullSize ? 'text-base' : 'text-sm'}`}>
            @{accountName || 'username'}
          </p>
          <p
            className={`text-xs ${platform === 'twitter' || platform === 'instagram' ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {post?.post_date ? new Date(post.post_date).toLocaleDateString() : 'Just now'}
          </p>
        </div>
        <div className="ml-auto">
          <PlatformIcon className={fullSize ? 'w-7 h-7' : 'w-5 h-5'} />
        </div>
      </div>

      {/* Content */}
      <div
        className={`${style.text} ${fullSize ? 'text-base mb-4' : 'text-sm mb-3'} ${fullSize ? '' : 'line-clamp-3'}`}
      >
        {post?.content || 'Post content preview...'}
      </div>

      {/* Media placeholder */}
      {post?.image_url && (
        <div className="rounded-lg overflow-hidden mb-3">
          <img src={post.image_url} alt="Post media" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Engagement */}
      <div
        className={`flex items-center gap-4 pt-3 border-t ${platform === 'twitter' || platform === 'instagram' ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <span
          className={`flex items-center gap-1 ${fullSize ? 'text-sm' : 'text-xs'} ${platform === 'twitter' || platform === 'instagram' ? 'text-gray-400' : 'text-gray-500'}`}
        >
          ❤️ {(post?.likes || 0).toLocaleString()}
        </span>
        <span
          className={`flex items-center gap-1 ${fullSize ? 'text-sm' : 'text-xs'} ${platform === 'twitter' || platform === 'instagram' ? 'text-gray-400' : 'text-gray-500'}`}
        >
          💬 {(post?.comments || 0).toLocaleString()}
        </span>
        <span
          className={`flex items-center gap-1 ${fullSize ? 'text-sm' : 'text-xs'} ${platform === 'twitter' || platform === 'instagram' ? 'text-gray-400' : 'text-gray-500'}`}
        >
          🔄 {(post?.shares || 0).toLocaleString()}
        </span>
      </div>

      {/* Topics/Hashtags */}
      {post?.topics?.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-2 ${fullSize ? '' : 'max-h-6 overflow-hidden'}`}>
          {post.topics.slice(0, fullSize ? 10 : 3).map((topic, i) => (
            <span key={i} className={`${style.accent} ${fullSize ? 'text-sm' : 'text-xs'}`}>
              #{topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`relative rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={() => setShowFullscreen(true)}
      >
        <PostPreview />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button size="sm" variant="secondary" className="gap-1 text-xs">
            <Maximize2 className="w-3 h-3" />
            View Full
          </Button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlatformIcon className="w-5 h-5" />
              Post Preview
              <span className="sr-only">{platformLabel}</span>
            </DialogTitle>
          </DialogHeader>
          <PostPreview fullSize />
        </DialogContent>
      </Dialog>
    </>
  );
}
