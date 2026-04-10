import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Image, Play, Send, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PostStatusChip from '@/components/social/PostStatusChip';
import Tooltip from '@/components/ui-custom/Tooltip';
import { PlatformBadges } from '@/components/ui/PlatformBadges';
import { TagPill } from '@/components/social/tags/TagPill';
import { getPrimaryPostImageUrl } from '@/utils/postMedia';

export default function CalendarPostCard({
  post,
  onEdit,
  onDelete,
  compact = false,
  showDeleteButton = false,
  allTags = [],
}) {
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const postTagIds = post.tag_ids || [];
  const postTags = allTags.filter((t) => postTagIds.includes(t.id));
  const primaryImageUrl = getPrimaryPostImageUrl(post);

  const publishNowMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoPostToSocial', { postId: post.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group">
      {/* Media */}
      <div className="relative aspect-square bg-gray-100">
        {post.video_url ? (
          <div className="relative w-full h-full">
            <video src={post.video_url} className="w-full h-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : primaryImageUrl ? (
          <img src={primaryImageUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Title overlay — full width, no platform dots competing */}
        {post.title && (
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
              <Tooltip content={post.title} side="top">
                <h3 className="text-white font-bold text-sm leading-tight uppercase tracking-wide truncate">
                  {post.title}
                </h3>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Top-left: status chip, auto-post badge, platform dots */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          <PostStatusChip status={post.status} />
          {post.auto_post && (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              Auto-Post
            </Badge>
          )}
          {post.platforms && post.platforms.length > 0 && (
            <div className="bg-black/45 backdrop-blur-sm rounded-full px-1.5 py-1">
              <PlatformBadges platforms={post.platforms} size="sm" />
            </div>
          )}
        </div>

        {/* Scheduled date chip — bottom right */}
        {post.scheduled_date && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {format(parseISO(post.scheduled_date), 'MMM d')}
          </div>
        )}

        {/* Top-right: action buttons */}
        <div
          className={`absolute top-2 right-2 flex gap-1 transition-opacity ${showDeleteButton ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {post.status === 'scheduled' && post.auto_post && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-emerald-500/90 hover:bg-emerald-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                publishNowMutation.mutate();
              }}
              disabled={publishNowMutation.isPending}
              title="Publish Now"
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post);
              }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-white/90 hover:bg-white text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(true);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Inline delete confirmation overlay */}
        {confirmingDelete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
            <p className="text-white text-sm font-semibold">Delete this post?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white bg-transparent hover:bg-white/10"
                onClick={(/** @type {React.MouseEvent} */ e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={(/** @type {React.MouseEvent} */ e) => {
                  e.stopPropagation();
                  onDelete(post);
                  setConfirmingDelete(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      {!compact && post.caption && (
        <div className="p-3 bg-white">
          <p className="text-xs text-gray-600 line-clamp-3">{post.caption}</p>
        </div>
      )}

      {/* Tags — only shown in non-compact (non-grid) views. The grid view renders
          tags below the caption in SocialCalendar.jsx for correct visual placement. */}
      {!compact && postTags.length > 0 && (
        <div className="px-3 pb-3 bg-white flex flex-wrap gap-1">
          {postTags.slice(0, 3).map((tag) => (
            <TagPill key={tag.id} tag={tag} size="sm" />
          ))}
          {postTags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              +{postTags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
