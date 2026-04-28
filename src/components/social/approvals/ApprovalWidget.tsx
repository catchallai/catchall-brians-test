import { useState, useEffect } from 'react';
import { Eye, Check, X, FilePenLine } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import COPY from '@/lib/copy';

interface ApprovalWidgetProps {
  version: number;
  viewsCount: number;
  approvalsCount: number;
  rejectionsCount: number;
  dueDate?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
}

function DeadlineCountdown({ dueDate }: { dueDate: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const deadline = parseISO(dueDate + 'T23:59:59');

  const secsLeft = Math.floor((deadline.getTime() - now.getTime()) / 1000);
  const overdue = secsLeft < 0;
  const absS = Math.abs(secsLeft);
  const d = Math.floor(absS / 86400);
  const h = Math.floor((absS % 86400) / 3600);
  const m = Math.floor((absS % 3600) / 60);
  const s = absS % 60;

  return (
    <div className="text-center mt-2">
      <p
        className={`text-xs font-mono font-semibold ${overdue ? 'text-red-500' : 'text-gray-500'}`}
      >
        {`${overdue ? `${COPY.approvalWidget.overdue} ` : ''}${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${overdue ? '' : ` ${COPY.approvalWidget.leftUntilDueDate}`}`}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {COPY.approvalWidget.dueDatePrefix}{' '}
        <span className="font-semibold text-gray-600 dark:text-gray-300">
          {format(deadline, 'MMM d, yyyy')}
        </span>
      </p>
    </div>
  );
}

export default function ApprovalWidget({
  version,
  viewsCount,
  approvalsCount,
  rejectionsCount,
  dueDate,
  scheduledDate,
  scheduledTime,
}: ApprovalWidgetProps) {
  const items = [
    {
      icon: FilePenLine,
      count: version,
      label: COPY.approvalWidget.version,
      color: 'text-violet-500',
    },
    {
      icon: Eye,
      count: viewsCount,
      label: COPY.approvalWidget.views,
      color: 'text-gray-400',
    },
    {
      icon: Check,
      count: approvalsCount,
      label: COPY.approvalWidget.approved,
      color: 'text-emerald-500',
    },
    {
      icon: X,
      count: rejectionsCount,
      label: COPY.approvalWidget.rejectedOrChangesRequested,
      color: 'text-red-500',
    },
  ];

  const formattedPostDate = scheduledDate
    ? format(parseISO(scheduledDate), 'MMM d, yyyy') + (scheduledTime ? ` at ${scheduledTime}` : '')
    : null;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 min-w-[140px] p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          {items.map(({ icon: Icon, count, label, color }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-0.5 cursor-default">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className={`text-sm font-semibold ${color}`}>{count}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {dueDate ? (
          <DeadlineCountdown dueDate={dueDate} />
        ) : (
          <p className="text-xs text-gray-400 text-center">{COPY.approvalWidget.noDueDateSet}</p>
        )}
        <p className="text-xs text-gray-400 text-center">
          {formattedPostDate ? (
            <>
              {COPY.approvalWidget.postDatePrefix}{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {formattedPostDate}
              </span>
            </>
          ) : (
            COPY.approvalWidget.noPostDateSet
          )}
        </p>
      </div>
    </TooltipProvider>
  );
}
