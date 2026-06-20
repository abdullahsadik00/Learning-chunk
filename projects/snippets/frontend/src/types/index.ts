export type UserRole = 'owner' | 'editor' | 'viewer';

export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'sql'
  | 'bash'
  | 'json'
  | 'markdown'
  | 'plain';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  snippetCount?: number;
}

export interface Snippet {
  id: string;
  collectionId: string;
  title: string;
  content: string;
  language: Language;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetVersion {
  id: string;
  snippetId: string;
  content: string;
  createdBy: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  snippetId: string;
  user: User;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  resolved: boolean;
  createdAt: string;
}

export interface Permission {
  userId: string;
  collectionId: string;
  role: UserRole;
  user?: User;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

// WebSocket message types — discriminated union for type-safe message handling
export type WSMessage =
  | { type: 'presence'; users: { userId: string; name: string }[] }
  | { type: 'crdt_op'; snippetId: string; op: CRDTOp }
  | { type: 'cursor'; userId: string; line: number; column: number }
  | { type: 'join'; snippetId: string }
  | { type: 'leave'; snippetId: string };

export interface CRDTOp {
  /** Lamport clock string — globally unique, causally ordered */
  id: string;
  type: 'insert' | 'delete';
  position: number;
  char?: string;
  userId: string;
}

// ─── Derived / convenience types ─────────────────────────────────────────────

export interface SnippetWithComments extends Snippet {
  comments: Comment[];
}

export interface CollectionWithSnippets extends Collection {
  snippets: Pick<Snippet, 'id' | 'title' | 'language' | 'updatedAt'>[];
  role: UserRole;
}

export interface SearchResult {
  snippet: Pick<Snippet, 'id' | 'title' | 'language' | 'description' | 'updatedAt'>;
  collectionName: string;
  rank: number;
}
