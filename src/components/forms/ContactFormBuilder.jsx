import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  Mail,
  Phone,
  MessageSquare,
  ListOrdered,
  CheckSquare,
  Calendar,
  Loader2,
  Eye,
} from 'lucide-react';

const FIELD_TYPES = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'textarea', label: 'Long Text', icon: MessageSquare },
  { id: 'select', label: 'Dropdown', icon: ListOrdered },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { id: 'date', label: 'Date', icon: Calendar },
];

const DEFAULT_FIELDS = [
  { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
  { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter your email' },
  {
    id: 'message',
    label: 'Message',
    type: 'textarea',
    required: false,
    placeholder: 'Your message...',
  },
];

export default function ContactFormBuilder({ open, onClose, form, websites, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    website_id: '',
    fields: DEFAULT_FIELDS,
    submit_button_text: 'Submit',
    success_message: 'Thank you for your submission!',
    notification_email: '',
    create_contact: true,
    create_lead: false,
    lead_value: 0,
    tags: [],
    is_active: true,
    styling: {},
  });

  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (form) {
      setFormData({
        name: form.name || '',
        website_id: form.website_id || '',
        fields: form.fields || DEFAULT_FIELDS,
        submit_button_text: form.submit_button_text || 'Submit',
        success_message: form.success_message || 'Thank you for your submission!',
        notification_email: form.notification_email || '',
        create_contact: form.create_contact !== false,
        create_lead: form.create_lead || false,
        lead_value: form.lead_value || 0,
        tags: form.tags || [],
        is_active: form.is_active !== false,
        styling: form.styling || {},
      });
    } else {
      setFormData({
        name: '',
        website_id: '',
        fields: DEFAULT_FIELDS,
        submit_button_text: 'Submit',
        success_message: 'Thank you for your submission!',
        notification_email: '',
        create_contact: true,
        create_lead: false,
        lead_value: 0,
        tags: [],
        is_active: true,
        styling: {},
      });
    }
  }, [form, open]);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      label: FIELD_TYPES.find((t) => t.id === type)?.label || 'Field',
      type,
      required: false,
      placeholder: '',
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    setFormData({ ...formData, fields: formData.fields.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form ? 'Edit Contact Form' : 'Create Contact Form'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Settings */}
          <div className="space-y-4">
            <div>
              <Label>Form Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact Form"
              />
            </div>

            <div>
              <Label>Website</Label>
              <Select
                value={formData.website_id}
                onValueChange={(v) => setFormData({ ...formData, website_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select website (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {websites.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Submit Button Text</Label>
              <Input
                value={formData.submit_button_text}
                onChange={(e) => setFormData({ ...formData, submit_button_text: e.target.value })}
              />
            </div>

            <div>
              <Label>Success Message</Label>
              <Textarea
                value={formData.success_message}
                onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Notification Email</Label>
              <Input
                type="email"
                value={formData.notification_email}
                onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                placeholder="notify@example.com"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Create CRM Contact</Label>
                  <p className="text-xs text-gray-500">Auto-create contact from submissions</p>
                </div>
                <Switch
                  checked={formData.create_contact}
                  onCheckedChange={(v) => setFormData({ ...formData, create_contact: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Create Lead/Deal</Label>
                  <p className="text-xs text-gray-500">Auto-create deal in pipeline</p>
                </div>
                <Switch
                  checked={formData.create_lead}
                  onCheckedChange={(v) => setFormData({ ...formData, create_lead: v })}
                />
              </div>

              {formData.create_lead && (
                <div>
                  <Label>Default Lead Value</Label>
                  <Input
                    type="number"
                    value={formData.lead_value}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Contact Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Form Fields</Label>
              <div className="flex gap-1">
                {FIELD_TYPES.slice(0, 4).map((type) => (
                  <Button
                    key={type.id}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => addField(type.id)}
                    title={`Add ${type.label}`}
                  >
                    <type.icon className="w-4 h-4" />
                  </Button>
                ))}
                <Select onValueChange={addField}>
                  <SelectTrigger className="w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {formData.fields.map((field, index) => {
                const FieldIcon = FIELD_TYPES.find((t) => t.id === field.type)?.icon || Type;
                return (
                  <Card key={field.id} className="border shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 mt-2 cursor-move" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <FieldIcon className="w-4 h-4 text-gray-400" />
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(index, { label: e.target.value })}
                              className="h-8 text-sm"
                              placeholder="Field label"
                            />
                            <Switch
                              checked={field.required}
                              onCheckedChange={(v) => updateField(index, { required: v })}
                            />
                            <span className="text-xs text-gray-500">Required</span>
                          </div>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Placeholder text"
                          />
                          {field.type === 'select' && (
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) =>
                                updateField(index, {
                                  options: e.target.value.split(',').map((o) => o.trim()),
                                })
                              }
                              className="h-7 text-xs"
                              placeholder="Options (comma separated)"
                            />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2 mb-3"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          {showPreview && (
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-6 max-w-md mx-auto">
                <h3 className="font-semibold mb-4">{formData.name || 'Contact Form'}</h3>
                <div className="space-y-3">
                  {formData.fields.map((field) => (
                    <div key={field.id}>
                      <label className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <Textarea placeholder={field.placeholder} className="mt-1" disabled />
                      ) : field.type === 'select' ? (
                        <Select disabled>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                          </SelectTrigger>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="mt-1"
                          disabled
                        />
                      )}
                    </div>
                  ))}
                  <Button className="w-full bg-violet-600" disabled>
                    {formData.submit_button_text}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !formData.name}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {form ? 'Update Form' : 'Create Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
