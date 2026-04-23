import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Send,
  ChevronRight,
  User,
  Loader2,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STAGE_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    icon: Clock,
  },
  changes_requested: {
    label: 'Changes Needed',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    icon: RotateCcw,
  },
  pending_brand_approval: {
    label: 'Brand Approval',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    icon: ShieldCheck,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    icon: CheckCircle2,
  },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const WORKFLOW_STEPS = ['draft', 'pending_brand_approval', 'approved'];

/**
 * Generic reusable approval workflow panel.
 * Props:
 *  - item: the record (copy or template)
 *  - entityName: 'ApprovedCopy' | 'ApprovedGraphicTemplate'
 *  - queryKey: string[]
 *  - currentUser: user object
 */
export default function ApprovalWorkflowPanel({ item, entityName, queryKey, currentUser }) {
  const [note, setNote] = useState('');
  const qc = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities[entityName].update(item.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setNote('');
    },
  });

  const addEvent = (action, extra = {}) => {
    const event = {
      action,
      by_email: currentUser?.email,
      by_name: currentUser?.full_name,
      timestamp: new Date().toISOString(),
      note,
    };
    return {
      workflow_history: [...(item.workflow_history || []), event],
      ...extra,
    };
  };

  const handleSubmitForApproval = () =>
    mutation.mutate(
      addEvent('submitted_for_approval', {
        status: 'pending_brand_approval',
        submitted_by: currentUser?.email,
        submitted_by_name: currentUser?.full_name,
      })
    );

  const handleBrandApprove = () =>
    mutation.mutate(
      addEvent('brand_approved', {
        status: 'approved',
        approved_date: new Date().toISOString(),
        brand_approver_email: currentUser?.email,
        brand_approver_name: currentUser?.full_name,
      })
    );

  const handleReject = () =>
    mutation.mutate(
      addEvent('rejected', {
        status: 'changes_requested',
        rejection_reason: note,
      })
    );

  const handleAssignReviewer = (email) => {
    const user = allUsers.find((u) => u.email === email);
    mutation.mutate({
      assigned_reviewer_email: email,
      assigned_reviewer_name: user?.full_name || email,
    });
  };

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.email === item.assigned_reviewer_email || isAdmin;
  const isBrandApprover = currentUser?.email === item.brand_approver_email || isAdmin;
  const isSubmitter = currentUser?.email === item.submitted_by;

  const normalizedStatus =
    item.status === 'changes_requested' || item.status === 'pending_review'
      ? 'pending_brand_approval'
      : item.status;
  const stepIndex = WORKFLOW_STEPS.indexOf(normalizedStatus);

  return (
    <div className="space-y-5">
      {/* Status Badge */}
      <div className="flex items-center gap-3 flex-wrap">
        {(() => {
          const cfg = STAGE_CONFIG[item.status] || STAGE_CONFIG.draft;
          const Icon = cfg.icon;
          return (
            <Badge className={`${cfg.color} gap-1.5 px-3 py-1 text-sm`}>
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </Badge>
          );
        })()}
        {item.approved_date && (
          <span className="text-xs text-gray-400">
            Approved {formatDistanceToNow(new Date(item.approved_date), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Workflow Progress */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((step, i) => {
          const cfg = STAGE_CONFIG[step];
          const done = stepIndex > i;
          const current = stepIndex === i;
          return (
            <React.Fragment key={step}>
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  done
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : current
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 ring-1 ring-violet-300'
                      : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {cfg.label}
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Assign Reviewer (admin) */}
      {isAdmin && item.status !== 'approved' && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Assign Content Reviewer
          </p>
          <Select value={item.assigned_reviewer_email || ''} onValueChange={handleAssignReviewer}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select reviewer..." />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {item.assigned_reviewer_name && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" /> {item.assigned_reviewer_name}
            </p>
          )}
        </div>
      )}

      {/* Note Input */}
      {item.status !== 'approved' && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Note / Feedback
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note or feedback..."
            className="text-sm min-h-[70px] resize-none"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}

        {/* Submitter actions */}
        {item.status === 'draft' && isSubmitter && (
          <Button
            size="sm"
            onClick={handleSubmitForApproval}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Submit for Approval
          </Button>
        )}
        {item.status === 'changes_requested' && isSubmitter && (
          <Button
            size="sm"
            onClick={handleSubmitForApproval}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Resubmit
          </Button>
        )}

        {/* Brand approver actions */}
        {item.status === 'pending_brand_approval' && (isReviewer || isBrandApprover) && (
          <>
            <Button
              size="sm"
              onClick={handleBrandApprove}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Brand Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              className="text-red-600 border-red-200 gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          </>
        )}
      </div>

      {/* Workflow History */}
      {(item.workflow_history || []).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> History
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...(item.workflow_history || [])].reverse().map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-600 dark:text-violet-400 font-bold text-[9px]">
                    {(ev.by_name || ev.by_email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {ev.by_name || ev.by_email}
                  </span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-500">{ev.action?.replace(/_/g, ' ')}</span>
                  {ev.note && <p className="text-gray-400 mt-0.5 italic">"{ev.note}"</p>}
                  <p className="text-gray-300 dark:text-gray-600 mt-0.5">
                    {ev.timestamp
                      ? formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })
                      : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
