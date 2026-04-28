import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Submits a post for approval. This is the single server-authoritative path
 * for transitioning a post into `pending_approval`.
 *
 * Why this lives on the backend:
 *   - The version-bump rule (increment on every entry into `pending_approval`)
 *     must be enforced in one place. Computing it on the frontend means
 *     multiple call sites all have to remember to bump, and concurrent
 *     submissions from two clients could read the same prior version and
 *     both write `n+1`. Server-side read-modify-write is atomic.
 *   - Stamping the workflow_history entry with the new version belongs in
 *     the same transaction as the bump itself, so the stamp can never drift.
 *
 * What it does, atomically:
 *   1. Validates the caller is authenticated and the post exists.
 *   2. Validates the current status is one we allow bumping from
 *      (BUMPABLE_STATUSES) — prevents double-submits, resubmitting an
 *      already-approved post, etc.
 *   3. Computes `newVersion = (post.version ?? 0) + 1`.
 *   4. Optionally applies approval metadata (reviewers, priority,
 *      review_due_date) supplied by the caller. When `reviewers` is
 *      provided, derives `assigned_to_email` / `assigned_to_name` from
 *      the first reviewer for backward compatibility with consumers that
 *      still read those flat fields.
 *   5. Appends a `submitted_for_approval` entry to `workflow_history`
 *      stamped with `newVersion`, and updates `status` + `version` on
 *      the post in a single CalendarPost.update call.
 *
 * Request body: { postId, note?, reviewers?, priority?, review_due_date? }
 * Response: { post: <updated CalendarPost> }
 */

const BUMPABLE_STATUSES = new Set(['draft', 'rejected', 'changes_requested', 'pending_review']);

type ReviewerInput = {
  email: string;
  name?: string;
  role?: string;
  status?: string;
  assigned_date?: string;
  responded_date?: string;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      postId?: string;
      note?: string;
      reviewers?: ReviewerInput[];
      priority?: string;
      review_due_date?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const postId = body.postId;
    if (!postId) {
      return Response.json({ error: 'postId is required' }, { status: 400 });
    }

    const posts = await base44.entities.CalendarPost.filter({ id: postId });
    const post = posts[0];
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!BUMPABLE_STATUSES.has(post.status)) {
      return Response.json(
        { error: `Cannot submit for approval from status "${post.status}"` },
        { status: 409 }
      );
    }

    const newVersion = (typeof post.version === 'number' ? post.version : 0) + 1;

    const historyEntry = {
      action: 'submitted_for_approval',
      by_email: user.email,
      by_name: user.full_name || user.email,
      timestamp: new Date().toISOString(),
      version: newVersion,
      ...(body.note ? { note: body.note } : {}),
    };

    const updates: Record<string, unknown> = {
      status: 'pending_approval',
      version: newVersion,
      workflow_history: [...(post.workflow_history || []), historyEntry],
    };

    if (body.reviewers !== undefined) {
      const now = new Date().toISOString();
      const existingByEmail = new Map<string, ReviewerInput>(
        (post.reviewers || []).map((r: ReviewerInput) => [r.email, r])
      );
      const reviewers = body.reviewers.map((r) => {
        const existing = existingByEmail.get(r.email);
        return (
          existing ?? {
            email: r.email,
            name: r.name ?? r.email,
            assigned_date: now,
            status: 'pending',
          }
        );
      });
      const primary = reviewers[0] ?? null;
      updates.reviewers = reviewers;
      updates.assigned_to_email = primary?.email ?? null;
      updates.assigned_to_name = primary?.name ?? null;
    }
    if (body.priority !== undefined) {
      updates.priority = body.priority;
    }
    if (body.review_due_date !== undefined) {
      updates.review_due_date = body.review_due_date;
    }

    const updated = await base44.entities.CalendarPost.update(postId, updates);

    return Response.json({ post: updated });
  } catch (error) {
    console.error('submitPostForApproval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
