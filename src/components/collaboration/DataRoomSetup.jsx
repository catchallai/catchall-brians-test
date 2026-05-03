import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DataRoomSetup
 * Create a new data room for a project
 * - Auto-links to Approved folder
 * - Enables secure client access
 */

export default function DataRoomSetup({ projectId, projectName }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(`${projectName} Data Room`);
  const [description, setDescription] = useState('');

  const createDataRoomMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ProjectDataRoom.create({
        project_id: projectId,
        project_name: projectName,
        name,
        description,
        auto_sync_approved_folder: true,
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room', projectId] });
      setShowForm(false);
      setName(`${projectName} Data Room`);
      setDescription('');
      toast.success('Data room created successfully');
    },
    onError: () => toast.error('Failed to create data room'),
  });

  return (
    <div className="space-y-4">
      {showForm ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Data room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-violet-500 resize-none h-20"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createDataRoomMutation.mutate()}
                disabled={!name.trim() || createDataRoomMutation.isPending}
              >
                {createDataRoomMutation.isPending ? 'Creating...' : 'Create Data Room'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">Set Up Client Data Room</p>
                <p className="text-sm text-gray-600 mt-1">
                  Create a secure portal where approved project files are automatically shared with external clients.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="mt-4 gap-1"
            >
              <Plus className="w-4 h-4" />
              Create Data Room
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}