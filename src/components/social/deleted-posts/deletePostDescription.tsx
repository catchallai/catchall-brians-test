import type { ReactNode } from 'react';
import COPY from '@/lib/copy';
import { PostStatus } from '@/types/enums';

type Post = {
  status?: string;
  published_date?: string | null;
  platforms?: string[];
} | null;

const formatPlatformList = (platforms: string[]): string => {
  if (platforms.length === 0) return '';
  if (platforms.length === 1) return platforms[0];
  if (platforms.length === 2) return `${platforms[0]} and ${platforms[1]}`;
  const head = platforms.slice(0, -1).join(', ');
  return `${head}, and ${platforms[platforms.length - 1]}`;
};

export const hasBeenPublished = (post: Post): boolean =>
  post?.status === PostStatus.PUBLISHED || !!post?.published_date;

export const getDeletePostTitle = (post: Post): string => {
  const copy = COPY.deletedPosts.dialogs;
  return hasBeenPublished(post) ? copy.deletePublished.title : copy.deleteDraft.title;
};

export const buildDeletePostDescription = (post: Post): ReactNode => {
  const copy = COPY.deletedPosts.dialogs;
  if (!hasBeenPublished(post)) return copy.deleteDraft.body;

  const platformList = formatPlatformList(post?.platforms || []);
  return (
    <div className="space-y-3">
      <p>{copy.deletePublished.bodyLead}</p>
      {platformList && <p>{copy.deletePublished.bodyUnpublish(platformList)}</p>}
      <p>{copy.deletePublished.bodyRestore}</p>
    </div>
  );
};
