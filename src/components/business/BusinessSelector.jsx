import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BusinessModal from './BusinessModal';

export default function BusinessSelector({ user }) {
  const [showModal, setShowModal] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      return await base44.entities.Business.list('-created_date', 100);
    },
    enabled: !!user,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (businessId) => {
      await base44.auth.updateMe({ current_business_id: businessId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      // Refresh all data for new business context
      queryClient.invalidateQueries();
    },
  });

  const currentBusinessId = user?.current_business_id || businesses[0]?.id;

  // Auto-select first business if none selected
  React.useEffect(() => {
    if (businesses.length > 0 && !user?.current_business_id) {
      updateUserMutation.mutate(businesses[0].id);
    }
  }, [businesses, user]);

  if (isLoading || businesses.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentBusinessId} onValueChange={(value) => updateUserMutation.mutate(value)}>
        <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id}>
              {business.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {user?.role === 'admin' && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowModal(true)}
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}

      <BusinessModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
