import { VersionedHistoryEntry } from '@/types/post';

/**
 * Returns the post version that was current at a given moment in time.
 *
 * Only the `submitted_for_approval` event in `workflow_history` carries a
 * `version` stamp (the version it bumped to). To display the right version
 * next to an arbitrary entry — a comment, an approval, a "viewed" marker —
 * we walk the history and find the latest version stamp at-or-before that
 * entry's timestamp.
 *
 * Returns 0 when no version bump has happened yet (e.g. a comment made
 * while the post was still in its initial draft, or a pre-existing post
 * that has not been re-submitted since version tracking was introduced).
 *
 * @param history The post's full `workflow_history` array.
 * @param timestamp ISO timestamp of the entry whose effective version you want.
 */
export function versionAt(
  history: VersionedHistoryEntry[] | undefined | null,
  timestamp: string | undefined
): number {
  if (!history?.length || !timestamp) return 0;
  const cutoff = new Date(timestamp).getTime();
  if (Number.isNaN(cutoff)) return 0;
  let v = 0;
  for (const entry of history) {
    if (typeof entry.version !== 'number' || !entry.timestamp) continue;
    const entryTime = new Date(entry.timestamp).getTime();
    if (Number.isNaN(entryTime) || entryTime > cutoff) continue;
    if (entry.version > v) v = entry.version;
  }
  return v;
}
