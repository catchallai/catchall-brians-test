import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GripVertical, X, Maximize2, Minimize2, Settings2, Plus,
  TrendingUp, Target, Link2, Share2, Eye, Users, PieChart, BarChart2
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DraggableDashboard({ 
  widgets = [],
  availableWidgets = [],
  activeWidgetIds = [],
  widgetSizes = {},
  onWidgetsReorder,
  onWidgetRemove,
  onWidgetAdd,
  onWidgetResize,
  renderWidget
}) {
  const [expandedWidget, setExpandedWidget] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(activeWidgetIds);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onWidgetsReorder(items);
  };

  const toggleExpand = (widgetId) => {
    setExpandedWidget(expandedWidget === widgetId ? null : widgetId);
  };

  const getWidgetSize = (widgetId) => {
    return widgetSizes[widgetId] || 'medium';
  };

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1',
    large: 'col-span-1 lg:col-span-2',
    full: 'col-span-1 lg:col-span-2'
  };

  const heightClasses = {
    small: 'h-64',
    medium: 'h-80',
    large: 'h-96',
    full: 'h-[500px]'
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {activeWidgetIds.length} widgets
          </Badge>
          <span className="text-sm text-gray-500">Drag to reorder</span>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Widget
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Available Widgets</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableWidgets.map(widget => {
                const isActive = activeWidgetIds.includes(widget.id);
                const Icon = widget.icon;
                return (
                  <label 
                    key={widget.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-violet-50 dark:bg-violet-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Checkbox 
                      checked={isActive}
                      onCheckedChange={() => {
                        if (isActive) {
                          onWidgetRemove(widget.id);
                        } else {
                          onWidgetAdd(widget.id);
                        }
                      }}
                    />
                    {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{widget.name}</span>
                      {widget.description && (
                        <p className="text-xs text-gray-500">{widget.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Draggable Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 transition-colors ${
                snapshot.isDraggingOver ? 'bg-violet-50 dark:bg-violet-900/10 p-2 rounded-xl' : ''
              }`}
            >
              {activeWidgetIds.map((widgetId, index) => {
                const widget = availableWidgets.find(w => w.id === widgetId);
                if (!widget) return null;
                
                const size = getWidgetSize(widgetId);
                const isExpanded = expandedWidget === widgetId;
                const Icon = widget.icon;

                return (
                  <Draggable key={widgetId} draggableId={widgetId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${isExpanded ? 'col-span-1 lg:col-span-2 xl:col-span-2' : sizeClasses[size]} ${
                          snapshot.isDragging ? 'z-50' : ''
                        }`}
                      >
                        <Card 
                          className={`h-full border shadow-md bg-white dark:bg-gray-800 transition-all ${
                            snapshot.isDragging ? 'shadow-2xl ring-2 ring-violet-500 scale-105' : 'hover:shadow-lg'
                          }`}
                        >
                          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div 
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>
                              {Icon && <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
                              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {widget.name}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Select 
                                value={size} 
                                onValueChange={(newSize) => onWidgetResize(widgetId, newSize)}
                              >
                                <SelectTrigger className="h-7 w-20 text-xs border-0 bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => toggleExpand(widgetId)}
                              >
                                {isExpanded ? (
                                  <Minimize2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Maximize2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-gray-400 hover:text-red-500"
                                onClick={() => onWidgetRemove(widgetId)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className={`p-4 overflow-hidden ${isExpanded ? 'h-[500px]' : heightClasses[size]}`}>
                            <div className="h-full w-full">
                              {renderWidget(widget, { isExpanded, size })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {activeWidgetIds.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart2 className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No widgets added</h3>
            <p className="text-sm text-gray-500 mb-4">Add widgets to customize your dashboard</p>
            <Button onClick={() => onWidgetAdd(availableWidgets[0]?.id)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}