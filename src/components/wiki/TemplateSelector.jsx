import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

export default function TemplateSelector({ open, onClose, templates, onSelectTemplate, onCreateBlank }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Blank Page Option */}
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-dashed"
            onClick={onCreateBlank}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <Plus className="w-12 h-12 text-gray-400" />
              <h3 className="font-semibold">Blank Page</h3>
              <p className="text-sm text-gray-500">Start from scratch</p>
            </div>
          </Card>

          {/* Template Options */}
          {templates.map((template) => (
            <Card 
              key={template.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex flex-col gap-3">
                <FileText className="w-8 h-8 text-violet-600" />
                <h3 className="font-semibold">{template.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {template.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </p>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}