import type { UserRole } from "../auth/types";
import {
  ProjectsIcon,
  SettingsIcon,
  TasksIcon,
  UsersIcon,
} from "../shared/icons";

export type NavItem = {
  label: string;
  to: string;
  end?: boolean;
  /** When set, the item is hidden for every other role. */
  roles?: UserRole[];
  icon: typeof ProjectsIcon;
};

export const navItems: NavItem[] = [
  { label: "Projects", to: "/projects", icon: ProjectsIcon },
  { label: "Tasks", to: "/tasks", icon: TasksIcon },
  { label: "Users", to: "/users", roles: ["ADMIN"], icon: UsersIcon },
  { label: "Settings", to: "/settings", icon: SettingsIcon },
];

export function visibleNavItems(role: UserRole | undefined) {
  return navItems.filter((item) => !item.roles || (role !== undefined && item.roles.includes(role)));
}
