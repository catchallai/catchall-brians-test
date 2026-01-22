import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableGridItem({ id, posts = [], position, onEdit, onAddPost }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 min-h-[400px] overflow-y-auto"
    >
      <div className="space-y-3">
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onEdit(post)}
          >
            {post.image_url ? (
              <img src={post.image_url} alt={post.caption || 'Post'} className="w-full h-32 object-cover" />
            ) : post.video_url ? (
              <video 
                src={post.video_url}
                className="w-full h-32 object-cover"
                muted
                playsInline
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <p className="text-white text-center p-2 text-xs line-clamp-3">{post.caption || 'No caption'}</p>
              </div>
            )}
            {post.caption && (
              <div className="p-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{post.caption}</p>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => onAddPost(position)}
          className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Post
        </button>
      </div>
    </div>
  );
}

export default function NineGridEditor({ posts = [], onPostsChange, onEditPost }) {
  // Split posts into 9 categories
  const postsPerGrid = 9;
  const gridAreas = Array(9).fill(null).map((_, gridIndex) => {
    const start = gridIndex * postsPerGrid;
    const end = start + postsPerGrid;
    return posts.slice(start, end);
  });

  const handleAddPost = (gridPosition) => {
    onEditPost(null, gridPosition);
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">9-Grid Layout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Posts organized in 9 sections</p>
          </div>
        </div>

        <DndContext collisionDetection={closestCenter}>
          <SortableContext items={Array(9).fill(null).map((_, i) => String(i))} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {gridAreas.map((gridPosts, gridIndex) => (
                <SortableGridItem
                  key={gridIndex}
                  id={String(gridIndex)}
                  posts={gridPosts}
                  position={gridIndex}
                  onEdit={onEditPost}
                  onAddPost={handleAddPost}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}