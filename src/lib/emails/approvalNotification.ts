import { escapeHtml } from '@/utils/html';
import { PostPriority } from '@/types/enums';

// TODO: pull from brand settings when available
const COMPANY_NAME = 'CatchAll';
const PRIMARY_COLOR = '#18181b';
const CTA_COLOR = '#10b981';

/**
 * Max number of rows rendered in the "Your pending queue" table. Exported so
 * callers can cap their data prep at the same limit instead of mapping the
 * entire fetched queue just to have the renderer discard all but the first N.
 */
export const APPROVAL_EMAIL_MAX_ROWS = 5;
const MAX_ROWS = APPROVAL_EMAIL_MAX_ROWS;
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
  /** Items to display in the queue table (renderer caps at MAX_ROWS). */
  pendingItems: ApprovalEmailPendingItem[];
  /**
   * Total pending count for the reviewer. Drives the badge number and the
   * "+ N more" overflow row. Separate from pendingItems.length so the caller
   * can pass an accurate total when the item list is capped for display.
   */
  pendingCount: number;
  /** Title of the just-submitted post, used in the subject line. */
  submittedPostTitle: string;
  /** Due date of the just-submitted post. Rendered in the subject line (MM/DD/YY) and body headline (Mon Day, Year). */
  submittedPostDueDate?: string | null;
  /** Optional free-text note from the submitter. When present, rendered below the subtext. */
  authorNote?: string | null;
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

// ISO date-only strings (YYYY-MM-DD) parse as UTC midnight, which can
// shift a day in western timezones. Parse parts manually for date-only input.
function parseDueDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnlyMatch) {
    // `new Date(y, m, d)` silently normalizes out-of-range values (e.g. month 13,
    // day 40), so verify the constructed date round-trips back to the input parts.
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const d = new Date(year, month - 1, day);
    if (
      Number.isNaN(d.getTime()) ||
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }
    return d;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDueDate(iso?: string | null): string {
  const d = parseDueDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSubjectDueDate(iso?: string | null): string | null {
  const d = parseDueDate(iso);
  if (!d) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatBodyDueDate(iso?: string | null): string | null {
  const d = parseDueDate(iso);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(s: string, max: number): string {
  // Reserve one char for the ellipsis so the returned string is at most `max` long.
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Captions flow into the subject line from a textarea, so they can contain CR/LF
// and other control chars. Newlines in an email subject risk header injection or
// silent send failures depending on transport.
function sanitizeSubjectText(s: string): string {
  return s
    .replace(/[\r\n\t\v\f\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
          <span class="priority-dot" style="background:${priority.dotColor};background-color:${priority.dotColor}"></span>${escapeHtml(priority.label)}
        </span>
      </td>
    </tr>`;
}

function renderRows(items: ApprovalEmailPendingItem[], totalCount: number): string {
  const shown = items.slice(0, MAX_ROWS);
  const overflow = Math.max(0, totalCount - shown.length);
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
  const pendingCount = Math.max(0, data.pendingCount);
  const rowsHtml = renderRows(data.pendingItems, pendingCount);
  const subjectDueDate = formatSubjectDueDate(data.submittedPostDueDate);
  const bodyDueDate = formatBodyDueDate(data.submittedPostDueDate);
  const subject = `Post Review Requested: "${truncate(sanitizeSubjectText(data.submittedPostTitle), SUBJECT_TITLE_MAX)}"${
    subjectDueDate ? ` - Due Date: ${subjectDueDate}` : ''
  }`;
  const headline = bodyDueDate
    ? `A new post with a due date of <strong>${escapeHtml(bodyDueDate)}</strong> is waiting for your approval`
    : 'A new post is waiting for your approval';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no">
<title>A new post is waiting for your approval</title>
<!--[if mso]>
<xml>
  <o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    <o:AllowPNG/>
  </o:OfficeDocumentSettings>
</xml>
<style>
  * { font-family: Arial, sans-serif !important; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  .cta-button-td { mso-padding-alt: 17px 52px 17px 52px; }
</style>
<![endif]-->
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f4f4f5; color: #18181b; padding: 40px 20px; text-align: center; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  .email-wrapper, .email-wrapper * { text-align: initial; }
  .email-header, .cta-wrapper, .pending-badge-wrapper, .cta-secondary, .email-footer { text-align: center; }
  .email-header .logo-placeholder, .email-header .logo-sub { text-align: center; }
  .email-wrapper { max-width: 600px; margin: 0 auto 40px; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); }
  .email-header { padding: 36px 40px; background: ${PRIMARY_COLOR}; text-align: center; }
  .email-header .logo-placeholder { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; mso-line-height-rule: exactly; line-height: 24px; }
  .email-header .logo-sub { font-size: 12px; color: #a1a1aa; font-weight: 400; margin-top: 4px; mso-line-height-rule: exactly; line-height: 16px; }
  .email-body { padding: 32px 40px; }
  .greeting { font-size: 15px; color: #3f3f46; margin-bottom: 16px; line-height: 1.5; }
  .headline { font-size: 20px; font-weight: 600; color: #18181b; margin-bottom: 8px; line-height: 1.3; }
  .subtext { font-size: 14px; color: #71717a; margin-bottom: 28px; line-height: 1.5; }
  .subtext.has-note { margin-bottom: 16px; }
  .author-note { font-size: 14px; color: #3f3f46; background: #fafafa; border-left: 3px solid #e4e4e7; padding: 12px 16px; border-radius: 4px; margin-bottom: 28px; line-height: 1.5; }
  .author-note strong { color: #18181b; }
  .author-note-body { white-space: pre-wrap; }
  .cta-wrapper { text-align: center; margin-bottom: 28px; }
  .cta-button-table { margin: 0 auto; }
  .cta-button-td { background: ${CTA_COLOR}; background-color: ${CTA_COLOR}; border-radius: 8px; }
  .cta-button { display: inline-block; padding: 17px 52px; color: #ffffff !important; text-decoration: none; font-size: 18px; font-weight: 600; letter-spacing: 0.01em; line-height: 1; mso-line-height-rule: exactly; }
  .pending-badge-wrapper { text-align: center; margin-bottom: 28px; }
  .pending-badge { margin: 0 auto; background: #fafafa; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; }
  .pending-badge td { vertical-align: middle; padding: 10px 0; }
  .pending-badge td.count-cell { font-size: 22px; font-weight: 700; color: #18181b; padding-left: 16px; padding-right: 8px; line-height: 1.2; mso-line-height-rule: exactly; }
  .pending-badge td.label-cell { font-size: 13px; color: #71717a; line-height: 1.3; padding-right: 16px; mso-line-height-rule: exactly; }
  .table-label { font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
  .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .summary-table th { text-align: left; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-bottom: 1px solid #e4e4e7; }
  .summary-table td { font-size: 13px; color: #3f3f46; padding: 10px 12px; border-bottom: 1px solid #f4f4f5; vertical-align: middle; }
  .summary-table tr:last-child td { border-bottom: none; }
  .summary-table .post-title { font-weight: 500; color: #18181b; }
  .priority { font-size: 12px; font-weight: 500; white-space: nowrap; }
  .priority-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; position: relative; top: -1px; }
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
    <p class="headline">${headline}</p>
    <p class="subtext${data.authorNote ? ' has-note' : ''}"><strong>${escapeHtml(data.submitterName)}</strong> submitted an item for your review.</p>
    ${data.authorNote ? `<p class="author-note"><strong>A note has been attached:</strong> <span class="author-note-body">${escapeHtml(data.authorNote)}</span></p>` : ''}
    <div class="cta-wrapper">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cta-button-table">
        <tr>
          <td class="cta-button-td" align="center" bgcolor="${CTA_COLOR}">
            <a href="${escapeHtml(data.postUrl)}" class="cta-button">Review Post &rarr;</a>
          </td>
        </tr>
      </table>
    </div>
    <div class="pending-badge-wrapper">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="pending-badge" bgcolor="#fafafa">
        <tr>
          <td class="count-cell">${pendingCount}</td>
          <td class="label-cell">${pendingCount === 1 ? 'item awaiting' : 'items awaiting'}<br>your approval</td>
        </tr>
      </table>
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
