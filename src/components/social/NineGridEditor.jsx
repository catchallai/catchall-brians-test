import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableGridItem({ id, post, position, onEdit, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCenter = position === 4; // Center position (0-indexed: position 4 in 0-8 range)

  if (isCenter && !post) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="aspect-square bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 dark:hover:border-violet-500 transition-all cursor-pointer group"
        onClick={onEdit}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-500 dark:bg-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Add Post</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 transition-all group"
        onClick={onEdit}
      >
        <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-violet-500 transition-colors" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer shadow-md hover:shadow-xl transition-all"
      onClick={() => onEdit(post)}
    >
      {post.video_url ? (
        <video 
          src={post.video_url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      ) : post.image_url ? (
        <img src={post.image_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
          <p className="text-white text-center p-4 text-sm line-clamp-3">{post.caption || 'No caption'}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(post);
          }}
          className="bg-white/90 hover:bg-white text-gray-900"
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(position);
          }}
          className="bg-red-500/90 hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NineGridEditor({ posts = [], onPostsChange, onEditPost }) {
  const [activeId, setActiveId] = useState(null);

  // Ensure we have exactly 9 slots
  const gridPosts = Array(9).fill(null).map((_, i) => posts[i] || null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id);
      const newIndex = parseInt(over.id);
      
      const newPosts = [...gridPosts];
      const [movedPost] = newPosts.splice(oldIndex, 1, null);
      
      if (newPosts[newIndex]) {
        // Swap
        newPosts[oldIndex] = newPosts[newIndex];
      }
      newPosts[newIndex] = movedPost;
      
      onPostsChange(newPosts.filter(p => p !== null));
    }
    
    setActiveId(null);
  };

  const handleRemove = (position) => {
    const newPosts = [...gridPosts];
    newPosts[position] = null;
    onPostsChange(newPosts.filter(p => p !== null));
  };

  const handleAddPost = (position) => {
    onEditPost(null, position);
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">9-Grid Layout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Drag posts to rearrange your grid</p>
          </div>
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={gridPosts.map((_, i) => String(i))} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {gridPosts.map((post, index) => (
                <SortableGridItem
                  key={index}
                  id={String(index)}
                  post={post}
                  position={index}
                  onEdit={() => handleAddPost(index)}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId !== null && gridPosts[parseInt(activeId)] && (
              <div className="aspect-square rounded-xl overflow-hidden shadow-2xl opacity-90">
                {gridPosts[parseInt(activeId)].image_url ? (
                  <img 
                    src={gridPosts[parseInt(activeId)].image_url} 
                    alt="Dragging" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <p className="text-white text-center p-4 text-sm">{gridPosts[parseInt(activeId)].caption}</p>
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}