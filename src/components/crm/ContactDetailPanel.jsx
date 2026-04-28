import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Tag,
  Activity,
  DollarSign,
  Target,
  Building2,
  ExternalLink,
  AlertCircle,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ActivityFeed from '@/components/collaboration/ActivityFeed';
import TaskAssignment from '@/components/collaboration/TaskAssignment';
import NoteWithMentions from '@/components/collaboration/NoteWithMentions';
import EmailContactModal from '@/components/modals/EmailContactModal';
import EmailTrackingPanel from '@/components/crm/EmailTrackingPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ContactDetailPanel({ contactId }) {
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showTaskModal, setShowTaskModal] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDescription, setTaskDescription] = React.useState('');
  const [creatingTask, setCreatingTask] = React.useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const contacts = await base44.entities.Contact.filter({ id: contactId });
      return contacts[0];
    },
    enabled: !!contactId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: () => base44.entities.Activity.filter({ contact_id: contactId }, '-created_date', 50),
    enabled: !!contactId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: () => base44.entities.Deal.filter({ contact_id: contactId }, '-created_date', 20),
    enabled: !!contactId,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['contact-tickets', contactId],
    queryFn: () => base44.entities.Ticket.filter({ contact_id: contactId }, '-created_date', 20),
    enabled: !!contactId,
  });

  const { data: company } = useQuery({
    queryKey: ['company', contact?.company_id],
    queryFn: async () => {
      if (!contact?.company_id) {
        return null;
      }
      const companies = await base44.entities.Company.filter({ id: contact.company_id });
      return companies[0];
    },
    enabled: !!contact?.company_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    setCreatingTask(true);
    try {
      await base44.entities.Task.create({
        contact_id: contactId,
        company_id: contact.company_id,
        title: taskTitle,
        description: taskDescription,
        due_date: new Date().toISOString().split('T')[0],
        status: 'todo',
      });
      toast.success('Follow-up task created');
      setTaskTitle('');
      setTaskDescription('');
      setShowTaskModal(false);
    } catch (_error) {
      toast.error('Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Contact Header */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {contact.first_name} {contact.last_name}
              </h2>
              {contact.job_title && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{contact.job_title}</p>
              )}
            </div>
            <Badge
              className={
                contact.status === 'customer'
                  ? 'bg-green-100 text-green-700'
                  : contact.status === 'prospect'
                    ? 'bg-blue-100 text-blue-700'
                    : contact.status === 'lead'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
              }
            >
              {contact.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {contact.job_title && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Briefcase className="w-4 h-4" />
                {contact.job_title}
              </div>
            )}
            {contact.source && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Tag className="w-4 h-4" />
                {contact.source.replace('_', ' ')}
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${contact.email}`} className="hover:text-violet-600">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                {contact.phone}
              </div>
            )}
            {company && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building2 className="w-4 h-4" />
                <Link to={createPageUrl('Companies')} className="hover:text-violet-600">
                  {company.name}
                </Link>
              </div>
            )}
            {contact.linkedin_url && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <ExternalLink className="w-4 h-4" />
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-600"
                >
                  LinkedIn
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {contact.email && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                className="gap-1 text-xs"
              >
                <Mail className="w-3 h-3" />
                Send Email
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTaskModal(true)}
              className="gap-1 text-xs"
            >
              <CheckSquare className="w-3 h-3" />
              Follow-up Task
            </Button>
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {contact.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {contact.notes && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Activity className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
            <p className="text-xs text-gray-500">Activities</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{deals.length}</p>
            <p className="text-xs text-gray-500">Deals</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${(totalDealValue / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500">Deal Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'call'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : activity.type === 'email'
                          ? 'bg-violet-100 dark:bg-violet-900'
                          : activity.type === 'meeting'
                            ? 'bg-emerald-100 dark:bg-emerald-900'
                            : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.due_date && format(new Date(activity.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {activity.completed && (
                    <Badge className="bg-green-100 text-green-700 text-xs">Done</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Deals */}
      {deals.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {deal.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {deal.stage?.replace('_', ' ')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${(deal.value / 1000).toFixed(0)}k
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets */}
      {tickets.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {ticket.ticket_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.ticket_number && `#${ticket.ticket_number}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      ticket.status === 'Closed'
                        ? 'bg-green-100 text-green-700'
                        : ticket.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700'
                          : ticket.status === 'New'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Assignment */}
      <TaskAssignment entityType="contact" entityId={contactId} />

      {/* Add Note with Mentions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteWithMentions
            entityType="contact"
            entityId={contactId}
            businessId={contact?.business_id}
          />
        </CardContent>
      </Card>

      {/* Email Tracking */}
      <EmailTrackingPanel contactId={contactId} />

      {/* Activity Feed */}
      <ActivityFeed entityType="contact" entityId={contactId} />

      {/* Email Modal */}
      <EmailContactModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        contact={contact}
        businessId={contact?.business_id}
      />

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Follow-up Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Title *
              </label>
              <Input
                placeholder="e.g., Call to discuss proposal"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                disabled={creatingTask}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <Textarea
                placeholder="Additional details..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                disabled={creatingTask}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(false)}
                disabled={creatingTask}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={creatingTask} className="gap-2">
                {creatingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
