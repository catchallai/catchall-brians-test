import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export default function SectionEditor({ type, content, onChange }) {
  const updateContent = (key, value) => {
    onChange({ ...content, [key]: value });
  };

  const updateArrayItem = (index, key, value) => {
    const items = [...(content.items || [])];
    items[index] = { ...items[index], [key]: value };
    onChange({ ...content, items });
  };

  const addArrayItem = () => {
    const items = [...(content.items || [])];
    items.push(getDefaultItem());
    onChange({ ...content, items });
  };

  const removeArrayItem = (index) => {
    const items = [...(content.items || [])];
    items.splice(index, 1);
    onChange({ ...content, items });
  };

  const getDefaultItem = () => {
    if (type === 'features') {
      return { title: '', description: '', icon: 'star' };
    }
    if (type === 'testimonials') {
      return { name: '', text: '', avatar: '' };
    }
    return {};
  };

  if (type === 'hero') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={content.heading || ''}
            onChange={(e) => updateContent('heading', e.target.value)}
            placeholder="Welcome to our product"
          />
        </div>
        <div className="space-y-2">
          <Label>Subheading</Label>
          <Input
            value={content.subheading || ''}
            onChange={(e) => updateContent('subheading', e.target.value)}
            placeholder="The best solution for..."
          />
        </div>
        <div className="space-y-2">
          <Label>Background Image URL</Label>
          <Input
            value={content.backgroundImage || ''}
            onChange={(e) => updateContent('backgroundImage', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    );
  }

  if (type === 'features') {
    return (
      <div className="space-y-3">
        {(content.items || []).map((item, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label>Feature {idx + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem(idx)}
                className="text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <Input
              value={item.title || ''}
              onChange={(e) => updateArrayItem(idx, 'title', e.target.value)}
              placeholder="Feature title"
            />
            <Textarea
              value={item.description || ''}
              onChange={(e) => updateArrayItem(idx, 'description', e.target.value)}
              placeholder="Description"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addArrayItem} className="w-full">
          <Plus className="w-3 h-3 mr-1" />
          Add Feature
        </Button>
      </div>
    );
  }

  if (type === 'testimonials') {
    return (
      <div className="space-y-3">
        {(content.items || []).map((item, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label>Testimonial {idx + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem(idx)}
                className="text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <Input
              value={item.name || ''}
              onChange={(e) => updateArrayItem(idx, 'name', e.target.value)}
              placeholder="Customer name"
            />
            <Textarea
              value={item.text || ''}
              onChange={(e) => updateArrayItem(idx, 'text', e.target.value)}
              placeholder="Testimonial text"
            />
            <Input
              value={item.avatar || ''}
              onChange={(e) => updateArrayItem(idx, 'avatar', e.target.value)}
              placeholder="Avatar URL (optional)"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addArrayItem} className="w-full">
          <Plus className="w-3 h-3 mr-1" />
          Add Testimonial
        </Button>
      </div>
    );
  }

  if (type === 'cta') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={content.heading || ''}
            onChange={(e) => updateContent('heading', e.target.value)}
            placeholder="Ready to get started?"
          />
        </div>
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={content.buttonText || ''}
            onChange={(e) => updateContent('buttonText', e.target.value)}
            placeholder="Get Started"
          />
        </div>
        <div className="space-y-2">
          <Label>Button URL</Label>
          <Input
            value={content.buttonUrl || ''}
            onChange={(e) => updateContent('buttonUrl', e.target.value)}
            placeholder="#"
          />
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={content.text || ''}
          onChange={(e) => updateContent('text', e.target.value)}
          placeholder="Your content here..."
          rows={6}
        />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input
            value={content.url || ''}
            onChange={(e) => updateContent('url', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Text</Label>
          <Input
            value={content.alt || ''}
            onChange={(e) => updateContent('alt', e.target.value)}
            placeholder="Image description"
          />
        </div>
        <div className="space-y-2">
          <Label>Caption (optional)</Label>
          <Input
            value={content.caption || ''}
            onChange={(e) => updateContent('caption', e.target.value)}
            placeholder="Image caption"
          />
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="space-y-2">
        <Label>Form Fields</Label>
        <p className="text-sm text-gray-500">Default email capture form</p>
      </div>
    );
  }

  return <div className="text-sm text-gray-500">Section editor for {type}</div>;
}
