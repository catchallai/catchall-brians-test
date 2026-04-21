import { ReviewerApprovalStatus } from '@/types/reviewers';
import type { ReviewerEntry } from '@/types/reviewers';

interface LegacyPost {
  assigned_to_email?: string | null;
  assigned_to_name?: string | null;
  assigned_date?: string | null;
  reviewers?: ReviewerEntry[] | null;
}

/**
 * Normalizes a post's reviewer data. If the post has a `reviewers` array,
 * returns it. Otherwise, falls back to the legacy single-reviewer fields
 * and constructs a single-element array.
 */
export function normalizeReviewers(post: LegacyPost | null | undefined): ReviewerEntry[] {
  if (!post) return [];
  if (post.reviewers && post.reviewers.length > 0) {
    return post.reviewers;
  }
  if (post.assigned_to_email) {
    return [
      {
        email: post.assigned_to_email,
        name: post.assigned_to_name || post.assigned_to_email,
        assigned_date: post.assigned_date || new Date().toISOString(),
        status: ReviewerApprovalStatus.PENDING,
        responded_date: null,
      },
    ];
  }
  return [];
}

/** True when every reviewer in the array has approved. */
export function allReviewersApproved(reviewers: ReviewerEntry[]): boolean {
  return (
    reviewers.length > 0 && reviewers.every((r) => r.status === ReviewerApprovalStatus.APPROVED)
  );
}

/** True when any reviewer has rejected or requested changes. */
export function anyReviewerBlockedOrRejected(reviewers: ReviewerEntry[]): boolean {
  return reviewers.some(
    (r) =>
      r.status === ReviewerApprovalStatus.REJECTED ||
      r.status === ReviewerApprovalStatus.CHANGES_REQUESTED
  );
}
