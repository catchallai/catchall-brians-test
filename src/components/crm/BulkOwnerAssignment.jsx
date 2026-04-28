import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOwnerAssignment({ selectedIds, teamMembers = [] }) {
  const [selectedOwner, setSelectedOwner] = useState('');
  const [assigning, setAssigning] = useState(false);
  const queryClient = useQueryClient();

  const handleAssignOwner = async () => {
    if (!selectedOwner) {
      return;
    }
    setAssigning(true);

    try {
      const owner = teamMembers.find((m) => m.email === selectedOwner);

      for (const id of selectedIds) {
        await base44.entities.Contact.update(id, {
          owner_email: selectedOwner,
          owner_name: owner?.name || selectedOwner,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Assigned ${selectedIds.length} contact(s) to ${owner?.name || selectedOwner}`);
      setSelectedOwner('');
    } catch (_err) {
      toast.error('Failed to assign contacts');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">Assign owner...</option>
            {teamMembers.map((member) => (
              <option key={member.email} value={member.email}>
                {member.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleAssignOwner}
            disabled={!selectedOwner || assigning}
            className="gap-2"
            size="sm"
          >
            {assigning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Assign ({selectedIds.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
