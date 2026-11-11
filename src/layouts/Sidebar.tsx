import { NavLink } from "react-router";
import { useAuth } from "../auth/authContext";
import { cx } from "../shared/cx";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, LogoutIcon } from "../shared/icons";
import { visibleNavItems } from "./navigation";

const COLLAPSED_KEY = "taskmaster.sidebar-collapsed";

export function readSidebarCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode). The toggle still works for this visit.
  }
}

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  /** True when the drawer is off-canvas, so it leaves the tab order. */
  drawerClosed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
};

export function Sidebar({
  collapsed,
  mobileOpen,
  drawerClosed,
  onClose,
  onToggleCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const items = visibleNavItems(user?.role);

  return (
    <aside
      id="app-sidebar"
      aria-label="Sidebar"
      aria-hidden={drawerClosed || undefined}
      inert={drawerClosed ? true : undefined}
      className={cx(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 flex-col border-r border-base-300/80 bg-base-100 shadow-lg",
        "transition-[transform,width] duration-200 ease-out motion-reduce:transition-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none",
        collapsed ? "lg:w-[4.75rem]" : "lg:w-64",
      )}
    >
      <div className={cx("flex h-16 items-center gap-2 border-b border-base-300", collapsed ? "px-3 lg:px-2" : "px-4")}>
        <NavLink
          to="/projects"
          end
          aria-label="Task Master"
          onClick={onClose}
          className={cx(
            "flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            collapsed && "lg:justify-center",
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-content">
            TM
          </span>
          <span className={cx("truncate text-base font-semibold tracking-tight", collapsed && "lg:hidden")}>
            Task Master
          </span>
        </NavLink>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      collapsed && "lg:justify-center lg:px-2.5",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content",
                    )
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  <span className={cx("truncate", collapsed && "lg:sr-only")}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-base-300 p-3">
        <button
          type="button"
          className={cx(
            "hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-base-content/75 hover:bg-base-200 hover:text-base-content lg:flex",
            "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            collapsed && "lg:justify-center lg:px-2.5",
          )}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <ChevronRightIcon className="size-5 shrink-0" /> : <ChevronLeftIcon className="size-5 shrink-0" />}
          <span className={cx("truncate", collapsed && "lg:sr-only")}>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
        <button
          type="button"
          className={cx(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-base-content/75 hover:bg-error/10 hover:text-error",
            "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            collapsed && "lg:justify-center lg:px-2.5",
          )}
          title={collapsed ? "Log out" : undefined}
          onClick={() => {
            onClose();
            logout();
          }}
        >
          <LogoutIcon className="size-5 shrink-0" />
          <span className={cx("truncate", collapsed && "lg:sr-only")}>Log out</span>
        </button>
      </div>
    </aside>
  );
}
