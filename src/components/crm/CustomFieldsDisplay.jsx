import { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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

export default function CustomFieldsDisplay({
  entityType,
  entityId,
  businessId,
  values = {},
  onChange,
  readOnly = false,
}) {
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

  const valueMap = useMemo(() => {
    const map = {};
    customValues.forEach((cv) => {
      map[cv.custom_field_id] = cv.value;
    });
    return map;
  }, [customValues]);

  if (!fields.length) {
    return null;
  }

  const handleChange = (fieldId, value) => {
    onChange?.(fieldId, value);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">Custom Fields</h3>

      {fields.map((field) => {
        const value = values[field.id] || valueMap[field.id] || '';

        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {field.field_type === 'text' && (
              <Input
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.description}
                readOnly={readOnly}
              />
            )}

            {field.field_type === 'number' && (
              <Input
                type="number"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.description}
                readOnly={readOnly}
              />
            )}

            {field.field_type === 'date' && (
              <Input
                type="date"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                readOnly={readOnly}
              />
            )}

            {field.field_type === 'textarea' && (
              <textarea
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.description}
                readOnly={readOnly}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows="3"
              />
            )}

            {field.field_type === 'dropdown' && (
              <Select
                value={value}
                onValueChange={(v) => handleChange(field.id, v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.description || 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.value || opt.label} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.field_type === 'multiselect' && (
              <div className="space-y-2">
                {field.options?.map((opt) => {
                  const isSelected = value?.split(',').includes(opt.label);
                  return (
                    <label
                      key={opt.value || opt.label}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const selected = value?.split(',').filter(Boolean) || [];
                          if (checked) {
                            selected.push(opt.label);
                          } else {
                            selected = selected.filter((s) => s !== opt.label);
                          }
                          handleChange(field.id, selected.join(','));
                        }}
                        disabled={readOnly}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.field_type === 'checkbox' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={value === 'true'}
                  onCheckedChange={(checked) => handleChange(field.id, checked ? 'true' : 'false')}
                  disabled={readOnly}
                />
                <span className="text-sm">{field.label}</span>
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
