import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  User,
  MessageSquare,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  new: { color: 'bg-blue-100 text-blue-700', label: 'New' },
  reviewed: { color: 'bg-emerald-100 text-emerald-700', label: 'Reviewed' },
  spam: { color: 'bg-red-100 text-red-700', label: 'Spam' },
};

export default function FormSubmissionsList({ submissions, forms }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FormSubmission.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-submissions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FormSubmission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-submissions'] }),
  });

  const getFormName = (formId) => forms.find((f) => f.id === formId)?.name || 'Unknown Form';

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      Object.values(s.data || {}).some((v) =>
        String(v).toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesForm = formFilter === 'all' || s.form_id === formFilter;
    return matchesSearch && matchesStatus && matchesForm;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Forms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Forms</SelectItem>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSubmissions.map((submission) => {
            const status = statusConfig[submission.status] || statusConfig.new;
            return (
              <Card
                key={submission.id}
                className="border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {submission.data?.name || submission.data?.email || 'Anonymous'}
                          </span>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(submission.created_date), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>•</span>
                          <span>{getFormName(submission.form_id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingSubmission(submission)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {submission.status === 'new' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-emerald-500"
                          onClick={() =>
                            updateMutation.mutate({
                              id: submission.id,
                              data: { status: 'reviewed' },
                            })
                          }
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(submission.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission Detail Modal */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(viewingSubmission.created_date).toLocaleString()}
                <Badge className={statusConfig[viewingSubmission.status]?.color}>
                  {statusConfig[viewingSubmission.status]?.label}
                </Badge>
              </div>

              <div className="space-y-3">
                {Object.entries(viewingSubmission.data || {}).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">{key}</label>
                    <p className="text-gray-900 dark:text-white mt-1">{String(value)}</p>
                  </div>
                ))}
              </div>

              {viewingSubmission.source_url && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ExternalLink className="w-4 h-4" />
                  <a
                    href={viewingSubmission.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {viewingSubmission.source_url}
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {viewingSubmission.status !== 'reviewed' && (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      updateMutation.mutate({
                        id: viewingSubmission.id,
                        data: { status: 'reviewed' },
                      });
                      setViewingSubmission(null);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Reviewed
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 text-red-500"
                  onClick={() => {
                    updateMutation.mutate({ id: viewingSubmission.id, data: { status: 'spam' } });
                    setViewingSubmission(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Mark as Spam
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
