import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SectionEditor from './SectionEditor';

const TEMPLATES = [
  { value: 'blank', label: 'Blank Canvas' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'event', label: 'Event Registration' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'lead_capture', label: 'Lead Capture' },
];

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'features', label: 'Features' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'text', label: 'Text Block' },
  { value: 'image', label: 'Image' },
  { value: 'form', label: 'Form' },
];

export default function LandingPageEditorModal({ open, onClose, page, onSave, isLoading = false }) {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    template: 'blank',
    status: 'draft',
    sections: [],
    seo: {
      meta_title: '',
      meta_description: '',
      keywords: [],
    },
    theme: {
      primary_color: '#7c3aed',
      secondary_color: '#06b6d4',
      font_family: 'Inter',
    },
    cta_button: {
      text: '',
      url: '',
    },
  });

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        description: page.description || '',
        template: page.template || 'blank',
        status: page.status || 'draft',
        sections: page.sections || [],
        seo: page.seo || { meta_title: '', meta_description: '', keywords: [] },
        theme: page.theme || {
          primary_color: '#7c3aed',
          secondary_color: '#06b6d4',
          font_family: 'Inter',
        },
        cta_button: page.cta_button || { text: '', url: '' },
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        template: 'blank',
        status: 'draft',
        sections: [],
        seo: { meta_title: '', meta_description: '', keywords: [] },
        theme: { primary_color: '#7c3aed', secondary_color: '#06b6d4', font_family: 'Inter' },
        cta_button: { text: '', url: '' },
      });
    }
  }, [page, open]);

  const handleAddSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      order: formData.sections.length,
      content: getDefaultContent(type),
    };
    setFormData({ ...formData, sections: [...formData.sections, newSection] });
  };

  const handleUpdateSection = (id, content) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((s) => (s.id === id ? { ...s, content } : s)),
    });
  };

  const handleDeleteSection = (id) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((s) => s.id !== id),
    });
  };

  const handleMoveSection = (id, direction) => {
    const index = formData.sections.findIndex((s) => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...formData.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    setFormData({ ...formData, sections: newSections.map((s, i) => ({ ...s, order: i })) });
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'hero':
        return { heading: 'Welcome', subheading: 'Start here', backgroundImage: '' };
      case 'features':
        return { items: [{ title: 'Feature 1', description: 'Description', icon: 'star' }] };
      case 'testimonials':
        return { items: [{ name: 'Customer', text: 'Great product!', avatar: '' }] };
      case 'cta':
        return { heading: 'Ready to start?', buttonText: 'Get Started', buttonUrl: '#' };
      case 'text':
        return { text: 'Your content here...' };
      case 'image':
        return { url: '', alt: '', caption: '' };
      case 'form':
        return { fields: [{ type: 'email', label: 'Email', required: true }] };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Page title is required';
    }
    if (!formData.slug?.trim()) {
      newErrors.slug = 'URL slug is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    onSave(formData);
  };

  const handlePublish = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    onSave({ ...formData, status: 'published', published_at: new Date().toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? 'Edit Landing Page' : 'Create Landing Page'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) {
                      setErrors({ ...errors, title: '' });
                    }
                  }}
                  placeholder="My Landing Page"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    });
                    if (errors.slug) {
                      setErrors({ ...errors, slug: '' });
                    }
                  }}
                  placeholder="my-landing-page"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.slug}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={formData.template}
                onValueChange={(v) => setFormData({ ...formData, template: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Page Sections</Label>
                <Select onValueChange={handleAddSection}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <Plus className="w-3 h-3 inline mr-2" />
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.sections.map((section, idx) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {SECTION_TYPES.find((t) => t.value === section.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveSection(section.id, 'up')}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveSection(section.id, 'down')}
                        disabled={idx === formData.sections.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <SectionEditor
                    type={section.type}
                    content={section.content}
                    onChange={(content) => handleUpdateSection(section.id, content)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.theme.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theme: { ...formData.theme, primary_color: e.target.value },
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.theme.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theme: { ...formData.theme, primary_color: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.theme.secondary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theme: { ...formData.theme, secondary_color: e.target.value },
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.theme.secondary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theme: { ...formData.theme, secondary_color: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={formData.theme.font_family}
                onValueChange={(v) =>
                  setFormData({ ...formData, theme: { ...formData.theme, font_family: v } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input
                value={formData.cta_button.text}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cta_button: { ...formData.cta_button, text: e.target.value },
                  })
                }
                placeholder="Get Started"
              />
            </div>

            <div className="space-y-2">
              <Label>CTA Button URL</Label>
              <Input
                value={formData.cta_button.url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cta_button: { ...formData.cta_button, url: e.target.value },
                  })
                }
                placeholder="https://..."
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                value={formData.seo.meta_title}
                onChange={(e) =>
                  setFormData({ ...formData, seo: { ...formData.seo, meta_title: e.target.value } })
                }
                placeholder="Page title for search engines"
              />
            </div>

            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={formData.seo.meta_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: { ...formData.seo, meta_description: e.target.value },
                  })
                }
                placeholder="Description for search results"
              />
            </div>

            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={(formData.seo.keywords || []).join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: {
                      ...formData.seo,
                      keywords: e.target.value.split(',').map((k) => k.trim()),
                    },
                  })
                }
                placeholder="landing page, marketing, product"
              />
            </div>

            <div className="space-y-2">
              <Label>OG Image URL</Label>
              <Input
                value={formData.seo.og_image || ''}
                onChange={(e) =>
                  setFormData({ ...formData, seo: { ...formData.seo, og_image: e.target.value } })
                }
                placeholder="https://..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            {page?.status !== 'published' && (
              <Button
                onClick={handlePublish}
                disabled={isLoading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
