import { escapeHtml } from '@/utils/html';
import { PostPriority } from '@/types/enums';

// TODO: pull from brand settings when available
const COMPANY_NAME = 'CatchAll';
const PRIMARY_COLOR = '#18181b';
const CTA_COLOR = '#10b981';

const MAX_ROWS = 5;
const SUBJECT_TITLE_MAX = 60;

export interface ApprovalEmailPendingItem {
  title: string;
  submittedByName: string;
  dueDate?: string | null;
  priority: PostPriority;
}

export interface ApprovalEmailData {
  reviewerName: string;
  submitterName: string;
  postUrl: string;
  queueUrl: string;
  pendingItems: ApprovalEmailPendingItem[];
  /** Title of the just-submitted post, used in the subject line. */
  submittedPostTitle: string;
}

export interface ApprovalEmailRendered {
  subject: string;
  html: string;
}

interface PriorityStyle {
  label: string;
  dotColor: string;
  textColor: string;
}

const PRIORITY_STYLES: Record<PostPriority, PriorityStyle> = {
  [PostPriority.URGENT]: { label: 'Urgent', dotColor: '#ef4444', textColor: '#dc2626' },
  [PostPriority.HIGH]: { label: 'High', dotColor: '#f97316', textColor: '#ea580c' },
  [PostPriority.NORMAL]: { label: 'Normal', dotColor: '#a1a1aa', textColor: '#71717a' },
  [PostPriority.LOW]: { label: 'Low', dotColor: '#a1a1aa', textColor: '#71717a' },
};

function formatDueDate(iso?: string | null): string {
  if (!iso) return '—';
  // ISO date-only strings (YYYY-MM-DD) parse as UTC midnight, which can
  // shift a day in western timezones. Parse parts manually for date-only input.
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function renderRow(item: ApprovalEmailPendingItem): string {
  const priority = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES[PostPriority.NORMAL];
  return `
    <tr>
      <td class="post-title">${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.submittedByName)}</td>
      <td>${escapeHtml(formatDueDate(item.dueDate))}</td>
      <td>
        <span class="priority" style="color:${priority.textColor}">
          <span class="priority-dot" style="background:${priority.dotColor}"></span>${escapeHtml(priority.label)}
        </span>
      </td>
    </tr>`;
}

function renderRows(items: ApprovalEmailPendingItem[]): string {
  const shown = items.slice(0, MAX_ROWS);
  const overflow = items.length - shown.length;
  const rows = shown.map(renderRow).join('');
  const overflowRow =
    overflow > 0
      ? `
    <tr>
      <td colspan="4" style="font-size:12px;color:#a1a1aa;text-align:center;padding:10px 12px;">+ ${overflow} more</td>
    </tr>`
      : '';
  return rows + overflowRow;
}

export function renderApprovalNotificationEmail(data: ApprovalEmailData): ApprovalEmailRendered {
  const pendingCount = data.pendingItems.length;
  const rowsHtml = renderRows(data.pendingItems);
  const subject = `Post Review Requested: "${truncate(data.submittedPostTitle, SUBJECT_TITLE_MAX)}"`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A new post is waiting for your approval</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; color: #18181b; padding: 40px 20px; }
  .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); }
  .email-header { padding: 36px 40px; background: ${PRIMARY_COLOR}; text-align: center; }
  .email-header .logo-placeholder { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
  .email-header .logo-sub { font-size: 12px; color: #a1a1aa; font-weight: 400; margin-top: 4px; }
  .email-body { padding: 32px 40px; }
  .greeting { font-size: 15px; color: #3f3f46; margin-bottom: 16px; line-height: 1.5; }
  .headline { font-size: 20px; font-weight: 600; color: #18181b; margin-bottom: 8px; line-height: 1.3; }
  .subtext { font-size: 14px; color: #71717a; margin-bottom: 28px; line-height: 1.5; }
  .cta-wrapper { text-align: center; margin-bottom: 28px; }
  .cta-button { display: inline-block; background: ${CTA_COLOR}; color: #ffffff !important; text-decoration: none; font-size: 18px; font-weight: 600; padding: 17px 52px; border-radius: 8px; letter-spacing: 0.01em; }
  .pending-badge-wrapper { text-align: center; margin-bottom: 28px; }
  .pending-badge { display: inline-flex; align-items: center; gap: 8px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 10px 16px; }
  .pending-badge .count { font-size: 22px; font-weight: 700; color: #18181b; }
  .pending-badge .label { font-size: 13px; color: #71717a; line-height: 1.3; }
  .table-label { font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
  .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .summary-table th { text-align: left; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-bottom: 1px solid #e4e4e7; }
  .summary-table td { font-size: 13px; color: #3f3f46; padding: 10px 12px; border-bottom: 1px solid #f4f4f5; vertical-align: middle; }
  .summary-table tr:last-child td { border-bottom: none; }
  .summary-table .post-title { font-weight: 500; color: #18181b; }
  .priority { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; }
  .priority-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .cta-secondary { display: block; text-align: center; font-size: 12px; color: #a1a1aa; }
  .cta-secondary a { color: #71717a; text-decoration: underline; }
  .email-footer { padding: 24px 40px; background: ${PRIMARY_COLOR}; text-align: center; }
  .email-footer p { font-size: 12px; color: #a1a1aa; line-height: 1.5; }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-header">
    <div class="logo-placeholder">${escapeHtml(COMPANY_NAME)}</div>
    <div class="logo-sub">Content Approval</div>
  </div>
  <div class="email-body">
    <p class="greeting">Hi ${escapeHtml(data.reviewerName)},</p>
    <p class="headline">A new post is waiting for your approval</p>
    <p class="subtext"><strong>${escapeHtml(data.submitterName)}</strong> submitted an item for your review.</p>
    <div class="cta-wrapper">
      <a href="${escapeHtml(data.postUrl)}" class="cta-button">Review Post →</a>
    </div>
    <div class="pending-badge-wrapper">
      <div class="pending-badge">
        <span class="count">${pendingCount}</span>
        <span class="label">${pendingCount === 1 ? 'item awaiting' : 'items awaiting'}<br>your approval</span>
      </div>
    </div>
    <p class="table-label">Your pending queue</p>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Post</th>
          <th>Submitted by</th>
          <th>Due Date</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}
      </tbody>
    </table>
    <p class="cta-secondary"><a href="${escapeHtml(data.queueUrl)}">View all pending items</a></p>
  </div>
  <div class="email-footer">
    <p>You're receiving this because you're on the approval list for this content. If you believe this is an error, contact your team admin.</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html };
}
