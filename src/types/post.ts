/**
 * Central type definitions for the social-media post entity.
 *
 * What this file exports:
 *   - `SocialMediaPost` — the read shape of a post as returned by the
 *     Base44 SDK (`base44.entities.CalendarPost.get/list/filter`).
 *
 * Why it exists:
 *   The Base44 SDK declares `EntityHandler<T = any>`, so without a
 *   shared type every call site that touches a post falls back to
 *   `any` (or `(post as any)` casts). That spreads a large number of
 *   silent type holes across the app. Centralizing the shape here gives
 *   pages, modals, and utilities a single source of truth and lets
 *   readers see at a glance every field a post can carry.
 *
 * How to keep it accurate:
 *   The field set mirrors `base44/entities/CalendarPost.jsonc` (the
 *   server-side schema), augmented with:
 *     - Standard Base44 entity metadata (id, created_date, updated_date)
 *       which the schema file does not list.
 *     - A few fields written only by backend functions (e.g.
 *       `published_date`, `publish_results` from autoPostToSocial)
 *       that are persisted but absent from the .jsonc.
 *     - `image_urls` which exists in frontend form data but not the
 *       server schema (multi-image convenience field).
 *   When you add or rename a server-side field, update this file in
 *   the same change.
 *
 * Note on naming: the Base44 entity is `CalendarPost` (do not rename
 * — that name is the SDK accessor `base44.entities.CalendarPost`).
 * The TypeScript type is `SocialMediaPost` because that name describes
 * what the data actually represents.
 */

import type { TransformOp } from '@/components/modals/ImageCropPanel';
import type { ReviewerEntry } from '@/types/reviewers';
import type { PostStatus } from '@/types/enums';

type CropBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type WorkflowEntry = {
  action: string;
  by_email?: string;
  by_name?: string;
  timestamp?: string;
  note?: string;
  text?: string;
  reply_to_name?: string;
  reply_to_id?: string;
  /** Set on the `submitted_for_approval` event that incremented `post.version`. */
  version?: number;
  /** Loose tail to accept ad-hoc fields used by individual action types. */
  [key: string]: unknown;
};

// Verions tracking
export type VersionedHistoryEntry = {
  timestamp?: string;
  version?: number;
  [key: string]: unknown;
};

export type SocialMediaPost = {
  // Base44 entity metadata
  id?: string;
  created_date?: string;
  updated_date?: string;

  // Content
  title?: string;
  caption?: string;
  image_url?: string;
  /** Multi-image variant — frontend-only convenience; not in the server schema. */
  image_urls?: string[];
  video_url?: string;
  media_type?: 'none' | 'image' | 'video';
  hashtags?: string[];
  tag_ids?: string[];

  // Per-platform media
  platforms?: string[];
  platform_image_urls?: Record<string, string>;
  platform_crop_metadata?: Record<
    string,
    { cropBox: CropBox | null; transformOps: TransformOp[]; tilt: number }
  >;

  // Scheduling
  scheduled_date?: string;
  scheduled_time?: string;
  timezone?: string;
  order?: number;
  auto_post?: boolean;

  // Recurrence
  is_recurring?: boolean;
  recurrence_type?: string;
  recurrence_end_date?: string;
  recurrence_days?: number[];
  parent_post_id?: string;

  // Lifecycle / status
  status?: PostStatus;
  /** Increments on each transition into `pending_approval`. 0 means the post has never left draft. */
  version?: number;

  // Approval workflow
  reviewers?: ReviewerEntry[] | null;
  assigned_to_email?: string | null;
  assigned_to_name?: string | null;
  assigned_date?: string;
  priority?: string;
  review_due_date?: string | null;
  approved_by?: string;
  approved_by_name?: string;
  approved_date?: string;
  rejected_reason?: string;

  // History / audit
  workflow_history?: WorkflowEntry[];

  // Publishing (set by autoPostToSocial backend function)
  published_date?: string | null;
  publish_results?: unknown;

  // Soft delete
  deleted_at?: string | null;
  deleted_by?: string | null;
  deleted_by_name?: string | null;
  purge_at?: string | null;

  // Provenance / linking
  brand_id?: string;
  campaign_brief_id?: string;
  approved_copy_id?: string;
  approved_template_id?: string;
};
