type User = { id?: string; email?: string } | null | undefined;
type Post = { id?: string; deleted_at?: string | null };

export const canAccessDeletedPost = (user: User, _post: Post): boolean => {
  if (!user?.email) return false;
  // Phase 1: any authenticated same-account user can see/restore/permanently
  // delete any post in the Deleted tab. Role-based rules will slot in here.
  return true;
};
