import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification } from '@/types';

interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markAllRead: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools((set) => ({
    theme: 'dark',
    sidebarOpen: true,
    notifications: [],
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    addNotification: (n) =>
      set((s) => ({
        notifications: [
          { ...n, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() },
          ...s.notifications,
        ],
      })),
    removeNotification: (id) =>
      set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
      })),
    markAllRead: () =>
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      })),
  }))
);
