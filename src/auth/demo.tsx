import type { AuthUser, UserRole } from "./types";

// Dummy credentials for the demo login. Replace with a real API call later.
export const DEMO_PASSWORD = "12345";

export const DEMO_ACCOUNTS: Array<AuthUser & { password: string }> = [
  {
    id: "user-alex",
    name: "Alex Morgan",
    email: "demo@example.com",
    role: "ADMIN" satisfies UserRole,
    password: DEMO_PASSWORD,
  },
  {
    id: "user-jordan",
    name: "Jordan Lee",
    email: "member@example.com",
    role: "USER" satisfies UserRole,
    password: DEMO_PASSWORD,
  },
];

export const DEMO_EMAIL = DEMO_ACCOUNTS[0].email;
