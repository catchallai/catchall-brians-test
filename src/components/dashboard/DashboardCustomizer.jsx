import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Settings, LayoutGrid } from "lucide-react";
import { WIDGET_TYPES, getAllCategories } from './WidgetLibrary';

export default function DashboardCustomizer({ open, onClose, currentWidgets = [], onSave }) {
  const [selectedWidgets, setSelectedWidgets] = useState(currentWidgets);
  const [dashboardName, setDashboardName] = useState('');
  const categories = getAllCategories();

  const toggleWidget = (widgetId) => {
    if (selectedWidgets.includes(widgetId)) {
      setSelectedWidgets(selectedWidgets.filter(id => id !== widgetId));
    } else {
      setSelectedWidgets([...selectedWidgets, widgetId]);
    }
  };

  const handleSave = () => {
    onSave({
      name: dashboardName,
      widgets: selectedWidgets,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Customize Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Dashboard Name (Optional)</label>
            <Input
              placeholder="My Custom Dashboard"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Selected Widgets: {selectedWidgets.length}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedWidgets.map(widgetId => {
                const widget = Object.values(WIDGET_TYPES).find(w => w.id === widgetId);
                if (!widget) return null;
                return (
                  <Badge key={widgetId} variant="secondary" className="gap-1">
                    {widget.name}
                    <button
                      onClick={() => toggleWidget(widgetId)}
                      className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>

          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => {
              const categoryWidgets = Object.values(WIDGET_TYPES).filter(w => w.category === category);
              
              return (
                <TabsContent key={category} value={category} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryWidgets.map(widget => {
                      const Icon = widget.icon;
                      const isSelected = selectedWidgets.includes(widget.id);
                      
                      return (
                        <Card
                          key={widget.id}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => toggleWidget(widget.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                                  <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                    {widget.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {widget.description}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={selectedWidgets.length === 0}>
              Save Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}