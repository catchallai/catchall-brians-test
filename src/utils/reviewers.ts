import { ReviewerApprovalStatus } from '@/types/reviewers';
import type { ReviewerEntry } from '@/types/reviewers';

interface LegacyPost {
  assigned_to_email?: string | null;
  assigned_to_name?: string | null;
  assigned_date?: string | null;
  reviewers?: ReviewerEntry[] | null;
}

/**
 * Normalizes a post's reviewer data. If the post has a `reviewers` property
 * (even if empty), it is treated as authoritative. Only when `reviewers` is
 * null/undefined does the function fall back to legacy single-reviewer fields.
 */
export function normalizeReviewers(post: LegacyPost | null | undefined): ReviewerEntry[] {
  if (!post) return [];
  if (post.reviewers != null) {
    return post.reviewers;
  }
  if (post.assigned_to_email) {
    return [
      {
        email: post.assigned_to_email,
        name: post.assigned_to_name || post.assigned_to_email,
        ...(post.assigned_date && { assigned_date: post.assigned_date }),
        status: ReviewerApprovalStatus.PENDING,
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
