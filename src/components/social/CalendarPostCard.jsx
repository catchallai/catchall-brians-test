import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Image, Play, Send, Zap } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CalendarPostCard({ post, onEdit, onDelete, compact = false }) {
  const queryClient = useQueryClient();

  const publishNowMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoPostToSocial', { postId: post.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    published: 'bg-blue-100 text-blue-700'
  };

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group">
      {/* Media with Title Overlay */}
      <div className="relative aspect-square bg-gray-100">
        {post.video_url ? (
          <div className="relative w-full h-full">
            <video 
              src={post.video_url} 
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Title Overlay */}
        {post.title && (
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
              <h3 className="text-white font-bold text-sm leading-tight uppercase tracking-wide">
                {post.title}
              </h3>
            </div>
          </div>
        )}

        {/* Brand Watermark */}
        <div className="absolute bottom-2 right-2">
          <span className="text-white/80 text-xs font-semibold tracking-wider">
            CATCHALL
          </span>
        </div>

        {/* Edit/Delete/Publish Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {post.status === 'scheduled' && post.auto_post && (
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-7 w-7 bg-emerald-500/90 hover:bg-emerald-600 text-white"
              onClick={(e) => { e.stopPropagation(); publishNowMutation.mutate(); }}
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
              onClick={(e) => { e.stopPropagation(); onEdit(post); }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-7 w-7 bg-white/90 hover:bg-white text-red-600"
              onClick={(e) => { e.stopPropagation(); onDelete(post); }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className={`${statusColors[post.status]} text-xs`}>
            {post.status?.replace('_', ' ')}
          </Badge>
          {post.auto_post && (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              Auto-Post
            </Badge>
          )}
          <Badge className="bg-violet-100 text-violet-700 text-xs">
            {post.platforms && post.platforms.length > 0 ? post.platforms.join(', ') : 'No platform'}
          </Badge>
        </div>
      </div>

      {/* Caption */}
      {!compact && post.caption && (
        <div className="p-3 bg-white">
          <p className="text-xs text-gray-600 line-clamp-3">{post.caption}</p>
        </div>
      )}
    </Card>
  );
}