import { useMemo, useCallback } from 'react';
import { normalizeHashtag, extractHashtags } from '@/utils/hashtagUtils';
import { appendHashtagToCaption } from '@/utils/appendHashtagToCaption';
import { removeHashtagsFromCaption } from '@/utils/removeHashtagsFromCaption';

function getPoolTags(pool) {
  const content = [pool?.hashtags, pool?.hashtag].filter(Boolean).join(' ');
  return content.split(/\s+/).map(normalizeHashtag).filter(Boolean);
}

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
    const trackedHashtags = Array.isArray(form.hashtags) ? form.hashtags : [];
    return new Set([...trackedHashtags, ...extractHashtags(form.caption)].map(normalizeHashtag));
  }, [form.caption, form.hashtags]);

  const toggledPoolIds = useMemo(
    () =>
      new Set(
        hashtagPool
          .filter((pool) => {
            const poolTags = getPoolTags(pool);
            return poolTags.length > 0 && poolTags.every((tag) => activeHashtags.has(tag));
          })
          .map((pool) => pool.id)
      ),
    [activeHashtags, hashtagPool]
  );

  const handleTogglePool = useCallback(
    (pool) => {
      const isToggled = toggledPoolIds.has(pool.id);
      const poolTags = getPoolTags(pool);

      if (isToggled) {
        const remainingPoolIds = new Set([...toggledPoolIds].filter((id) => id !== pool.id));
        const retainedTags = new Set(
          hashtagPool.filter((p) => remainingPoolIds.has(p.id)).flatMap((p) => getPoolTags(p))
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
        if (poolTags.length === 0) {
          return;
        }
        setForm((f) => {
          let caption = f.caption;
          let hashtags = Array.isArray(f.hashtags) ? [...f.hashtags] : [];
          for (const token of poolTags) {
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
