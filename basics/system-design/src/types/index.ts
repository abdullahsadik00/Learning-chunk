import React from 'react';

// User / Auth
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

// Posts / Feed
export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  media?: string[];
  likes: number;
  retweets: number;
  replies: number;
  liked: boolean;
  retweeted: boolean;
  timestamp: string;
}

// Products / E-commerce
export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  stock: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  stock: number;
  category: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  content: string;
  createdAt: string;
  helpful: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  name: string;
}

// Notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  read: boolean;
  createdAt: string;
}

// Analytics / Dashboard
export interface Metric {
  label: string;
  value: number;
  delta: number;
  unit?: string;
  trend: 'up' | 'down' | 'flat';
  history: number[];
}

export interface TableRow {
  id: string;
  [key: string]: unknown;
}

export interface Column<T extends TableRow> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

// Chat
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  reactions?: Record<string, string[]>;
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
}

// WebSocket
export interface WSMessage<T = unknown> {
  type: string;
  payload: T;
}

// Pagination
export interface Page<T> {
  data: T[];
  nextCursor?: string;
  total: number;
}

// CRDT
export interface CRDTOperation {
  id: string;
  type: 'insert' | 'delete' | 'format';
  position: number;
  char?: string;
  authorId: string;
  timestamp: number;
  deleted?: boolean;
}
