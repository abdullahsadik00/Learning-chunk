import { create } from 'zustand';
import type { Message, Conversation, User } from '@/types';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId: string;
  typingUsers: Record<string, Record<string, boolean>>;

  setActiveConversation: (id: string) => void;
  addMessage: (convId: string, message: Message) => void;
  updateMessageStatus: (msgId: string, status: Message['status']) => void;
  setTyping: (convId: string, userId: string, isTyping: boolean) => void;
}

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Chen',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/40?u=alice',
    role: 'user',
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/40?u=bob',
    role: 'user',
  },
  {
    id: 'u3',
    name: 'Carol White',
    email: 'carol@example.com',
    avatar: 'https://i.pravatar.cc/40?u=carol',
    role: 'user',
  },
];

function makeMsg(
  id: string,
  convId: string,
  authorId: string,
  content: string,
  minsAgo: number
): Message {
  return {
    id,
    conversationId: convId,
    authorId,
    content,
    timestamp: new Date(Date.now() - minsAgo * 60_000).toISOString(),
    status: 'read',
  };
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    messages: [
      makeMsg('m1', 'conv-1', 'u1', 'Hey! Did you see the new design specs?', 30),
      makeMsg('m2', 'conv-1', 'me', 'Yeah, looks great! Love the new color palette', 28),
      makeMsg('m3', 'conv-1', 'u1', 'The client approved it this morning 🎉', 25),
      makeMsg('m4', 'conv-1', 'me', 'Perfect timing. When do we start implementing?', 20),
      makeMsg('m5', 'conv-1', 'u1', "Sprint starts Monday. I'll set up the Figma handoff", 15),
    ],
    unreadCount: 0,
  },
  {
    id: 'conv-2',
    participants: [MOCK_USERS[1], MOCK_USERS[2]],
    messages: [
      makeMsg('m6', 'conv-2', 'u2', 'Can you review my PR when you get a chance?', 120),
      makeMsg('m7', 'conv-2', 'me', 'On it! Give me 20 mins', 118),
      makeMsg('m8', 'conv-2', 'u2', 'No rush, thanks!', 115),
    ],
    unreadCount: 2,
  },
  {
    id: 'conv-3',
    participants: [MOCK_USERS[2]],
    messages: [
      makeMsg('m9', 'conv-3', 'u3', 'Are we still on for the team lunch tomorrow?', 60),
    ],
    unreadCount: 1,
  },
];

export const useChatStore = create<ChatStore>()((set) => ({
  conversations: INITIAL_CONVERSATIONS,
  activeConversationId: 'conv-1',
  currentUserId: 'me',
  typingUsers: {},

  setActiveConversation: (id) =>
    set((s) => ({
      activeConversationId: id,
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ),
    })),

  addMessage: (convId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, message], lastMessage: message }
          : c
      ),
    })),

  updateMessageStatus: (msgId, status) =>
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === msgId ? { ...m, status } : m
        ),
      })),
    })),

  setTyping: (convId, userId, isTyping) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [convId]: { ...(s.typingUsers[convId] ?? {}), [userId]: isTyping },
      },
    })),
}));
