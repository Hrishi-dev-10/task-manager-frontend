import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { roleLabel } from "../auth/types";
import { useAuth } from "../auth/authContext";
import { Avatar } from "../shared/Avatar";
import { formatDateTime } from "../shared/format";
import { BellIcon, ChevronRightIcon, MenuIcon } from "../shared/icons";
import { onLiveNotification } from "../notifications/notifications";
import { usePageMeta } from "./pageMeta";
import { useQuery } from "../api/useQuery";
import { api } from "../api/client";

const SEEN_KEY = "taskmaster.notifications.seen";

type HeaderNotification = {
  id: number | string;
  title?: string;
  message?: string;
  createdAt?: string;
};

function readSeen(userId: string) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, string>;
    return parsed[userId] ?? null;
  } catch {
    return null;
  }
}

function writeSeen(userId: string, id: string) {
  const current = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, string>;
    } catch {
      return {};
    }
  })();
  current[userId] = id;
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(current));
}

function isNewer(id: number | string, seen: string | null) {
  if (seen == null) return true;
  const next = Number(id);
  const previous = Number(seen);
  if (Number.isFinite(next) && Number.isFinite(previous)) return next > previous;
  return String(id) !== seen;
}

function latestNotificationId(items: HeaderNotification[]) {
  return items.reduce<string | null>((latest, item) => {
    if (latest == null || isNewer(item.id, latest)) return String(item.id);
    return latest;
  }, null);
}

function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const dataQuery = useQuery(
    useCallback(() => (userId ? api.getNotifications(userId) : Promise.resolve([])), [userId]),
    [userId],
  );
  const data = (dataQuery.data ?? []) as HeaderNotification[];
  const latestId = latestNotificationId(data);
  const [seenId, setSeenId] = useState<string | null>(() => (userId ? readSeen(userId) : null));

  useEffect(() => {
    setSeenId(userId ? readSeen(userId) : null);
  }, [userId]);

  useEffect(() => onLiveNotification(() => dataQuery.reload()), [dataQuery.reload]);

  const hasNew = latestId != null && isNewer(latestId, seenId);

  function openBell() {
    if (!userId || latestId == null) return;
    writeSeen(userId, latestId);
    setSeenId(latestId);
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-circle btn-ghost relative"
        aria-label={hasNew ? "Notifications, new" : "Notifications"}
        aria-haspopup="dialog"
        onClick={openBell}
      >
        <BellIcon className="size-5" />
        {hasNew && (
          <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-error" aria-hidden="true" />
        )}
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-box border border-base-300 bg-base-100 shadow-lg"
      >
        <div className="border-b border-base-300 px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        {data.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-base-content/60">You're all caught up.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {data.map((notification) => (
              <li key={notification.id} className="border-b border-base-300 px-4 py-3 last:border-b-0">
                {notification.title ? (
                  <span className="block text-sm font-medium">{notification.title}</span>
                ) : null}
                <span className={notification.title ? "mt-0.5 block text-xs text-base-content/70" : "block text-sm"}>
                  {notification.message}
                </span>
                {notification.createdAt ? (
                  <span className="mt-1 block text-xs text-base-content/50">
                    {formatDateTime(notification.createdAt)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UserChip() {
  const { user } = useAuth();
  if (!user) return null;
  const role = roleLabel(user.role);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={user.name} />
      <div className="min-w-0 leading-tight">
        <p className="max-w-28 truncate text-sm font-medium sm:max-w-40">{user.name}</p>
        <p className="text-xs text-base-content/60">{role}</p>
      </div>
    </div>
  );
}

export function AppHeader({
  navigationOpen,
  onOpenNavigation,
}: {
  navigationOpen: boolean;
  onOpenNavigation: () => void;
}) {
  const { title, breadcrumb } = usePageMeta();

  useEffect(() => {
    document.title = `${title} · Task Master`;
  }, [title]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-base-300/80 bg-base-100/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square lg:hidden"
        aria-label="Open navigation"
        aria-expanded={navigationOpen}
        aria-controls="app-sidebar"
        onClick={onOpenNavigation}
      >
        <MenuIcon className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        {breadcrumb.length > 1 && (
          <nav aria-label="Breadcrumb" className="mt-0.5">
            <ol className="flex min-w-0 items-center gap-1 text-xs text-base-content/60">
              {breadcrumb.map((crumb, index) => {
                const last = index === breadcrumb.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                    {index > 0 && <ChevronRightIcon className="size-3 shrink-0 opacity-60" />}
                    {crumb.to && !last ? (
                      <Link to={crumb.to} className="truncate hover:text-base-content">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-base-content/80" aria-current={last ? "page" : undefined}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <NotificationBell />
        <UserChip />
      </div>
    </header>
  );
}
