# PR #71 Review Resolution

PR: `https://github.com/catchallai/catchallai/pull/71`

## Addressed Suggestions

1. `src/utils/postMedia.ts`
   Preserved explicit empty `image_urls` arrays so clearing the last image does not fall back to stale `image_url` data.

2. `src/utils/postMedia.ts`
   Enforced image/video exclusivity in `normalizePostMedia` by clearing image fields whenever a video is present before save.

3. `src/components/social/PostGallery.jsx`
   Cached `getPrimaryPostImageUrl(post)` in a local variable to avoid recomputing it during render.

4. `src/components/modals/CalendarPostModal.jsx`
   Fixed drag-and-drop video handling to select the actual dropped video file and reject drops containing multiple videos.

5. `src/components/modals/CalendarPostModal.jsx`
   Replaced brittle label-based media-menu disable logic with explicit `mediaKind` metadata per item.

6. `base44/functions/postToLinkedIn/entry.ts`
   Removed service-role reads for `CalendarPost` lookup and now use user-scoped access, returning `404` when the post is not accessible.

7. `base44/functions/postToLinkedIn/entry.ts`
   Added a dedicated `MediaValidationError` path so invalid mixed-media payloads return `422` instead of `500`.

8. `base44/functions/autoPostToSocial/entry.ts`
   Made backend media normalization deterministic for legacy mixed-media records by preferring video and clearing image fields instead of throwing.

## Notes

- The two `postToLinkedIn` comments are both addressed, but with slightly different resolutions:
  user authorization is enforced on `postId` lookup, and mixed-media validation now returns `422`.
- `autoPostToSocial` now tolerates inconsistent historical data better than the frontend helper because it normalizes records before posting instead of aborting the whole publish flow.
