import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';

export default function BatchOperations({ contacts = [] }) {
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState('');
  const [csmAssign, setCsmAssign] = useState('');
  const queryClient = useQueryClient();

  const batchAssignMutation = useMutation({
    mutationFn: async () => {
      if (!csmAssign) {
        return;
      }

      const onboardings = await base44.entities.CustomerOnboarding.list('-created_date', 500);

      for (const contactId of selected) {
        const onboarding = onboardings.find((o) => o.contact_id === contactId);
        if (onboarding) {
          await base44.entities.CustomerOnboarding.update(onboarding.id, {
            csm_assigned: csmAssign,
          });
        } else {
          await base44.entities.CustomerOnboarding.create({
            contact_id: contactId,
            csm_assigned: csmAssign,
            status: 'assigned',
            progress_percentage: 0,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboarding'] });
      setSelected([]);
      setAction('');
    },
  });

  const batchCreateTasksMutation = useMutation({
    mutationFn: async () => {
      const onboardings = await base44.entities.CustomerOnboarding.list('-created_date', 500);

      for (const contactId of selected) {
        const onboarding = onboardings.find((o) => o.contact_id === contactId);
        const csm = onboarding?.csm_assigned || 'unassigned';

        await base44.entities.CSMTask.create({
          contact_id: contactId,
          csm_assigned: csm,
          title: 'Scheduled health check',
          description: 'Batch-generated health check task',
          priority: 'medium',
          status: 'open',
          task_type: 'health_check',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csm-tasks'] });
      setSelected([]);
      setAction('');
    },
  });

  const handleAction = () => {
    if (action === 'assign_csm') {
      batchAssignMutation.mutate();
    } else if (action === 'create_tasks') {
      batchCreateTasksMutation.mutate();
    }
  };

  const isLoading = batchAssignMutation.isPending || batchCreateTasksMutation.isPending;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Batch Operations</span>
          <span className="text-sm font-normal text-gray-500">{selected.length} selected</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {contacts
            .filter((c) => c.status === 'customer')
            .map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Checkbox
                  checked={selected.includes(contact.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelected([...selected, contact.id]);
                    } else {
                      setSelected(selected.filter((id) => id !== contact.id));
                    }
                  }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {contact.first_name} {contact.last_name}
                </span>
              </div>
            ))}
        </div>

        {selected.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Action
              </label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign_csm">Assign CSM</SelectItem>
                  <SelectItem value="create_tasks">Create Health Check Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === 'assign_csm' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  CSM Email
                </label>
                <input
                  type="email"
                  value={csmAssign}
                  onChange={(e) => setCsmAssign(e.target.value)}
                  placeholder="csm@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <Button
              onClick={handleAction}
              disabled={isLoading || !action || (action === 'assign_csm' && !csmAssign)}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Execute
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
