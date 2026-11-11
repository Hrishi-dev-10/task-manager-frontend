export type UserRole = "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function roleLabel(role: UserRole) {
  return role === "ADMIN" ? "ADMIN" : "USER";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return `${first}${last}`.toUpperCase();
}

/** Only same-origin app paths. Blocks protocol-relative redirects. */
export function safeInternalPath(path: string | undefined, fallback = "/projects") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\") || path === "/") {
    return fallback;
  }
  return path;
}
