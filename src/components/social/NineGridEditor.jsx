import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableGridItem({ id, post, position, onAddPost, onEditPost }) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    listeners,
    attributes,
  } = useSortable({ id, disabled: !post || position === 0 }); // Can't drag from position 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const clickTimer = useRef(null);

  const handleClick = () => {
    if (!post) {
      // Single click on empty = create new post
      onAddPost(position);
      return;
    }
    // Single click on filled = edit
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      // Double click = preview (same as edit for now, differentiated by flag)
      onEditPost(post, true);
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      onEditPost(post, false);
    }, 220);
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Click to create</p>
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
      onClick={handleClick}
      title="Click to edit · Double-click to preview · Drag to reorder"
    >
      {post.image_url ? (
        <img src={post.image_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
      ) : post.video_url ? (
        <video
          src={post.video_url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
          <p className="text-white text-center p-4 text-sm font-medium line-clamp-3">{post.caption || 'No caption'}</p>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
        <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-all">
          {post.scheduled_date && (
            <p className="text-white text-xs font-medium bg-black/50 rounded px-1.5 py-0.5 inline-block">
              {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NineGridEditor({ posts = [], onPostsChange, onEditPost, onAddPost, baseScheduleDate = null }) {
  const [activeId, setActiveId] = useState(null);
  const [localSlots, setLocalSlots] = useState(null); // optimistic local state

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Map posts to their existing positions in the grid (1-8, top-left always empty)
  // Don't auto-sort by date
  const baseSlots = Array(9).fill(null);
  posts.slice(0, 8).forEach((post, i) => {
    // If post has a gridPosition, use it; otherwise assign sequentially starting from position 1
    if (post.gridPosition !== undefined && post.gridPosition >= 1 && post.gridPosition <= 8) {
      baseSlots[post.gridPosition] = post;
    } else {
      // Find first available slot starting from position 1
      for (let j = 1; j < 9; j++) {
        if (!baseSlots[j]) {
          baseSlots[j] = post;
          break;
        }
      }
    }
  });

  // Use local optimistic slots while dragging, otherwise use computed slots
  const gridSlots = localSlots || baseSlots;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setLocalSlots([...baseSlots]); // snapshot current state
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id);
      const newIndex = parseInt(over.id);
      
      // Don't allow dragging to position 0 (top-left is reserved for "Add Post")
      if (newIndex === 0) {
        setActiveId(null);
        setLocalSlots(null);
        return;
      }

      const newSlots = [...gridSlots];
      [newSlots[oldIndex], newSlots[newIndex]] = [newSlots[newIndex], newSlots[oldIndex]];
      
      // Update scheduled date and gridPosition based on new slot position
      const updatedSlots = newSlots.map((post, idx) => {
        if (!post) return null;
        // Calculate new date based on grid position
        // Position 1-8 maps to days 0-7 from a base date
        const base = baseScheduleDate ? new Date(baseScheduleDate) : new Date();
        const newDate = new Date(base);
        newDate.setDate(newDate.getDate() + (idx - 1)); // offset by 1 since position 0 is empty
        
        return {
          ...post,
          scheduled_date: newDate.toISOString().split('T')[0],
          gridPosition: idx, // store grid position
        };
      });
      
      setLocalSlots(updatedSlots); // instant UI update
      onPostsChange(updatedSlots.filter(p => p !== null)); // async backend save
    }
    setActiveId(null);
    setLocalSlots(null);
  };

  const handleAddPost = (position) => {
    // Calculate a suggested date based on position if baseScheduleDate exists
    let suggestedDate = null;
    if (baseScheduleDate) {
      const base = new Date(baseScheduleDate);
      base.setDate(base.getDate() + position * 3);
      suggestedDate = base.toISOString().split('T')[0];
    }
    onAddPost(position, suggestedDate);
  };

  const handleEditPost = (post, isPreview) => {
    onEditPost(post, isPreview);
  };

  const activePost = activeId !== null ? gridSlots[parseInt(activeId)] : null;

  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">9-Grid Layout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Top-left reserved for adding · Drag to reorder and auto-update dates · Click post to edit
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={gridSlots.map((_, i) => String(i))} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {gridSlots.map((post, index) => (
                <SortableGridItem
                  key={index}
                  id={String(index)}
                  post={post}
                  position={index}
                  onAddPost={handleAddPost}
                  onEditPost={handleEditPost}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePost && (
              <div className="aspect-square rounded-xl overflow-hidden shadow-2xl opacity-90 w-40">
                {activePost.image_url ? (
                  <img src={activePost.image_url} alt="Dragging" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <p className="text-white text-center p-4 text-sm">{activePost.caption}</p>
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