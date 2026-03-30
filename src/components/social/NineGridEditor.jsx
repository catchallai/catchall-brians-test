import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseISO } from 'date-fns';
import PostStatusChip from './PostStatusChip';
import { PostStatus } from '@/types/enums';
import { useToast } from '@/components/ui/toast-provider';
import COPY from '@/lib/copy';

function SortableGridItem({ id, post, position, onAddPost, onEditPost }) {
  // disable dragging for empty slots and published posts
  const isDisabled = !post || post.status === PostStatus.PUBLISHED;

  const { setNodeRef, transform, transition, isDragging, listeners, attributes } = useSortable({
    id,
    disabled: isDisabled,
  });

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
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {COPY.socialCalendar.addPost}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {COPY.socialCalendar.clickToCreate}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`aspect-square rounded-xl overflow-hidden relative group shadow-md hover:shadow-xl transition-all ${isDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      title={
        isDisabled
          ? COPY.socialCalendar.hoverPublishedPostHelperText
          : COPY.socialCalendar.hoverPostHelperText
      }
    >
      {/* Status chip in upper left */}
      <div className="absolute top-2 left-2 z-10">
        <PostStatusChip status={post.status} />
      </div>
      {post.image_url ? (
        <img
          src={post.image_url}
          alt={post.caption || 'Post'}
          className="w-full h-full object-cover"
        />
      ) : post.video_url ? (
        <video src={post.video_url} className="w-full h-full object-cover" muted playsInline />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
          <p className="text-white text-center p-4 text-sm font-medium line-clamp-3">
            {post.caption || 'No caption'}
          </p>
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
        <div className="w-full p-2">
          {post.scheduled_date && (
            <p className="text-white text-xs font-medium bg-black/50 rounded px-1.5 py-0.5 inline-block">
              {parseISO(post.scheduled_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NineGridEditor({
  posts = [],
  onPostsChange,
  onEditPost,
  onAddPost,
  baseScheduleDate = null,
}) {
  const [activeId, setActiveId] = useState(null);
  const [localSlots, setLocalSlots] = useState(null); // optimistic local state
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const toast = useToast();

  // Place each post into its grid tile based on post.order (0-8).
  // Posts without a valid order or with an order outside the grid range are skipped.
  const baseSlots = Array(9).fill(null);
  posts.forEach((post) => {
    const idx = post.order ?? -1;
    if (idx >= 0 && idx < 9) {
      baseSlots[idx] = post;
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
    // If dropped outside of any droppable area, or dropped back to original position, reset and exit
    if (!over || !active) {
      setActiveId(null);
      setLocalSlots(null);
      return;
    }

    const activeIndex = parseInt(active.id);
    const overIndex = parseInt(over.id);

    // Prevent dragging published posts
    if (gridSlots[overIndex] && gridSlots[overIndex].status === PostStatus.PUBLISHED) {
      toast.error(COPY.socialCalendar.toasts.error.publishedPost);
      setActiveId(null);
      setLocalSlots(null);
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = activeIndex;
      const newIndex = overIndex;
      const newSlots = [...gridSlots];
      [newSlots[oldIndex], newSlots[newIndex]] = [newSlots[newIndex], newSlots[oldIndex]];

      // Update order to reflect new tile positions, preserve scheduled dates
      const updatedSlots = newSlots.map((post, idx) => {
        if (!post) {
          return null;
        }
        return {
          ...post,
          order: idx,
        };
      });

      // Optimistically update UI
      const prevSlots = localSlots || baseSlots;
      setLocalSlots(updatedSlots);
      // TODO: We could optimize by only sending changed posts to backend instead of all 9
      Promise.resolve(onPostsChange(updatedSlots.filter((p) => p !== null))).catch((_err) => {
        setLocalSlots(prevSlots); // revert to previous state
        toast.error(COPY.socialCalendar.toasts.error.reorderPosts);
      });
    }
    setActiveId(null);
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {COPY.socialCalendar.nineGridTitle}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {COPY.socialCalendar.nineGridDescription}
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={gridSlots.map((_, i) => String(i))}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-4">
              {gridSlots.map((post, index) => (
                <SortableGridItem
                  key={index}
                  id={String(index)}
                  post={post}
                  position={index}
                  onAddPost={() => handleAddPost(index)}
                  onEditPost={handleEditPost}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePost && (
              <div className="aspect-square rounded-xl overflow-hidden shadow-2xl opacity-90 w-40">
                {activePost.image_url ? (
                  <img
                    src={activePost.image_url}
                    alt="Dragging"
                    className="w-full h-full object-cover"
                  />
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
