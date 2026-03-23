import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CustomFieldsSection({ entityType, entityId, businessId, onValuesChange }) {
  const [fieldValues, setFieldValues] = useState({});

  const { data: fields = [] } = useQuery({
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

  const { data: customValues = [] } = useQuery({
    queryKey: ['custom-field-values', entityId],
    queryFn: async () => {
      if (!entityId) {
        return [];
      }
      return await base44.entities.CustomFieldValue.filter({
        entity_id: entityId,
        entity_type: entityType,
      });
    },
    enabled: !!entityId,
  });

  useEffect(() => {
    const values = {};
    customValues.forEach((cv) => {
      values[cv.custom_field_id] = cv.value;
    });
    setFieldValues(values);
  }, [customValues]);

  const handleFieldChange = (fieldId, value) => {
    const updated = { ...fieldValues, [fieldId]: value };
    setFieldValues(updated);
    onValuesChange?.(updated);
  };

  if (!fields.length) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Fields</h3>

      <div className="space-y-4">
        {fields.map((field) => {
          const value = fieldValues[field.id] || '';

          return (
            <div key={field.id}>
              <Label className="text-sm font-medium">
                {field.label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}

              {field.field_type === 'text' && (
                <Input
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.description}
                  className="mt-2"
                />
              )}

              {field.field_type === 'number' && (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="mt-2"
                />
              )}

              {field.field_type === 'date' && (
                <Input
                  type="date"
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="mt-2"
                />
              )}

              {field.field_type === 'textarea' && (
                <textarea
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.description}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md text-sm"
                  rows="3"
                />
              )}

              {field.field_type === 'dropdown' && (
                <Select value={value} onValueChange={(v) => handleFieldChange(field.id, v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.label} value={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.field_type === 'multiselect' && (
                <div className="space-y-2 mt-2">
                  {field.options?.map((opt) => {
                    const selected = value.split(',').filter(Boolean);
                    const isChecked = selected.includes(opt.label);
                    return (
                      <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selected.push(opt.label);
                            } else {
                              selected.splice(selected.indexOf(opt.label), 1);
                            }
                            handleFieldChange(field.id, selected.join(','));
                          }}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.field_type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <Checkbox
                    checked={value === 'true'}
                    onCheckedChange={(checked) =>
                      handleFieldChange(field.id, checked ? 'true' : 'false')
                    }
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
