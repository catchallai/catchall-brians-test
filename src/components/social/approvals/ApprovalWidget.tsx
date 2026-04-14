import { useState, useEffect } from 'react';
import { Eye, Check, X } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface ApprovalWidgetProps {
  viewsCount: number;
  approvalsCount: number;
  rejectionsCount: number;
  dueDate?: string | null;
  dueTime?: string | null;
}

function DeadlineCountdown({ dueDate, dueTime }: { dueDate: string; dueTime?: string | null }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const deadline = dueTime ? new Date(`${dueDate}T${dueTime}`) : new Date(`${dueDate}T23:59:59`);

  const secsLeft = Math.floor((deadline.getTime() - now.getTime()) / 1000);
  const overdue = secsLeft < 0;
  const absS = Math.abs(secsLeft);
  const h = Math.floor(absS / 3600);
  const m = Math.floor((absS % 3600) / 60);
  const s = absS % 60;

  const formattedDate = dueTime
    ? format(deadline, 'MMM d, yyyy') +
      ' @ ' +
      format(deadline, 'hh:mma').replace('AM', 'AM').replace('PM', 'PM')
    : format(deadline, 'MMM d, yyyy');

  return (
    <div className="text-center mt-1.5">
      <p
        className={`text-xs font-mono font-semibold ${overdue ? 'text-red-500' : 'text-gray-500'}`}
      >
        {overdue ? 'OVERDUE ' : ''}
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        {overdue ? '' : ' left until Deadline'}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
    </div>
  );
}

export default function ApprovalWidget({
  viewsCount,
  approvalsCount,
  rejectionsCount,
  dueDate,
  dueTime,
}: ApprovalWidgetProps) {
  const items = [
    { icon: Eye, count: viewsCount, label: 'Views', color: 'text-gray-400' },
    { icon: Check, count: approvalsCount, label: 'Approved', color: 'text-emerald-500' },
    {
      icon: X,
      count: rejectionsCount,
      label: 'Rejected / Changes Requested',
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
          <DeadlineCountdown dueDate={dueDate} dueTime={dueTime} />
        ) : (
          <p className="text-xs text-gray-400 text-center mt-1.5">No Due Date Set</p>
        )}
      </div>
    </TooltipProvider>
  );
}
