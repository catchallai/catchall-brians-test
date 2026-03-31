export interface HashtagPool {
  id: string;
  /** Pool display name (no # prefix) */
  hashtag: string;
  /** Space-separated hashtag string, e.g. "#tag1 #tag2" */
  hashtags?: string | null;
  /** Pipe-separated categories, e.g. "Brand | Campaign" */
  category?: string | null;
  is_favorite: boolean;
  usage_count?: number;
}
