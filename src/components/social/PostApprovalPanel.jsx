import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, XCircle, Clock, Send, UserPlus, AlertCircle,
  ThumbsUp, RotateCcw, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_CONFIG = {
  draft:              { label: 'Draft',             color: 'bg-gray-100 text-gray-600',       icon: Clock },
  pending_review:     { label: 'Pending Review',    color: 'bg-yellow-100 text-yellow-700',   icon: Clock },
  changes_requested:  { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700',   icon: RotateCcw },
  pending_approval:   { label: 'Pending Approval',  color: 'bg-blue-100 text-blue-700',       icon: Clock },
  approved:           { label: 'Approved',           color: 'bg-green-100 text-green-700',     icon: CheckCircle2 },
  rejected:           { label: 'Rejected',           color: 'bg-red-100 text-red-700',         icon: XCircle },
  published:          { label: 'Published',          color: 'bg-violet-100 text-violet-700',   icon: CheckCircle2 },
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

export default function PostApprovalPanel({ post, onUpdate }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarPost.update(post.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setNote('');
    },
  });

  const role = currentUser?.social_media_role || currentUser?.role || 'viewer';
  const isAdmin = role === 'admin';
  const isApprover = role === 'admin' || role === 'approver';
  const isEditor = isApprover || role === 'editor';
  const isAssignedReviewer = post.assigned_to_email === currentUser?.email;

  const addWorkflowEvent = (action, extraData = {}) => {
    const history = post.workflow_history || [];
    const newEntry = {
      action,
      by_email: currentUser?.email,
      by_name: currentUser?.full_name || currentUser?.email,
      timestamp: new Date().toISOString(),
      note: note || undefined,
    };
    return { workflow_history: [...history, newEntry], ...extraData };
  };

  const handleAssign = (userEmail) => {
    const user = allUsers.find(u => u.email === userEmail);
    updateMutation.mutate(addWorkflowEvent('assigned', {
      assigned_to_email: userEmail,
      assigned_to_name: user?.full_name || userEmail,
      assigned_date: new Date().toISOString(),
      status: 'pending_review',
    }));
  };

  const handleSubmitForReview = () => {
    updateMutation.mutate(addWorkflowEvent('submitted_for_review', { status: 'pending_review' }));
  };

  const handleSubmitForApproval = () => {
    updateMutation.mutate(addWorkflowEvent('submitted_for_approval', { status: 'pending_approval' }));
  };

  const handleRequestChanges = () => {
    updateMutation.mutate(addWorkflowEvent('changes_requested', { status: 'changes_requested' }));
  };

  const handleApprove = () => {
    updateMutation.mutate(addWorkflowEvent('approved', {
      status: 'approved',
      approved_by: currentUser?.email,
      approved_by_name: currentUser?.full_name || currentUser?.email,
      approved_date: new Date().toISOString().split('T')[0],
    }));
  };

  const handleReject = () => {
    if (!note.trim()) return alert('Please provide a reason for rejection.');
    updateMutation.mutate(addWorkflowEvent('rejected', { status: 'rejected', rejected_reason: note }));
  };

  const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  const teamMembers = allUsers.filter(u =>
    ['admin', 'editor', 'approver'].includes(u.social_media_role || u.role)
  );

  return (
    <div className="space-y-5">
      {/* Status & Priority */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={`gap-1.5 ${statusCfg.color} border-0 font-medium`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </Badge>
        {post.priority && post.priority !== 'normal' && (
          <Badge className={`${PRIORITY_COLORS[post.priority]} border-0 text-xs`}>
            {post.priority.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Assignment */}
      {isEditor && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Assign Reviewer
          </p>
          {post.assigned_to_email ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-blue-200 text-blue-700">
                  {post.assigned_to_name?.[0] || post.assigned_to_email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{post.assigned_to_name || post.assigned_to_email}</p>
                {post.assigned_date && (
                  <p className="text-xs text-gray-400">
                    Assigned {formatDistanceToNow(new Date(post.assigned_date), { addSuffix: true })}
                  </p>
                )}
              </div>
              {isAdmin && (
                <button onClick={() => updateMutation.mutate({ assigned_to_email: null, assigned_to_name: null })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Unassign
                </button>
              )}
            </div>
          ) : (
            <Select onValueChange={handleAssign}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select team member…" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(u => (
                  <SelectItem key={u.id} value={u.email}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs text-violet-600 font-medium">
                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </div>
                      <span>{u.full_name || u.email}</span>
                      <Badge variant="outline" className="text-xs ml-1">{u.social_media_role || u.role}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Review Due Date */}
      {isEditor && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review Due Date</p>
          <Input type="date" value={post.review_due_date || ''}
            onChange={(e) => updateMutation.mutate({ review_due_date: e.target.value })}
            className="text-sm h-9" />
        </div>
      )}

      {/* Priority */}
      {isEditor && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</p>
          <Select value={post.priority || 'normal'} onValueChange={(v) => updateMutation.mutate({ priority: v })}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Note field for actions */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Note (optional)</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note with your action…"
          rows={2} className="resize-none text-sm" />
      </div>

      {/* Workflow Actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
        <div className="flex flex-wrap gap-2">
          {/* Editor: submit for review */}
          {isEditor && post.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={handleSubmitForReview} disabled={updateMutation.isPending}
              className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50">
              <Send className="w-3.5 h-3.5" /> Submit for Review
            </Button>
          )}
          {/* Reviewer: move to approval */}
          {(isAssignedReviewer || isApprover) && post.status === 'pending_review' && (
            <>
              <Button size="sm" variant="outline" onClick={handleSubmitForApproval} disabled={updateMutation.isPending}
                className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50">
                <ThumbsUp className="w-3.5 h-3.5" /> Pass to Approver
              </Button>
              <Button size="sm" variant="outline" onClick={handleRequestChanges} disabled={updateMutation.isPending}
                className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50">
                <RotateCcw className="w-3.5 h-3.5" /> Request Changes
              </Button>
            </>
          )}
          {/* Editor: resubmit after changes */}
          {isEditor && post.status === 'changes_requested' && (
            <Button size="sm" variant="outline" onClick={handleSubmitForReview} disabled={updateMutation.isPending}
              className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50">
              <Send className="w-3.5 h-3.5" /> Resubmit for Review
            </Button>
          )}
          {/* Approver: approve or reject */}
          {isApprover && post.status === 'pending_approval' && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={updateMutation.isPending}
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={updateMutation.isPending || !note.trim()}
                className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
              <Button size="sm" variant="outline" onClick={handleRequestChanges} disabled={updateMutation.isPending}
                className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50">
                <RotateCcw className="w-3.5 h-3.5" /> Request Changes
              </Button>
            </>
          )}
          {/* Rejection reason */}
          {post.status === 'rejected' && post.rejected_reason && (
            <div className="w-full p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Rejection reason:</strong> {post.rejected_reason}</span>
            </div>
          )}
          {/* Approval info */}
          {post.status === 'approved' && (
            <div className="w-full p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-700 flex gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Approved by <strong>{post.approved_by_name || post.approved_by}</strong>
                {post.approved_date && ` on ${format(new Date(post.approved_date), 'MMM d, yyyy')}`}
              </span>
            </div>
          )}
        </div>
        {updateMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
          </div>
        )}
      </div>

      {/* Workflow History */}
      {(post.workflow_history?.length > 0) && (
        <div className="space-y-2">
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Workflow History ({post.workflow_history.length})
          </button>
          {showHistory && (
            <div className="space-y-2 border-l-2 border-gray-100 pl-4 ml-1">
              {[...post.workflow_history].reverse().map((entry, i) => (
                <div key={i} className="text-xs text-gray-500 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-700">{entry.by_name || entry.by_email}</span>
                    <span className="capitalize text-gray-400">{entry.action?.replace(/_/g, ' ')}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  {entry.note && <p className="text-gray-500 italic ml-1">"{entry.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}