import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableGridItem({ id, post, gridLabel, onEdit, onAddPost, position, onDragStart }) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    listeners,
    attributes,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };



  if (!post) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 transition-all group"
        onClick={() => onAddPost(position)}
      >
        <div className="text-center">
          <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-violet-500 transition-colors mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Add Post</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="aspect-square rounded-xl overflow-hidden relative group shadow-md hover:shadow-xl transition-all cursor-grab active:cursor-grabbing"
      {...listeners}
      {...attributes}
      title="Drag to move or hold and drag outside grid to the Post Gallery"
    >
      {post.image_url ? (
        <img src={post.image_url} alt={post.caption || 'Post'} className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900" />
      ) : post.video_url ? (
        <video 
          src={post.video_url}
          className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900"
          muted
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
          <p className="text-white text-center p-4 text-sm font-medium line-clamp-3">{post.caption || 'No caption'}</p>
        </div>
      )}
      

    </div>
  );
}

export default function NineGridEditor({ posts = [], onPostsChange, onEditPost, onPostDateChange, gridLabels = [], baseScheduleDate = null }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  // Ensure we have exactly 9 slots - take the first post from each group of posts
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
      [newPosts[oldIndex], newPosts[newIndex]] = [newPosts[newIndex], newPosts[oldIndex]];
      
      // Calculate new date if post moved and callback is provided
      if (newPosts[newIndex] && onPostDateChange && baseScheduleDate) {
        const dayInterval = 3;
        const newDate = new Date(baseScheduleDate);
        newDate.setDate(newDate.getDate() + (newIndex * dayInterval));
        onPostDateChange(newPosts[newIndex].id, newDate.toISOString());
      }
      
      onPostsChange(newPosts.filter(p => p !== null));
    }
    
    setActiveId(null);
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Drag posts to rearrange</p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
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
                  gridLabel={gridLabels[index]}
                  position={index}
                  onEdit={onEditPost}
                  onAddPost={handleAddPost}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId !== null && gridPosts[parseInt(activeId)] && (
              <div className="aspect-square rounded-xl overflow-hidden shadow-2xl opacity-90 max-w-xs">
                {gridPosts[parseInt(activeId)].image_url ? (
                   <img 
                     src={gridPosts[parseInt(activeId)].image_url} 
                     alt="Dragging" 
                     className="w-full h-full object-contain" 
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