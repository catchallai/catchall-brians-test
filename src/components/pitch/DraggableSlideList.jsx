import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Sparkles } from 'lucide-react';

function SortableSlide({ slide, index, branding, onEdit, onDelete, onAIEnhance }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="group relative overflow-hidden cursor-pointer"
        style={{
          borderLeft: `4px solid ${branding?.primary_color || '#7c3aed'}`,
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </div>

            {/* Slide Number */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                backgroundColor: branding?.primary_color || '#7c3aed',
                color: 'white',
              }}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0" onClick={() => onEdit(index)}>
              <h4
                className="font-semibold text-base mb-1 truncate"
                style={{
                  color: branding?.primary_color || '#7c3aed',
                  fontFamily: branding?.font_heading || 'Inter',
                }}
              >
                {slide.title || 'Untitled Slide'}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">
                {slide.content?.description || slide.content?.text || `${slide.type} slide`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAIEnhance(index);
                }}
                className="h-8 w-8 p-0 text-violet-600 hover:bg-violet-50"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(index);
                }}
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DraggableSlideList({
  slides,
  branding,
  onReorder,
  onEdit,
  onDelete,
  onAIEnhance,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onReorder(newSlides);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              index={index}
              branding={branding}
              onEdit={onEdit}
              onDelete={onDelete}
              onAIEnhance={onAIEnhance}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
