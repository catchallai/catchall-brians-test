import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, DollarSign, TrendingUp, Calendar, Edit, Eye } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

function DealCard({ deal, contact, onClick, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });
  const [isHovered, setIsHovered] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value) => {
    if (!value) {
      return '$0';
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return null;
    }
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return null;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 group relative hover:shadow-md transition-all bg-white dark:bg-gray-800 border-l-4 border-l-violet-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
            {deal.title}
          </p>

          {contact && (
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-[10px]">
                  {contact.first_name?.[0]}
                  {contact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {contact.first_name} {contact.last_name}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(deal.value)}
              </span>
            </div>
            {deal.probability && (
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30">
                {deal.probability}%
              </Badge>
            )}
          </div>

          {deal.expected_close_date && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(deal.expected_close_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 bg-white dark:bg-gray-700 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(deal);
            }}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 bg-white dark:bg-gray-700 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function DealKanbanBoard({
  deals,
  stages,
  stageColors,
  onDragStart,
  onDragOver,
  onDrop,
  onViewDeal,
  onEditDeal,
  getContact,
}) {
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const formatCurrency = (value) => {
    if (!value) {
      return '$0';
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getDealsForStage = (stageId) => deals.filter((d) => d.stage === stageId);
  const getStageValue = (stageId) =>
    getDealsForStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  const getStageWeightedValue = (stageId) => {
    return getDealsForStage(stageId).reduce(
      (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
      0
    );
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedDeal = deals.find((d) => d.id === active.id);

      // Check if dropped over a stage container
      let targetStageId = null;
      if (over.id.startsWith('stage-')) {
        targetStageId = over.id.replace('stage-', '');
      } else {
        // Dropped over another deal, find its stage
        const overDeal = deals.find((d) => d.id === over.id);
        if (overDeal) {
          targetStageId = overDeal.stage;
        }
      }

      if (draggedDeal && targetStageId && draggedDeal.stage !== targetStageId) {
        // Call the original onDrop with fake event
        const fakeEvent = { preventDefault: () => {} };
        onDragStart(fakeEvent, draggedDeal);
        onDrop(fakeEvent, targetStageId);
      }
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {stages.map((stage, index) => {
          const stageId = stage.id;
          const stageName = stage.name || stage.label;
          const stageColor = stage.color || stageColors[index % stageColors.length];
          const stageDeals = getDealsForStage(stageId);
          const stageValue = getStageValue(stageId);
          const weightedValue = getStageWeightedValue(stageId);

          return (
            <SortableContext
              key={stageId}
              id={`stage-${stageId}`}
              items={stageDeals.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className={`min-w-[300px] max-w-[300px] rounded-xl ${stageColor} p-4 flex flex-col`}
                onDragOver={onDragOver}
              >
                {/* Stage Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stageName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{formatCurrency(stageValue)}</span>
                    </div>
                    {stageId !== 'won' && stageId !== 'lost' && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs">{formatCurrency(weightedValue)} weighted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deals List */}
                <div className="space-y-3 flex-1 min-h-[200px]">
                  {stageDeals.map((deal) => {
                    const contact = getContact(deal.contact_id);
                    return (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        contact={contact}
                        onClick={() => onViewDeal(deal)}
                        onEdit={onEditDeal}
                      />
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">Drop deals here</div>
                  )}
                </div>
              </div>
            </SortableContext>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal ? (
          <Card className="p-3 w-[280px] shadow-2xl bg-white dark:bg-gray-800 border-l-4 border-l-violet-500 opacity-90">
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {activeDeal.title}
              </p>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(activeDeal.value)}
                </span>
              </div>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
