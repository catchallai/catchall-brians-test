import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCustomFieldValues(entityType, entityId) {
  const queryClient = useQueryClient();

  const saveCustomFieldValue = useMutation({
    mutationFn: async ({ customFieldId, value }) => {
      // Find existing value
      const existing = await base44.entities.CustomFieldValue.filter({
        custom_field_id: customFieldId,
        entity_id: entityId,
        entity_type: entityType,
      });

      if (existing.length > 0) {
        // Update existing
        await base44.entities.CustomFieldValue.update(existing[0].id, { value });
      } else {
        // Create new
        await base44.entities.CustomFieldValue.create({
          custom_field_id: customFieldId,
          entity_id: entityId,
          entity_type: entityType,
          value,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-values', entityId] });
    },
  });

  const saveAllCustomFields = async (fieldsData) => {
    // fieldsData is an object: { fieldId: value, ... }
    const promises = Object.entries(fieldsData).map(([fieldId, value]) =>
      saveCustomFieldValue.mutateAsync({ customFieldId: fieldId, value })
    );
    await Promise.all(promises);
  };

  return { saveCustomFieldValue, saveAllCustomFields };
}
