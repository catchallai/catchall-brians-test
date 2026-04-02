import { useMemo, useCallback } from 'react';
import { normalizeHashtag, extractHashtags } from '@/utils/hashtagUtils';
import { appendHashtagToCaption } from '@/utils/appendHashtagToCaption';
import { removeHashtagsFromCaption } from '@/utils/removeHashtagsFromCaption';

/**
 * Shared hook for hashtag pool toggle logic.
 * @param {object} params
 * @param {Array} params.hashtagPool - List of hashtag pools
 * @param {object} params.form - Form state (must include caption, hashtags)
 * @param {Function} params.setForm - Setter for form state
 * @returns {{ activeHashtags: Set<string>, toggledPoolIds: Set<string>, handleTogglePool: Function }}
 */
export function useHashtagPoolToggle({ hashtagPool, form, setForm }) {
  const activeHashtags = useMemo(() => {
    const trackedTags = (Array.isArray(form.hashtags) ? form.hashtags : [])
      .map(normalizeHashtag)
      .filter(Boolean);
    return new Set([...trackedTags, ...extractHashtags(form.caption)]);
  }, [form.caption, form.hashtags]);

  const toggledPoolIds = useMemo(
    () =>
      new Set(
        hashtagPool
          .filter((pool) => {
            const poolTags = (pool.hashtags || '')
              .split(/\s+/)
              .map(normalizeHashtag)
              .filter(Boolean);
            return poolTags.length > 0 && poolTags.every((tag) => activeHashtags.has(tag));
          })
          .map((pool) => pool.id)
      ),
    [activeHashtags, hashtagPool]
  );

  const handleTogglePool = useCallback(
    (pool) => {
      const isToggled = toggledPoolIds.has(pool.id);
      if (isToggled) {
        const poolTags = (pool.hashtags || '')
          .split(/\s+/)
          .filter(Boolean)
          .map(normalizeHashtag)
          .filter(Boolean);
        const remainingPoolIds = new Set([...toggledPoolIds].filter((id) => id !== pool.id));
        const retainedTags = new Set(
          hashtagPool
            .filter((p) => remainingPoolIds.has(p.id))
            .flatMap((p) =>
              (p.hashtags || '').split(/\s+/).filter(Boolean).map(normalizeHashtag).filter(Boolean)
            )
        );
        const tagsToRemove = poolTags.filter((t) => !retainedTags.has(t));
        const tagsToRemoveSet = new Set(tagsToRemove);
        setForm((f) => ({
          ...f,
          caption: tagsToRemove.length
            ? removeHashtagsFromCaption(f.caption, tagsToRemove.join(' '))
            : f.caption,
          hashtags: Array.isArray(f.hashtags)
            ? f.hashtags.filter((h) => !tagsToRemoveSet.has(normalizeHashtag(h)))
            : [],
        }));
      } else {
        const content = pool.hashtags || '';
        if (!content.trim()) {
          return;
        }
        setForm((f) => {
          let caption = f.caption;
          let hashtags = Array.isArray(f.hashtags) ? [...f.hashtags] : [];
          for (const token of content.trim().split(/\s+/)) {
            const result = appendHashtagToCaption(caption, token, hashtags);
            if (result) {
              caption = result.caption;
              hashtags = result.hashtags;
            }
          }
          return { ...f, caption, hashtags };
        });
      }
    },
    [toggledPoolIds, hashtagPool, setForm]
  );

  return { activeHashtags, toggledPoolIds, handleTogglePool };
}
