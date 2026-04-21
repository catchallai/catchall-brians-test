import React, { useState, useEffect, useMemo } from 'react';
import COPY from '@/lib/copy';
import { todayLocal } from '@/utils/date';
import { normalizeReviewers, allReviewersApproved } from '@/utils/reviewers';
import { ReviewerApprovalStatus } from '@/types/reviewers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  RotateCcw,
  Loader2,
  ChevronDown,
  FileText,
  ShieldCheck,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ApprovalQueueView from '@/components/social/approvals/ApprovalQueueView';
import ApprovalActionDrawer from '@/components/social/approvals/ApprovalActionDrawer';
import { ReviewerPicker } from '@/components/social/approvals/ReviewerPicker';
import { PostStatus } from '@/types/enums';

// checkJs loses prop types for shadcn/ui components exported from .jsx files.
const TypedInput = /** @type {React.ComponentType<any>} */ (Input);
const TypedTextarea = /** @type {React.ComponentType<any>} */ (Textarea);

const PANEL_COPY = COPY.postApprovalPanel;

const WORKFLOW_STAGES = [
  {
    key: 'draft',
    label: PANEL_COPY.stages.draft.label,
    icon: FileText,
    description: PANEL_COPY.stages.draft.description,
  },
  {
    key: 'pending_approval',
    label: PANEL_COPY.stages.pendingApproval.label,
    icon: ShieldCheck,
    description: PANEL_COPY.stages.pendingApproval.description,
  },
  {
    key: 'approved',
    label: PANEL_COPY.stages.approved.label,
    icon: CheckCircle2,
    description: PANEL_COPY.stages.approved.description,
  },
  {
    key: 'published',
    label: PANEL_COPY.stages.published.label,
    icon: Megaphone,
    description: PANEL_COPY.stages.published.description,
  },
];

function getStageIndex(status) {
  if (status === 'changes_requested' || status === 'pending_review') {
    return 1;
  } // maps to pending_approval stage
  return WORKFLOW_STAGES.findIndex((s) => s.key === status);
}

/**
 * @param {{ post: any, onUpdate: any, readOnly?: boolean, hideEditorActions?: boolean, approvalErrors?: { reviewer?: string, priority?: string, dueDate?: string }, onNoteChange?: (note: string) => void }} props
 */
export default function PostApprovalPanel({
  post,
  onUpdate,
  hideEditorActions = false,
  approvalErrors = {},
  onNoteChange = undefined,
  readOnly = false,
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [dueDateError, setDueDateError] = useState('');
  const [dueDateDraft, setDueDateDraft] = useState(post.review_due_date || '');
  const [drawerAction, setDrawerAction] = useState(null);
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
    setDrawerAction(null);
    onNoteChange?.('');
  }, [post.id]);

  // Build per-stage who-did-what from workflow_history
  const stageActors = useMemo(() => {
    const map = {};
    const history = post.workflow_history || [];
    history.forEach((e) => {
      if (
        e.action === 'submitted_for_review' ||
        e.action === 'resubmitted' ||
        e.action === 'submitted_for_approval'
      ) {
        map['pending_approval'] = map['pending_approval'] || [];
        map['pending_approval'].push({
          name: e.by_name || e.by_email,
          action: PANEL_COPY.stageActors.submitted,
          time: e.timestamp,
        });
      } else if (e.action === 'approved') {
        map['approved'] = map['approved'] || [];
        map['approved'].push({
          name: e.by_name || e.by_email,
          action: PANEL_COPY.stageActors.approved,
          time: e.timestamp,
        });
      } else if (e.action === 'rejected') {
        map['rejected'] = map['rejected'] || [];
        map['rejected'].push({
          name: e.by_name || e.by_email,
          action: PANEL_COPY.stageActors.rejected,
          time: e.timestamp,
          note: e.note,
        });
      } else if (e.action === 'changes_requested') {
        map['changes_requested'] = map['changes_requested'] || [];
        map['changes_requested'].push({
          name: e.by_name || e.by_email,
          action: PANEL_COPY.stageActors.changesRequested,
          time: e.timestamp,
          note: e.note,
        });
      } else if (e.action === 'assigned') {
        map['assigned'] = map['assigned'] || [];
        map['assigned'].push({
          name: e.by_name || e.by_email,
          action: PANEL_COPY.stageActors.assignedReviewer,
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
  const isApprover = role === 'admin' || role === 'approver';
  const isEditor = isApprover || role === 'editor';
  const reviewers = normalizeReviewers(post);
  const isAssignedReviewer = reviewers.some((r) => r.email === currentUser?.email);

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

  const handleReviewersChange = (
    /** @type {{ email: string; name: string; role: string }[]} */ selectedReviewers
  ) => {
    const now = new Date().toISOString();
    // Preserve per-reviewer status for reviewers that were already assigned.
    const existingByEmail = Object.fromEntries(reviewers.map((r) => [r.email, r]));
    const nextReviewers = selectedReviewers.map(
      (/** @type {{ email: string; name: string }} */ s) =>
        existingByEmail[s.email]
          ? existingByEmail[s.email]
          : {
              email: s.email,
              name: s.name,
              assigned_date: now,
              status: ReviewerApprovalStatus.PENDING,
              responded_date: null,
            }
    );
    const primary = nextReviewers[0] ?? null;
    // @ts-ignore — checkJs cannot infer useMutation variable types in .jsx files
    updateMutation.mutate(
      addWorkflowEvent('assigned', {
        reviewers: nextReviewers,
        assigned_to_email: primary?.email ?? null,
        assigned_to_name: primary?.name ?? null,
        assigned_date: primary ? now : null,
      })
    );
  };

  const handleSubmitForApproval = () =>
    updateMutation.mutate(
      addWorkflowEvent('submitted_for_approval', { status: 'pending_approval' })
    );

  const handleRequestChanges = () => setDrawerAction('changes_requested');
  const handleApprove = () => setDrawerAction('approved');
  const handleReject = () => setDrawerAction('rejected');

  const handleDrawerSubmit = (text) => {
    const action = drawerAction;
    if (!action) return;

    const history = [...(post.workflow_history || [])];

    // Add tagged comment if text was provided
    if (text) {
      history.push({
        action: 'comment',
        action_type: action,
        by_email: currentUser?.email,
        by_name: currentUser?.full_name || currentUser?.email,
        timestamp: new Date().toISOString(),
        text,
      });
    }

    // Add workflow event
    history.push({
      action,
      by_email: currentUser?.email,
      by_name: currentUser?.full_name || currentUser?.email,
      timestamp: new Date().toISOString(),
    });

    // Update per-reviewer status in the reviewers array
    const now = new Date().toISOString();
    const reviewerStatusMap = {
      approved: ReviewerApprovalStatus.APPROVED,
      rejected: ReviewerApprovalStatus.REJECTED,
      changes_requested: ReviewerApprovalStatus.CHANGES_REQUESTED,
    };
    const updatedReviewers = reviewers.map((r) =>
      r.email === currentUser?.email
        ? { ...r, status: reviewerStatusMap[action], responded_date: now }
        : r
    );

    // Build the full mutation payload
    /** @type {Record<string, any>} */
    const payload = { workflow_history: history, reviewers: updatedReviewers };

    if (action === PostStatus.APPROVED && allReviewersApproved(updatedReviewers)) {
      payload.status = PostStatus.APPROVED;
      payload.approved_by = currentUser?.email;
      payload.approved_by_name = currentUser?.full_name || currentUser?.email;
      payload.approved_date = todayLocal();
      payload.media_approved = true;
      // If not all approved yet, post stays in current status — only reviewers array updates.
    } else if (action === PostStatus.REJECTED) {
      payload.status = PostStatus.REJECTED;
      payload.rejected_reason = text;
      payload.media_approved = false;
    } else if (action === PostStatus.CHANGES_REQUESTED) {
      payload.status = PostStatus.CHANGES_REQUESTED;
    }

    // @ts-ignore — checkJs cannot infer useMutation variable types in .jsx files
    updateMutation.mutate(payload, { onSuccess: () => setDrawerAction(null) });
  };

  const handleDrawerCancel = () => setDrawerAction(null);

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
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{PANEL_COPY.heading}</h3>

        {isRejected ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">{PANEL_COPY.postRejected}</p>
              {post.rejected_reason && (
                <p className="text-sm text-red-600 mt-0.5">{post.rejected_reason}</p>
              )}
            </div>
            {isEditor && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForApproval}
                disabled={updateMutation.isPending}
                className="ml-auto gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {PANEL_COPY.resubmit}
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
                              {isChangesOnReview ? PANEL_COPY.changesNeeded : stage.label}
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
                          <p className="text-xs text-gray-400 italic">{PANEL_COPY.noActivityYet}</p>
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
              ? PANEL_COPY.changesRequestedHint
              : WORKFLOW_STAGES[currentStageIdx]?.description || ''}
          </p>
        )}
      </div>

      {/* ── Assignment & Meta + Note ── */}
      {readOnly ? (
        <>
          <ApprovalQueueView
            reviewers={reviewers}
            priority={post.priority}
            dueDate={post.review_due_date}
            note={[...(post.workflow_history || [])].reverse().find((e) => e.note)?.note ?? null}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assign Reviewers */}
            {isEditor && (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Reviewers{' '}
                  <span className="text-red-500">*</span>
                </p>
                <ReviewerPicker
                  value={reviewers.map((r) => ({
                    email: r.email,
                    name: r.name,
                    role:
                      teamMembers.find((m) => m.email === r.email)?.social_media_role ||
                      teamMembers.find((m) => m.email === r.email)?.role ||
                      '',
                  }))}
                  onChange={handleReviewersChange}
                  teamMembers={teamMembers.map((u) => ({
                    email: u.email,
                    name: u.full_name || u.email,
                    role: u.social_media_role || u.role,
                  }))}
                  error={!!approvalErrors.reviewer}
                />
                {approvalErrors.reviewer && (
                  <p className="text-xs text-red-500">{approvalErrors.reviewer}</p>
                )}
              </div>
            )}

            {/* Priority */}
            {isEditor && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {PANEL_COPY.priorityLabel} <span className="text-red-500">*</span>
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
                    <SelectItem value="low">{PANEL_COPY.priorityLow}</SelectItem>
                    <SelectItem value="normal">{PANEL_COPY.priorityNormal}</SelectItem>
                    <SelectItem value="high">{PANEL_COPY.priorityHigh}</SelectItem>
                    <SelectItem value="urgent">{PANEL_COPY.priorityUrgent}</SelectItem>
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
                    {PANEL_COPY.dueDateLabel} <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {COPY.calendarPostModal.approvalDueDateHint}
                  </p>
                </div>
                <TypedInput
                  type="date"
                  value={dueDateDraft}
                  min={today}
                  max={post.scheduled_date || undefined}
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
                    if (value && post.scheduled_date && value > post.scheduled_date) {
                      setDueDateError(COPY.calendarPostModal.approvalDueDateAfterSchedule);
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {PANEL_COPY.noteLabel}
            </p>
            <TypedTextarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onNoteChange?.(e.target.value);
              }}
              placeholder={PANEL_COPY.notePlaceholder}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </>
      )}

      {/* ── Action Buttons ── */}
      {!hideEditorActions && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {PANEL_COPY.actionsLabel}
          </p>

          <div className="flex flex-wrap gap-2">
            {/* Draft → Submit for Approval */}
            {isEditor && post.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForApproval}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <Send className="w-3.5 h-3.5" /> {PANEL_COPY.submitForApproval}
              </Button>
            )}

            {/* Changes Requested → Resubmit */}
            {isEditor && post.status === 'changes_requested' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitForApproval}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <Send className="w-3.5 h-3.5" /> {PANEL_COPY.resubmitForApproval}
              </Button>
            )}

            {/* Pending Approval → Approve / Reject / Request Changes */}
            {isApprover &&
              (post.status === 'pending_approval' || post.status === 'pending_review') && (
                <>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={updateMutation.isPending}
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {PANEL_COPY.approve}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReject}
                    disabled={updateMutation.isPending}
                    className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> {PANEL_COPY.reject}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestChanges}
                    disabled={updateMutation.isPending}
                    className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {PANEL_COPY.requestChanges}
                  </Button>
                </>
              )}

            {/* Approved info */}
            {post.status === 'approved' && (
              <div className="w-full p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700 flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {COPY.approvalProgress.allApproved(reviewers.length)}
                  {post.approved_date &&
                    ` on ${format(parseISO(post.approved_date), 'MMM d, yyyy')}`}
                </span>
              </div>
            )}

            {/* Partial approval progress (not yet fully approved) */}
            {(post.status === PostStatus.PENDING_REVIEW ||
              post.status === PostStatus.PENDING_APPROVAL) &&
              reviewers.length > 1 &&
              reviewers.some((r) => r.status === ReviewerApprovalStatus.APPROVED) && (
                <div className="w-full p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700 flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {COPY.approvalProgress.partialApproval(
                      reviewers.filter((r) => r.status === ReviewerApprovalStatus.APPROVED).length,
                      reviewers.length
                    )}
                  </span>
                </div>
              )}
          </div>

          {/* ── Action Drawer ── */}
          <ApprovalActionDrawer
            actionType={drawerAction}
            onSubmit={handleDrawerSubmit}
            onCancel={handleDrawerCancel}
            isPending={updateMutation.isPending}
          />

          {updateMutation.isPending && !drawerAction && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {PANEL_COPY.saving}
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
            {PANEL_COPY.history(post.workflow_history.length)}
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
