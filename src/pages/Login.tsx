import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../auth/demo";
import { roleLabel, safeInternalPath } from "../auth/types";
import { apiErrorMessage, useLoginMutation } from "../store/api";
import Trademark from "../shared/Trademark";

const weekly = [
  { day: "Mon", value: 40 },
  { day: "Tue", value: 65 },
  { day: "Wed", value: 50 },
  { day: "Thu", value: 80 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 75 },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-box bg-primary text-lg font-bold text-primary-content">
        OG
      </span>
      <span className="text-xl font-semibold">THE OG TASK MANAGEMENT</span>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Log in · Task Master";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await login({ email, password }).unwrap();
      const from = safeInternalPath((location.state as { from?: string } | null)?.from);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not log in."));
    }
  }

  return (
    <div className="grid min-h-screen bg-base-100 lg:grid-cols-2">
      {/* Left: brand panel (desktop only) */}
      <aside className="hidden flex-col justify-between gap-10 bg-primary p-12 text-primary-content lg:flex">
        <Trademark />

        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Everything your team is working on, in one place.
          </h2>
          <p className="mt-4 text-lg text-primary-content/80">
            Check progress, see what changed today and pick up where you left off.
          </p>
        </div>

        <div className="w-full max-w-md rounded-box bg-base-100 p-6 text-base-content shadow-xl">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Tasks completed</p>
            <p className="text-sm text-base-content/60">This week</p>
          </div>
          <p className="mt-1 text-4xl font-bold">128</p>
          <div className="mt-5 flex h-28 items-end gap-2">
            {weekly.map(({ day, value }) => (
              <div
                key={day}
                className="flex-1 rounded-t-md bg-primary"
                style={{ height: `${value}%`, opacity: day === "Sat" ? 1 : 0.35 }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2 text-xs text-base-content/60">
            {weekly.map(({ day }) => (
              <span key={day} className="flex-1 text-center">
                {day}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-3xl font-bold">Log in</h1>
          <p className="mt-2 text-base-content/70">
            Welcome back. Enter your details to continue.
          </p>


          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <div className="input w-full">
                <svg
                  className="size-4 opacity-60"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  className="grow"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <a href="/forgotpassword" className="link link-hover text-sm">
                  Forgot password?
                </a>
              </div>
              <div className="input w-full">
                <svg
                  className="size-4 opacity-60"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  className="grow"
                  placeholder="Your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="checkbox checkbox-sm" />
              Keep me logged in
            </label>

            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm">
            New here?{" "}
            <a href="/signup" className="link link-primary">
              Create an account
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}