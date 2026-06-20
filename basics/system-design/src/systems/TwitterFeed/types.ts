import type { Post } from '@/types';

export interface FeedFilters {
  tab: 'for-you' | 'following';
}

export interface FeedPage {
  posts: Post[];
  nextCursor?: string;
}
