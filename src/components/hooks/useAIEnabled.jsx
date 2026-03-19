import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useAIEnabled() {
  const { data: aiSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const records = await base44.entities.AISettings.list();
      return records[0] || { ai_enabled: true };
    },
  });

  return aiSettings?.ai_enabled ?? true;
}
