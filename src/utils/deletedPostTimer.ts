import { DELETED_POST_RECOVERY_DAYS } from '@/constants/deletedPosts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const computePurgeAt = (deletedAt: Date): Date => {
  return new Date(deletedAt.getTime() + DELETED_POST_RECOVERY_DAYS * MS_PER_DAY);
};

export const daysUntilPurge = (purgeAt: string, now: Date = new Date()): number => {
  const purgeMs = new Date(purgeAt).getTime();
  if (Number.isNaN(purgeMs)) return 0;
  const diffMs = purgeMs - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / MS_PER_DAY);
};
