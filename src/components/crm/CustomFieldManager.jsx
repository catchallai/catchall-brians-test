import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

export default function CustomFieldManager({ entityType, businessId }) {
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    field_type: 'text',
    description: '',
    is_required: false,
    options: [],
  });
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['custom-fields', entityType, businessId],
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      return await base44.entities.CustomField.filter(
        {
          entity_type: entityType,
          business_id: businessId,
          is_active: true,
        },
        'sort_order'
      );
    },
    enabled: !!businessId,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const fieldName = data.label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      return await base44.entities.CustomField.create({
        ...data,
        field_name: fieldName,
        entity_type: entityType,
        business_id: businessId,
        sort_order: fields.length,
        options:
          data.field_type === 'dropdown' || data.field_type === 'multiselect' ? data.options : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', entityType, businessId] });
      handleModalClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomField.update(editingField.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', entityType, businessId] });
      handleModalClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomField.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', entityType, businessId] });
    },
  });

  const handleModalClose = () => {
    setShowModal(false);
    setEditingField(null);
    setFormData({
      label: '',
      field_type: 'text',
      description: '',
      is_required: false,
      options: [],
    });
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      field_type: field.field_type,
      description: field.description || '',
      is_required: field.is_required || false,
      options: field.options || [],
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.label.trim()) {
      return;
    }

    if (editingField) {
      updateMutation.mutate({
        label: formData.label,
        field_type: formData.field_type,
        description: formData.description,
        is_required: formData.is_required,
        options:
          formData.field_type === 'dropdown' || formData.field_type === 'multiselect'
            ? formData.options
            : [],
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading fields...</div>;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Fields</CardTitle>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500">No custom fields yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{field.label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {field.field_type}
                      </Badge>
                      {field.is_required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(field)}
                    className="gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(field.id)}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'New Custom Field'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Field Label *</label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Preferred Communication"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Field Type *</label>
              <Select
                value={formData.field_type}
                onValueChange={(v) => setFormData({ ...formData, field_type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="multiselect">Multi-select</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Helper text (optional)"
                className="mt-1"
              />
            </div>

            {(formData.field_type === 'dropdown' || formData.field_type === 'multiselect') && (
              <div>
                <label className="text-sm font-medium text-gray-700">Options</label>
                <div className="space-y-2 mt-1">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={opt.label}
                        onChange={(e) => {
                          const updated = [...formData.options];
                          updated[idx].label = e.target.value;
                          setFormData({ ...formData, options: updated });
                        }}
                        placeholder="Label"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            options: formData.options.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        options: [...formData.options, { value: '', label: '' }],
                      })
                    }
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-medium">Required field</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.label.trim()}>
              {editingField ? 'Update' : 'Create'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
