/**
 * TanStack Query key factories.
 *
 * Keeping keys in one place means cache invalidation calls always use
 * the same shape as the useQuery calls — avoids the silent "nothing
 * invalidated" bug that comes from string typos or key shape drift.
 */

export const collectionKeys = {
  all: ['collections'] as const,
  list: () => [...collectionKeys.all, 'list'] as const,
  detail: (id: string) => [...collectionKeys.all, id] as const,
  members: (id: string) => [...collectionKeys.all, id, 'members'] as const,
};

export const snippetKeys = {
  all: ['snippets'] as const,
  detail: (id: string) => [...snippetKeys.all, id] as const,
  history: (id: string) => [...snippetKeys.all, id, 'history'] as const,
  version: (id: string, versionId: string) =>
    [...snippetKeys.all, id, 'history', versionId] as const,
  comments: (id: string) => [...snippetKeys.all, id, 'comments'] as const,
};

export const searchKeys = {
  results: (q: string, lang?: string, collection?: string) =>
    ['search', q, lang, collection] as const,
};

export const authKeys = {
  me: ['auth', 'me'] as const,
};
