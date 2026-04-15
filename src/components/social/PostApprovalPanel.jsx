import React, { useState, useEffect, useMemo } from 'react';
import COPY from '@/lib/copy';
import { todayLocal } from '@/utils/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Send,
  UserPlus,
  ThumbsUp,
  RotateCcw,
  Loader2,
  ChevronDown,
  FileText,
  Eye,
  ShieldCheck,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ApprovalQueueView from '@/components/social/approvals/ApprovalQueueView';

// checkJs loses prop types for shadcn/ui components exported from .jsx files.
const TypedInput = /** @type {React.ComponentType<any>} */ (Input);
const TypedTextarea = /** @type {React.ComponentType<any>} */ (Textarea);

const WORKFLOW_STAGES = [
  { key: 'draft', label: 'Draft', icon: FileText, description: 'Post is being created' },
  {
    key: 'pending_review',
    label: 'In Review',
    icon: Eye,
    description: 'Awaiting reviewer feedback',
  },
  {
    key: 'pending_approval',
    label: 'Awaiting Approval',
    icon: ShieldCheck,
    description: 'Ready for final sign-off',
  },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, description: 'Ready to publish' },
  { key: 'published', label: 'Published', icon: Megaphone, description: 'Live on platforms' },
];

const _STAGE_ORDER = [
  'draft',
  'pending_review',
  'changes_requested',
  'pending_approval',
  'approved',
  'published',
];

function getStageIndex(status) {
  if (status === 'changes_requested') {
    return 1;
  } // maps to pending_review stage
  return WORKFLOW_STAGES.findIndex((s) => s.key === status);
}

const _PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

/**
 * @param {{ post: any, onUpdate: any, readOnly?: boolean, onPendingAction?: (action: string) => void, hideEditorActions?: boolean, approvalErrors?: { reviewer?: string, priority?: string, dueDate?: string }, onNoteChange?: (note: string) => void }} props
 */
export default function PostApprovalPanel({
  post,
  onUpdate,
  hideEditorActions = false,
  approvalErrors = {},
  onNoteChange = undefined,
  readOnly = false,
  onPendingAction,
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [dueDateError, setDueDateError] = useState('');
  const [dueDateDraft, setDueDateDraft] = useState(post.review_due_date || '');
  const today = todayLocal();

  // Keep the local draft in sync when the post's due date changes externally
  // (e.g. on initial load or when a different post is selected).
  useEffect(() => {
    setDueDateDraft(post.review_due_date || '');
  }, [post.review_due_date]);

  // Reset the note (and any stale due-date error) when switching to a different
  // post so content typed for one post doesn't leak into another's approval
  // workflow / email. Intentionally omits onNoteChange from deps — we don't
  // want to wipe the note on parent re-renders if a caller ever passes an
  // unstable callback identity.
  useEffect(() => {
    setNote('');
    setDueDateError('');
    onNoteChange?.('');
  }, [post.id]);

  // Build per-stage who-did-what from workflow_history
  const stageActors = useMemo(() => {
    const map = {};
    const history = post.workflow_history || [];
    history.forEach((e) => {
      if (e.action === 'submitted_for_review' || e.action === 'resubmitted') {
        map['pending_review'] = map['pending_review'] || [];
        map['pending_review'].push({
          name: e.by_name || e.by_email,
          action: 'Submitted',
          time: e.timestamp,
        });
      } else if (e.action === 'submitted_for_approval') {
        map['pending_approval'] = map['pending_approval'] || [];
        map['pending_approval'].push({
          name: e.by_name || e.by_email,
          action: 'Reviewed',
          time: e.timestamp,
        });
      } else if (e.action === 'approved') {
        map['approved'] = map['approved'] || [];
        map['approved'].push({
          name: e.by_name || e.by_email,
          action: 'Approved ✓',
          time: e.timestamp,
        });
      } else if (e.action === 'rejected') {
        map['rejected'] = map['rejected'] || [];
        map['rejected'].push({
          name: e.by_name || e.by_email,
          action: 'Rejected',
          time: e.timestamp,
          note: e.note,
        });
      } else if (e.action === 'changes_requested') {
        map['changes_requested'] = map['changes_requested'] || [];
        map['changes_requested'].push({
          name: e.by_name || e.by_email,
          action: 'Changes Requested',
          time: e.timestamp,
          note: e.note,
        });
      } else if (e.action === 'assigned') {
        map['assigned'] = map['assigned'] || [];
        map['assigned'].push({
          name: e.by_name || e.by_email,
          action: 'Assigned reviewer',
          time: e.timestamp,
        });
      }
    });
    return map;
  }, [post.workflow_history]);

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      if (onUpdate) {
        onUpdate(variables);
      }
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
    };
    return { workflow_history: [...history, newEntry], ...extraData };
  };

  const handleAssign = (userEmail) => {
    const user = allUsers.find((u) => u.email === userEmail);
    // Status is intentionally not changed here — it transitions to pending_review
    // only when the user explicitly clicks "Send for Approval" / "Submit for Review".
    // @ts-ignore — checkJs cannot infer useMutation variable types in .jsx files
    updateMutation.mutate(
      addWorkflowEvent('assigned', {
        assigned_to_email: userEmail,
        assigned_to_name: user?.full_name || userEmail,
        assigned_date: new Date().toISOString(),
      })
    );
  };

  const handleSubmitForReview = () =>
    updateMutation.mutate(addWorkflowEvent('submitted_for_review', { status: 'pending_review' }));

  const handleSubmitForApproval = () =>
    updateMutation.mutate(
      addWorkflowEvent('submitted_for_approval', { status: 'pending_approval' })
    );

  const handleRequestChanges = () => {
    if (onPendingAction) {
      onPendingAction('changes_requested');
    }
  };

  const handleApprove = () =>
    updateMutation.mutate(
      addWorkflowEvent('approved', {
        status: 'approved',
        approved_by: currentUser?.email,
        approved_by_name: currentUser?.full_name || currentUser?.email,
        approved_date: todayLocal(),
        media_approved: true, // media is transferred to Approved Media Database
      })
    );

  const handleReject = () => {
    if (onPendingAction) {
      onPendingAction('rejected');
    }
  };

  const teamMembers = allUsers.filter((u) =>
    ['admin', 'editor', 'approver'].includes(u.social_media_role || u.role)
  );

  const currentStageIdx = getStageIndex(post.status);
  const isRejected = post.status === 'rejected';
  const isChangesRequested = post.status === 'changes_requested';

  return (
    <div className="space-y-6">
      {/* ── Visual Workflow Stepper ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Approval Workflow</h3>

        {isRejected ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Post Rejected</p>
              {post.rejected_reason && (
                <p className="text-sm text-red-600 mt-0.5">{post.rejected_reason}</p>
              )}
            </div>
            {isEditor && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForReview}
                disabled={updateMutation.isPending}
                className="ml-auto gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Resubmit
              </Button>
            )}
          </div>
        ) : (
          <TooltipProvider>
            <div className="relative">
              {/* connector line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 z-0" />
              <div className="relative z-10 flex justify-between">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const StageIcon = stage.icon;
                  const isDone = currentStageIdx > idx;
                  const isCurrent = currentStageIdx === idx;
                  const isChangesOnReview = isChangesRequested && idx === 1;
                  const actors = stageActors[stage.key] || [];

                  return (
                    <Tooltip key={stage.key}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-2 flex-1 cursor-default">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isDone
                                ? 'bg-green-500 border-green-500 text-white'
                                : isCurrent || isChangesOnReview
                                  ? isChangesOnReview
                                    ? 'bg-orange-100 border-orange-400 text-orange-600'
                                    : 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200'
                                  : 'bg-white border-gray-200 text-gray-300'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <StageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-xs font-semibold ${
                                isDone
                                  ? 'text-green-600'
                                  : isCurrent || isChangesOnReview
                                    ? isChangesOnReview
                                      ? 'text-orange-600'
                                      : 'text-violet-700'
                                    : 'text-gray-400'
                              }`}
                            >
                              {isChangesOnReview ? 'Changes Needed' : stage.label}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] p-3 space-y-2">
                        <p className="text-xs font-bold text-gray-700">{stage.label}</p>
                        <p className="text-xs text-gray-500">{stage.description}</p>
                        {actors.length > 0 && (
                          <div className="border-t border-gray-100 pt-2 space-y-1.5">
                            {actors.map((a, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-semibold text-gray-700">{a.name}</span>
                                <span className="text-gray-400"> · {a.action}</span>
                                <div className="text-gray-400 text-[10px]">
                                  {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                                </div>
                                {a.note && (
                                  <p className="text-gray-500 italic text-[10px]">"{a.note}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {actors.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No activity yet</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        )}

        {/* Current stage description */}
        {!isRejected && (
          <p className="text-xs text-center text-gray-400 mt-4">
            {isChangesRequested
              ? 'Changes have been requested — update and resubmit.'
              : WORKFLOW_STAGES[currentStageIdx]?.description || ''}
          </p>
        )}
      </div>

      {/* ── Assignment & Meta + Note ── */}
      {readOnly ? (
        <>
          <ApprovalQueueView
            reviewer={
              post.assigned_to_email
                ? {
                    name: post.assigned_to_name,
                    email: post.assigned_to_email,
                    assignedDate: post.assigned_date,
                  }
                : null
            }
            priority={post.priority}
            dueDate={post.review_due_date}
            note={[...(post.workflow_history || [])].reverse().find((e) => e.note)?.note ?? null}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assign Reviewer */}
            {isEditor && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Reviewer{' '}
                  <span className="text-red-500">*</span>
                </p>
                {post.assigned_to_email ? (
                  <div
                    className={`flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border ${approvalErrors.reviewer ? 'border-red-300' : 'border-blue-100'}`}
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-blue-200 text-blue-700">
                        {post.assigned_to_name?.[0] || post.assigned_to_email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {post.assigned_to_name || post.assigned_to_email}
                      </p>
                      {post.assigned_date && (
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(post.assigned_date), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() =>
                          updateMutation.mutate({
                            assigned_to_email: null,
                            assigned_to_name: null,
                          })
                        }
                        className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <Select onValueChange={handleAssign}>
                    <SelectTrigger
                      className={`text-sm h-9 ${approvalErrors.reviewer ? 'border-red-400 focus:ring-red-400' : ''}`}
                    >
                      <SelectValue placeholder="Assign reviewer…" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((u) => (
                        <SelectItem key={u.id} value={u.email}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs text-violet-600 font-medium">
                              {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                            </div>
                            <span>{u.full_name || u.email}</span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {u.social_media_role || u.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {approvalErrors.reviewer && (
                  <p className="text-xs text-red-500">{approvalErrors.reviewer}</p>
                )}
              </div>
            )}

            {/* Priority */}
            {isEditor && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Priority <span className="text-red-500">*</span>
                </p>
                <Select
                  value={post.priority || 'normal'}
                  onValueChange={(v) => updateMutation.mutate({ priority: v })}
                >
                  <SelectTrigger
                    className={`text-sm h-9 ${approvalErrors.priority ? 'border-red-400 focus:ring-red-400' : ''}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {approvalErrors.priority && (
                  <p className="text-xs text-red-500">{approvalErrors.priority}</p>
                )}
              </div>
            )}

            {/* Review Due Date */}
            {isEditor && (
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Due Date <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {COPY.calendarPostModal.approvalDueDateHint}
                  </p>
                </div>
                <TypedInput
                  type="date"
                  value={dueDateDraft}
                  min={today}
                  onChange={(e) => {
                    setDueDateDraft(e.target.value);
                    if (dueDateError) setDueDateError('');
                  }}
                  onBlur={() => {
                    const value = dueDateDraft;
                    if (value && value < today) {
                      setDueDateError(COPY.calendarPostModal.approvalDueDatePast);
                      return;
                    }
                    setDueDateError('');
                    if (value !== (post.review_due_date || '')) {
                      // @ts-ignore — checkJs cannot infer useMutation variable types in .jsx files
                      updateMutation.mutate({ review_due_date: value });
                    }
                  }}
                  className={`text-sm h-9 ${approvalErrors.dueDate || dueDateError ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {(approvalErrors.dueDate || dueDateError) && (
                  <p className="text-xs text-red-500">{dueDateError || approvalErrors.dueDate}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Action Note ── */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</p>
            <TypedTextarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onNoteChange?.(e.target.value);
              }}
              placeholder="Add a note to your reviewers (optional)"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </>
      )}

      {/* ── Action Buttons ── */}
      {!hideEditorActions && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>

          <div className="flex flex-wrap gap-2">
            {/* Draft → Submit for Review */}
            {isEditor && post.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForReview}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <Send className="w-3.5 h-3.5" /> Submit for Review
              </Button>
            )}

            {/* Changes Requested → Resubmit */}
            {isEditor && post.status === 'changes_requested' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForReview}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <Send className="w-3.5 h-3.5" /> Resubmit for Review
              </Button>
            )}

            {/* In Review → Pass to Approver or Request Changes */}
            {(isAssignedReviewer || isApprover) && post.status === 'pending_review' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSubmitForApproval}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Pass to Approver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestChanges}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Changes
                </Button>
              </>
            )}

            {/* Pending Approval → Approve / Reject / Request Changes */}
            {isApprover && post.status === 'pending_approval' && (
              <>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestChanges}
                  disabled={updateMutation.isPending}
                  className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Changes
                </Button>
              </>
            )}

            {/* Approved info */}
            {post.status === 'approved' && (
              <div className="w-full p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700 flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Approved by <strong>{post.approved_by_name || post.approved_by}</strong>
                  {post.approved_date &&
                    ` on ${format(parseISO(post.approved_date), 'MMM d, yyyy')}`}
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
      )}

      {/* ── Workflow History ── */}
      {post.workflow_history?.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
          >
            {showHistory ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            History ({post.workflow_history.length})
          </button>
          {showHistory && (
            <div className="space-y-3 border-l-2 border-gray-100 pl-4 ml-1 mt-2">
              {[...post.workflow_history].reverse().map((entry, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-200 border-2 border-white" />
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-700">
                        {entry.by_name || entry.by_email}
                      </span>
                      <span className="capitalize text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full text-[11px]">
                        {entry.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-gray-500 italic bg-gray-50 px-2 py-1 rounded-lg mt-1">
                        "{entry.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
