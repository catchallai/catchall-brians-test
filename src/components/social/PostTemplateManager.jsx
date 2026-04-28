import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash, FileText } from 'lucide-react';

export default function PostTemplateManager({ onUseTemplate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    title_template: '',
    caption_template: '',
    platforms: [],
    hashtags: [],
    media_type: 'none',
  });
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['post-templates'],
    queryFn: () => base44.entities.PostTemplate.list('-usage_count', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PostTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-templates'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PostTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-templates'] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-templates'] }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      title_template: '',
      caption_template: '',
      platforms: [],
      hashtags: [],
      media_type: 'none',
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      category: template.category || 'custom',
      title_template: template.title_template || '',
      caption_template: template.caption_template || '',
      platforms: template.platforms || [],
      hashtags: template.hashtags || [],
      media_type: template.media_type || 'none',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleUseTemplate = async (template) => {
    await base44.entities.PostTemplate.update(template.id, {
      usage_count: (template.usage_count || 0) + 1,
    });
    onUseTemplate(template);
  };

  const togglePlatform = (platform) => {
    const current = formData.platforms || [];
    if (current.includes(platform)) {
      setFormData({ ...formData, platforms: current.filter((p) => p !== platform) });
    } else {
      setFormData({ ...formData, platforms: [...current, platform] });
    }
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Post Templates
        </CardTitle>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No templates yet. Create your first template!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(template.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline" className="mb-2 text-xs">
                    {template.category}
                  </Badge>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.caption_template}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.platforms?.map((p) => (
                      <Badge
                        key={p}
                        className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Used {template.usage_count || 0} times
                    </span>
                    <Button size="sm" onClick={() => handleUseTemplate(template)} className="gap-1">
                      <Plus className="w-3 h-3" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Newsletter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="behind_the_scenes">Behind the Scenes</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title Template</Label>
                <Input
                  value={formData.title_template}
                  onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                  placeholder="Use {{placeholders}} for dynamic content"
                />
              </div>

              <div className="space-y-2">
                <Label>Caption Template *</Label>
                <Textarea
                  value={formData.caption_template}
                  onChange={(e) => setFormData({ ...formData, caption_template: e.target.value })}
                  placeholder="Use {{placeholders}} for dynamic content..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Default Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((p) => (
                    <Badge
                      key={p}
                      className={`cursor-pointer ${formData.platforms?.includes(p) ? 'bg-violet-600' : 'bg-gray-200 text-gray-700'}`}
                      onClick={() => togglePlatform(p)}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(v) => setFormData({ ...formData, media_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          title="Delete this template?"
          description="This action cannot be undone."
          confirmLabel="Delete"
        />
      </CardContent>
    </Card>
  );
}
