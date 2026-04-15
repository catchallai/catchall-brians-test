import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { PostStatus } from '@/types/enums';
import COPY from '@/lib/copy';

type ApprovalAction = PostStatus.REJECTED | PostStatus.APPROVED | PostStatus.CHANGES_REQUESTED;

const DRAWER_CONFIG: Record<
  ApprovalAction,
  {
    label: string;
    submitLabel: string;
    placeholder: string;
    icon: typeof XCircle;
    submitClass: string;
    ringClass: string;
    required: boolean;
  }
> = {
  [PostStatus.REJECTED]: {
    label: COPY.approvalActionDrawer.rejectedLabel,
    submitLabel: COPY.approvalActionDrawer.rejectedSubmit,
    placeholder: COPY.approvalActionDrawer.placeholder.rejected,
    icon: XCircle,
    submitClass: 'bg-red-600 hover:bg-red-700 text-white',
    ringClass: 'focus:ring-red-500',
    required: true,
  },
  [PostStatus.APPROVED]: {
    label: COPY.approvalActionDrawer.approvedLabel,
    submitLabel: COPY.approvalActionDrawer.approvedSubmit,
    placeholder: COPY.approvalActionDrawer.placeholder.approved,
    icon: CheckCircle2,
    submitClass: 'bg-green-600 hover:bg-green-700 text-white',
    ringClass: 'focus:ring-green-500',
    required: false,
  },
  [PostStatus.CHANGES_REQUESTED]: {
    label: COPY.approvalActionDrawer.changesRequestedLabel,
    submitLabel: COPY.approvalActionDrawer.changesRequestedSubmit,
    placeholder: COPY.approvalActionDrawer.placeholder.changes_requested,
    icon: RotateCcw,
    submitClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    ringClass: 'focus:ring-amber-500',
    required: true,
  },
};

interface ApprovalActionDrawerProps {
  actionType: ApprovalAction | null;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function ApprovalActionDrawer({
  actionType,
  onSubmit,
  onCancel,
  isPending,
}: ApprovalActionDrawerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOpen = actionType !== null;
  const config = actionType ? DRAWER_CONFIG[actionType] : null;

  // Reset text and focus when drawer opens for a new action
  useEffect(() => {
    if (isOpen) {
      setText('');
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [actionType, isOpen]);

  const stableOnCancel = useCallback(onCancel, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableOnCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stableOnCancel]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (config?.required && !trimmed) return;
    onSubmit(trimmed);
  };

  if (!config) return null;

  const Icon = config.icon;
  const isSubmitDisabled = isPending || (config.required && !text.trim());

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-700">{config.label}</h4>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={config.placeholder}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className={`w-full resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 ${config.ringClass} text-gray-900`}
      />

      <div className="flex items-center gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="text-gray-600"
        >
          {COPY.general.cancel}
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`gap-1.5 ${config.submitClass}`}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Icon className="w-3.5 h-3.5" />
          )}
          {config.submitLabel}
        </Button>
      </div>
    </div>
  );
}
