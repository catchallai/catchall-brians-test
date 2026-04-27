import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Search,
  Flag,
  Reply,
  Circle,
  Paperclip,
  Star,
  Archive,
  ListTodo,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import TaskModal from '@/components/modals/TaskModal';

export default function SalesInbox() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['sales-emails', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'all') {
        return await base44.entities.SalesEmail.list('-received_date', 200);
      }
      return await base44.entities.SalesEmail.filter(
        { status: filterStatus },
        '-received_date',
        200
      );
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalesEmail.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-emails'] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ emailId, content }) => {
      const email = emails.find((e) => e.id === emailId);
      await base44.integrations.Core.SendEmail({
        to: email.from_email,
        subject: `Re: ${email.subject}`,
        body: content,
      });
      await base44.entities.SalesEmail.update(emailId, {
        is_replied: true,
        status: 'closed',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-emails'] });
      setShowReplyModal(false);
      setReplyContent('');
      toast.success('Reply sent successfully');
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      updateEmailMutation.mutate({
        id: email.id,
        data: { is_read: true },
      });
    }
  };

  const handleFlag = (email) => {
    updateEmailMutation.mutate({
      id: email.id,
      data: { is_flagged: !email.is_flagged },
    });
  };

  const handleReply = () => {
    setShowReplyModal(true);
  };

  const handleSendReply = () => {
    if (!replyContent.trim()) {
      return;
    }
    sendReplyMutation.mutate({
      emailId: selectedEmail.id,
      content: replyContent,
    });
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskCreated = () => {
    toast.success('Task created successfully');
    setShowTaskModal(false);
  };

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = emails.filter((e) => !e.is_read).length;
  const flaggedCount = emails.filter((e) => e.is_flagged).length;
  const newCount = emails.filter((e) => e.status === 'new').length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Inbox</h1>
        <p className="text-gray-500 mt-1">Manage incoming sales emails to sales@syberjet.com</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{emails.length}</p>
              </div>
              <Mail className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Circle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Flagged</p>
                <p className="text-2xl font-bold text-amber-600">{flaggedCount}</p>
              </div>
              <Flag className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New</p>
                <p className="text-2xl font-bold text-emerald-600">{newCount}</p>
              </div>
              <Star className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Email List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-violet-50 dark:bg-violet-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${!email.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                          {email.from_name?.[0] || email.from_email?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}
                          >
                            {email.from_name || email.from_email}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {email.is_flagged && (
                              <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                            {email.is_replied && <Reply className="w-3 h-3 text-green-500" />}
                          </div>
                        </div>
                        <p
                          className={`text-sm truncate ${!email.is_read ? 'font-medium' : ''} text-gray-700 dark:text-gray-300`}
                        >
                          {email.subject}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {email.body.substring(0, 60)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {format(
                              new Date(email.received_date || email.created_date),
                              'MMM d, h:mm a'
                            )}
                          </span>
                          {email.attachments?.length > 0 && (
                            <Paperclip className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{selectedEmail.subject}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                            {selectedEmail.from_name?.[0] ||
                              selectedEmail.from_email?.[0]?.toUpperCase() ||
                              '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEmail.from_name || selectedEmail.from_email}
                          </p>
                          <p className="text-xs">{selectedEmail.from_email}</p>
                        </div>
                      </div>
                      <span>•</span>
                      <span>
                        {format(
                          new Date(selectedEmail.received_date || selectedEmail.created_date),
                          'MMM d, yyyy h:mm a'
                        )}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFlag(selectedEmail)}>
                        <Flag className="w-4 h-4 mr-2" />
                        {selectedEmail.is_flagged ? 'Unflag' : 'Flag'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateEmailMutation.mutate({
                            id: selectedEmail.id,
                            data: { status: 'closed' },
                          })
                        }
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleReply} className="gap-2 bg-violet-600 hover:bg-violet-700">
                    <Reply className="w-4 h-4" />
                    Reply
                  </Button>
                  <Button onClick={handleCreateTask} variant="outline" className="gap-2">
                    <ListTodo className="w-4 h-4" />
                    Create Task
                  </Button>
                  <Button
                    onClick={() => handleFlag(selectedEmail)}
                    variant={selectedEmail.is_flagged ? 'default' : 'outline'}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    {selectedEmail.is_flagged ? 'Flagged' : 'Flag'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Email Body */}
                <div className="prose dark:prose-invert max-w-none">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {attachment.filename}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center text-gray-400">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select an email to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Reply to {selectedEmail?.from_name || selectedEmail?.from_email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Subject: Re: {selectedEmail?.subject}</p>
            </div>
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sendReplyMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {sendReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      {showTaskModal && selectedEmail && (
        <TaskModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          task={{
            title: `Follow up: ${selectedEmail.subject}`,
            description: `Follow up on email from ${selectedEmail.from_name || selectedEmail.from_email}`,
            related_entity_type: 'SalesEmail',
            related_entity_id: selectedEmail.id,
          }}
          onSave={handleTaskCreated}
        />
      )}
    </div>
  );
}
