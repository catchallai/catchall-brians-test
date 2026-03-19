import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { differenceInHours, parseISO } from 'date-fns';

export default function ApprovalMetricsTab({ posts, currentUser, statusLabels }) {
  // Compute approver leaderboard from workflow history
  const approverStats = {};
  posts.forEach((post) => {
    (post.workflow_history || []).forEach((entry) => {
      if (!entry.by_email) return;
      if (!approverStats[entry.by_email]) {
        approverStats[entry.by_email] = {
          name: entry.by_name || entry.by_email,
          email: entry.by_email,
          approvals: 0,
          rejections: 0,
          reviews: 0,
        };
      }
      if (entry.action === 'approved') approverStats[entry.by_email].approvals++;
      if (entry.action === 'rejected') approverStats[entry.by_email].rejections++;
      if (entry.action === 'submitted_for_review' || entry.action === 'submitted_for_approval')
        approverStats[entry.by_email].reviews++;
    });
  });
  const approvers = Object.values(approverStats).sort(
    (a, b) => b.approvals - b.rejections - (a.approvals - a.rejections)
  );

  // Avg time to approve (hours)
  const timesToApprove = posts
    .filter((p) => p.status === 'approved' && p.approved_date)
    .map((p) => {
      const submitEvent = (p.workflow_history || []).find(
        (e) => e.action === 'submitted_for_review'
      );
      if (!submitEvent) return null;
      return differenceInHours(parseISO(p.approved_date), parseISO(submitEvent.timestamp));
    })
    .filter(Boolean);
  const avgHours = timesToApprove.length
    ? Math.round(timesToApprove.reduce((a, b) => a + b, 0) / timesToApprove.length)
    : null;

  const total = posts.length;
  const approved = posts.filter((p) => ['approved', 'published'].includes(p.status)).length;
  const rejected = posts.filter((p) => p.status === 'rejected').length;
  const pending = posts.filter((p) =>
    ['pending_review', 'pending_approval', 'changes_requested'].includes(p.status)
  ).length;
  const overdueCount = posts.filter((p) => {
    if (!p.review_due_date || ['approved', 'published', 'rejected'].includes(p.status))
      return false;
    return new Date(p.review_due_date) < new Date();
  }).length;

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Posts', value: total, icon: Eye, color: 'text-violet-600 bg-violet-50' },
          {
            label: 'Approved',
            value: approved,
            icon: CheckCircle2,
            color: 'text-green-600 bg-green-50',
          },
          { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          {
            label: 'Overdue',
            value: overdueCount,
            icon: AlertTriangle,
            color: 'text-orange-600 bg-orange-50',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Approval Rate
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="3"
                  strokeDasharray={`${approvalRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {approvalRate}%
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: 'Approved', count: approved, color: 'bg-green-500' },
                { label: 'Rejected', count: rejected, color: 'bg-red-500' },
                { label: 'Pending', count: pending, color: 'bg-yellow-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          {avgHours !== null && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Timer className="w-4 h-4 text-violet-500" />
              Avg time to approval:{' '}
              <strong className="text-gray-900 dark:text-white ml-1">{avgHours}h</strong>
            </div>
          )}
        </div>

        {/* Approver Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            Team Activity
          </h3>
          {approvers.length === 0 ? (
            <p className="text-sm text-gray-400">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {approvers.slice(0, 6).map((a, i) => (
                <div key={a.email} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-violet-100 text-violet-600">
                      {a.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {a.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{a.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.approvals > 0 && (
                      <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {a.approvals}
                      </Badge>
                    )}
                    {a.rejections > 0 && (
                      <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                        <XCircle className="w-3 h-3" />
                        {a.rejections}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown by Platform */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(statusLabels).map(([key, { label, color }]) => {
            const count = posts.filter((p) => p.status === key).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <Badge className={`text-xs w-32 justify-center ${color}`}>{label}</Badge>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
