import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Trash2, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function BulkTaskOperations({ selectedTasks = [], onSelectionChange }) {
  const [bulkStatus, setBulkStatus] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = selectedTasks.map((taskId) => base44.entities.Task.update(taskId, updates));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSelectionChange([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedTasks.map((taskId) => base44.entities.Task.delete(taskId));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSelectionChange([]);
    },
  });

  const submitAssign = () => {
    if (!assigneeEmail) {
      return;
    }
    bulkUpdateMutation.mutate({ assigned_to: assigneeEmail });
    setAssignDialogOpen(false);
  };

  if (selectedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-violet-200 dark:border-violet-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-violet-600" />
            <span className="font-medium">{selectedTasks.length} selected</span>
          </div>

          <Select
            value={bulkStatus}
            onValueChange={(value) => {
              setBulkStatus(value);
              bulkUpdateMutation.mutate({ status: value });
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Set status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssigneeEmail('');
              setAssignDialogOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onSelectionChange([])}>
            Clear
          </Button>
        </div>
      </CardContent>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="assignee-email">Assignee email</Label>
            <Input
              id="assignee-email"
              type="email"
              value={assigneeEmail}
              onChange={(e) => setAssigneeEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && assigneeEmail) {
                  e.preventDefault();
                  submitAssign();
                }
              }}
              placeholder="user@example.com"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAssign} disabled={!assigneeEmail}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          bulkDeleteMutation.mutate();
          setDeleteConfirmOpen(false);
        }}
        title={`Delete ${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        isLoading={bulkDeleteMutation.isPending}
      />
    </Card>
  );
}
