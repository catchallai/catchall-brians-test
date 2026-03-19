import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TemplateSelector({
  open,
  onClose,
  templates,
  onSelectTemplate,
  onCreateBlank,
  requireTemplate = false,
  defaultTemplateId = null,
}) {
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // If a default template is set, auto-select it
  React.useEffect(() => {
    if (open && defaultTemplateId) {
      const defaultTemplate = templates.find((t) => t.id === defaultTemplateId);
      if (defaultTemplate) {
        setPreviewTemplate(defaultTemplate);
      }
    }
  }, [open, defaultTemplateId, templates]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requireTemplate && <Lock className="w-5 h-5 text-amber-500" />}
            {requireTemplate ? 'Select a Template (Required)' : 'Choose a Template'}
          </DialogTitle>
          {requireTemplate && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This space requires all new pages to use a template
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Template List */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Blank Page Option */}
                  {!requireTemplate && (
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
                  )}

                  {/* Template Options */}
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`p-6 cursor-pointer hover:shadow-lg transition-all relative ${
                        previewTemplate?.id === template.id ? 'ring-2 ring-violet-500' : ''
                      } ${defaultTemplateId === template.id ? 'border-2 border-violet-500' : ''}`}
                    >
                      <div
                        className="flex flex-col gap-3"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <div className="flex items-start justify-between">
                          <FileText className="w-8 h-8 text-violet-600" />
                          {defaultTemplateId === template.id && (
                            <Badge className="bg-violet-500">Default</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{template.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {template.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTemplate(template);
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {templates
                    .filter((t) => t.created_by === 'custom')
                    .map((template) => (
                      <Card
                        key={template.id}
                        className="p-6 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <div className="flex flex-col gap-3">
                          <FileText className="w-8 h-8 text-violet-600" />
                          <h3 className="font-semibold">{template.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {template.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTemplate(template);
                              }}
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {previewTemplate && (
            <div className="w-1/2 border-l pl-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{previewTemplate.title}</h3>
                <Button size="sm" onClick={() => onSelectTemplate(previewTemplate)}>
                  Use This Template
                </Button>
              </div>
              <Card className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
                <div
                  className="prose dark:prose-invert max-w-none prose-sm"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                />
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
