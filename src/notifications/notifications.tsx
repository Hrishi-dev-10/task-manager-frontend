import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type IncomingNotification = {
  title: string;
  message: string;
  createdAt?: string;
};

type NotificationSocket = {
  on(event: "notification", handler: (payload: IncomingNotification) => void): void;
  off(event: "notification", handler: (payload: IncomingNotification) => void): void;
};

type NotificationState = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationState | null>(null);

const sampleNotifications: AppNotification[] = [
  {
    id: "sample-assignment",
    title: "Task assigned",
    message: "You were assigned “Fix push notification permission”.",
    createdAt: "2026-11-09T08:15:00",
    read: false,
  },
  {
    id: "sample-review",
    title: "Review requested",
    message: "Jordan Lee asked you to review the navigation prototypes.",
    createdAt: "2026-11-09T07:40:00",
    read: true,
  },
];

const queued: IncomingNotification[] = [];
const liveListeners = new Set<() => void>();
let pushImpl: ((notification: IncomingNotification) => void) | null = null;

/** Runs when a live notification arrives, so the header can refresh its list. */
export function onLiveNotification(listener: () => void) {
  liveListeners.add(listener);
  return () => {
    liveListeners.delete(listener);
  };
}

function isIncoming(value: IncomingNotification | null | undefined): value is IncomingNotification {
  return Boolean(value && typeof value.title === "string" && typeof value.message === "string");
}

/**
 * Socket.IO integration point.
 * Forward live events into the inbox without coupling the UI to a socket client:
 *
 *   socket.on("notification", notificationBridge.push)
 *
 * Events that arrive before the provider mounts are queued and flushed on mount.
 */
export const notificationBridge = {
  push(notification: IncomingNotification) {
    if (!isIncoming(notification)) return;
    if (pushImpl) pushImpl(notification);
    else queued.push(notification);
    liveListeners.forEach((listener) => listener());
  },
};

/** Subscribe a Socket.IO client (or any compatible emitter) to the inbox. */
export function bindNotificationSocket(socket: NotificationSocket) {
  const handler = (payload: IncomingNotification) => notificationBridge.push(payload);
  socket.on("notification", handler);
  return () => socket.off("notification", handler);
}

function toNotification(notification: IncomingNotification): AppNotification {
  return {
    id: crypto.randomUUID(),
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    read: false,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications);

  const push = useCallback((notification: IncomingNotification) => {
    if (!isIncoming(notification)) return;
    setNotifications((current) => [toNotification(notification), ...current]);
  }, []);

  useEffect(() => {
    pushImpl = push;
    const pending = queued.splice(0);
    pending.forEach(push);
    return () => {
      if (pushImpl === push) pushImpl = null;
    };
  }, [push]);

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const value = useMemo<NotificationState>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markRead,
      markAllRead,
    }),
    [notifications, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return context;
}
