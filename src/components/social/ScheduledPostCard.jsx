import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Sparkles, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  posted: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export default function ScheduledPostCard({ post, onEdit, onDelete }) {
  const platformEntry = PLATFORM_MAP_LOWER[post.platform];
  const PlatformIcon = platformEntry?.icon;
  const platformBg = platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';

  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${platformBg} flex items-center justify-center`}>
            {PlatformIcon && <PlatformIcon size={14} color="white" />}
          </div>
          <div>
            <Badge className={`${statusColors[post.status]} text-xs border-0`}>{post.status}</Badge>
            {post.ai_optimized && (
              <Badge className="bg-violet-100 text-violet-700 text-xs border-0 ml-1">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(post)}>
            <Edit className="w-4 h-4 text-gray-400" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(post.id)}>
            <Trash2 className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-3">{post.content}</p>

      {post.hashtags?.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-xs text-blue-600">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.scheduled_time && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {format(new Date(post.scheduled_time), 'MMM d, yyyy')}
          <Clock className="w-3 h-3 ml-2" />
          {format(new Date(post.scheduled_time), 'h:mm a')}
        </div>
      )}
    </Card>
  );
}
