import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { postKeys } from '@/lib/queryKeys';
import { MOCK_POSTS } from './mockData';
import type { Post } from '@/types';

const PAGE_SIZE = 10;

async function fetchFeed(cursor?: string): Promise<{ posts: Post[]; nextCursor?: string }> {
  await new Promise(r => setTimeout(r, 400));
  const start = cursor ? MOCK_POSTS.findIndex(p => p.id === cursor) + 1 : 0;
  const posts = MOCK_POSTS.slice(start, start + PAGE_SIZE);
  const nextCursor =
    start + PAGE_SIZE < MOCK_POSTS.length ? posts[posts.length - 1]?.id : undefined;
  return { posts, nextCursor };
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: postKeys.feed('me'),
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    getNextPageParam: last => last.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}

type FeedData = {
  pages: { posts: Post[]; nextCursor?: string }[];
  pageParams: (string | undefined)[];
};

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      await new Promise(r => setTimeout(r, 300));
      if (Math.random() < 0.05) throw new Error('Network error');
      return { postId, liked };
    },
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: postKeys.feed('me') });
      const snapshot = qc.getQueryData<FeedData>(postKeys.feed('me'));
      qc.setQueryData<FeedData>(postKeys.feed('me'), old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(p =>
              p.id === postId
                ? { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 }
                : p,
            ),
          })),
        };
      });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(postKeys.feed('me'), ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: postKeys.feed('me') }),
  });
}
