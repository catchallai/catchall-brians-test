import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Tag, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactBulkActionsPanel({
  selectedContactIds,
  contacts,
  user,
  onComplete,
}) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const [tagData, setTagData] = useState('');
  const [statusData, setStatusData] = useState('prospect');
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium' });
  const queryClient = useQueryClient();

  const selectedContacts = contacts.filter((c) => selectedContactIds.includes(c.id));

  const bulkEmailMutation = useMutation({
    mutationFn: async (data) => {
      for (const contact of selectedContacts) {
        await base44.functions.invoke('sendContactEmail', {
          to: contact.email,
          subject: data.subject,
          body: data.body,
          from_email: user?.email,
        });

        await base44.entities.Activity.create({
          entity_type: 'contact',
          entity_id: contact.id,
          activity_type: 'email_sent',
          title: `Bulk email sent: ${data.subject}`,
          performed_by: user?.email,
          performed_by_name: user?.full_name,
          metadata: { subject: data.subject, isBulk: true },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowEmailModal(false);
      setEmailData({ subject: '', body: '' });
      toast.success(`Email sent to ${selectedContacts.length} contacts`);
      onComplete?.();
    },
    onError: () => toast.error('Failed to send bulk email'),
  });

  const bulkTagMutation = useMutation({
    mutationFn: async (tag) => {
      for (const contact of selectedContacts) {
        const existingTags = contact.tags || [];
        if (!existingTags.includes(tag)) {
          existingTags.push(tag);
          await base44.entities.Contact.update(contact.id, { tags: existingTags });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowTagModal(false);
      setTagData('');
      toast.success(`Tag added to ${selectedContacts.length} contacts`);
      onComplete?.();
    },
    onError: () => toast.error('Failed to add tag'),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status) => {
      for (const contact of selectedContacts) {
        await base44.entities.Contact.update(contact.id, { status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowStatusModal(false);
      toast.success(`Status updated for ${selectedContacts.length} contacts`);
      onComplete?.();
    },
    onError: () => toast.error('Failed to update status'),
  });

  const bulkTaskMutation = useMutation({
    mutationFn: async (data) => {
      for (const contact of selectedContacts) {
        await base44.entities.Task.create({
          title: data.title,
          description: data.description,
          priority: data.priority,
          entity_type: 'contact',
          entity_id: contact.id,
          assigned_to: user?.email,
          assigned_by: user?.email,
          status: 'open',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskModal(false);
      setTaskData({ title: '', description: '', priority: 'medium' });
      toast.success(`Task created for ${selectedContacts.length} contacts`);
      onComplete?.();
    },
    onError: () => toast.error('Failed to create task'),
  });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmailModal(true)}
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowTagModal(true)} className="gap-2">
          <Tag className="w-4 h-4" />
          Add Tag
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatusModal(true)}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Update Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTaskModal(true)}
          className="gap-2"
        >
          <ListTodo className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* Send Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedContacts.length} Contact(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                placeholder="Email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message *</label>
              <textarea
                placeholder="Email message"
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows="6"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkEmailMutation.mutate(emailData)}
              disabled={!emailData.subject || !emailData.body || bulkEmailMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {bulkEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to {selectedContacts.length}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to {selectedContacts.length} Contact(s)</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter tag name"
            value={tagData}
            onChange={(e) => setTagData(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkTagMutation.mutate(tagData)}
              disabled={!tagData || bulkTagMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {bulkTagMutation.isPending ? 'Adding...' : 'Add Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedContacts.length} Contact(s)</DialogTitle>
          </DialogHeader>
          <Select value={statusData} onValueChange={setStatusData}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkStatusMutation.mutate(statusData)}
              disabled={bulkStatusMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {bulkStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task for {selectedContacts.length} Contact(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Title *</label>
              <Input
                placeholder="Task title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Task description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows="3"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={taskData.priority}
                onValueChange={(value) => setTaskData({ ...taskData, priority: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkTaskMutation.mutate(taskData)}
              disabled={!taskData.title || bulkTaskMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {bulkTaskMutation.isPending ? 'Creating...' : `Create for ${selectedContacts.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
