import { useState, useEffect } from 'react';
import { Eye, Check, X } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import COPY from '@/lib/copy';

interface ApprovalWidgetProps {
  viewsCount: number;
  approvalsCount: number;
  rejectionsCount: number;
  dueDate?: string | null;
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
  const h = Math.floor(absS / 3600);
  const m = Math.floor((absS % 3600) / 60);
  const s = absS % 60;

  return (
    <div className="text-center mt-1.5">
      <p
        className={`text-xs font-mono font-semibold ${overdue ? 'text-red-500' : 'text-gray-500'}`}
      >
        {overdue ? `${COPY.approvalWidget.overdue} ` : ''}
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        {overdue ? '' : ` ${COPY.approvalWidget.leftUntilDeadline}`}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{format(deadline, 'MMM d, yyyy')}</p>
    </div>
  );
}

export default function ApprovalWidget({
  viewsCount,
  approvalsCount,
  rejectionsCount,
  dueDate,
}: ApprovalWidgetProps) {
  const items = [
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

  return (
    <TooltipProvider>
      <div>
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
          <p className="text-xs text-gray-400 text-center mt-1.5">
            {COPY.approvalWidget.noDueDateSet}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
