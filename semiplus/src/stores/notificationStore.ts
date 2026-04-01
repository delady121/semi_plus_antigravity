import { create } from 'zustand'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  setNotifications: (notifications) => set({ notifications }),

  markAsRead: (id) => set(state => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    )
  })),

  markAllAsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true }))
  })),

  unreadCount: () => get().notifications.filter(n => !n.is_read).length,
}))
