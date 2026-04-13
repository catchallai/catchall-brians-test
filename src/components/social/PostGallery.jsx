import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPrimaryPostImageUrl } from '@/utils/postMedia';

function SortableGalleryItem({ id, post, onRemove }) {
  const { setNodeRef, transform, transition, isDragging, listeners, attributes } = useSortable({
    id,
  });
  const primaryImageUrl = getPrimaryPostImageUrl(post);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex-shrink-0"
      {...listeners}
      {...attributes}
    >
      <div className="w-24 h-24 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border-2 border-violet-200 dark:border-violet-800">
        {primaryImageUrl ? (
          <img src={primaryImageUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : post.video_url ? (
          <video src={post.video_url} className="w-full h-full object-cover" muted />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center p-1">
            <p className="text-white text-xs font-medium text-center line-clamp-2">
              {post.caption || post.title}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(post.id)}
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function PostGallery({ posts = [], onPostsChange, onDragOver: _onDragOver }) {
  // TODO: [WIP] activeId will drive a DragOverlay to render a drag preview.
  // Uncomment when DragOverlay is implemented.
  // const [_activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  const handleDragStart = (_event) => {
    // TODO: [WIP] setActiveId(_event.active.id) — uncomment when DragOverlay is implemented.
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = posts.findIndex((p) => p.id === active.id);
      const newIndex = posts.findIndex((p) => p.id === over.id);

      const newPosts = [...posts];
      [newPosts[oldIndex], newPosts[newIndex]] = [newPosts[newIndex], newPosts[oldIndex]];

      onPostsChange(newPosts);
    }

    // TODO: [WIP] setActiveId(null) — uncomment when DragOverlay is implemented.
  };

  const handleRemove = (postId) => {
    onPostsChange(posts.filter((p) => p.id !== postId));
  };

  return (
    <Card className="glass-card rounded-2xl mt-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Post Gallery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag posts here to hold them while rearranging
            </p>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {posts.length} posts
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-gray-400 dark:text-gray-500">Drag posts here to hold them</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <ScrollArea className="h-32 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
              <SortableContext
                items={posts.map((p) => p.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-3">
                  {posts.map((post) => (
                    <SortableGalleryItem
                      key={post.id}
                      id={post.id}
                      post={post}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </ScrollArea>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
