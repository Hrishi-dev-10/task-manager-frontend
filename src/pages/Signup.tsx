import { useState, type FormEvent, type ReactNode } from "react";
import Trademark from "../shared/Trademark";
import { useRegisterMutation } from "../store/api";
import { useLocation, useNavigate } from "react-router";
import { safeInternalPath } from "../auth/types";

// UI only: no state, no auth, no router. Uses daisyUI theme colours, so it follows your theme.

const perks = [
  "Invite your team and assign work",
  "Track tasks and deadlines in one view",
  "See weekly progress at a glance",
];

function Svg({ children, className = "size-4 opacity-60" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-box bg-primary text-lg font-bold text-primary-content">
        M
      </span>
      <span className="text-xl font-semibold">My App</span>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  icon: ReactNode;
  hint?: string;
};


function Field({ id, label,name, type, placeholder, autoComplete, icon, hint }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="input w-full">
        {icon}
        <input
          id={id}
          type={type}
          className="grow"
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-base-content/60">{hint}</p>}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name")?.toString() ?? "";
      const email = formData.get("email")?.toString() ?? "";
      const password = formData.get("password")?.toString() ?? "";
      const confirmPassword = formData.get("confirm-password")?.toString() ?? "";
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      await register({ name, email, password }).unwrap();
      const from = safeInternalPath((location.state as { from?: string } | null)?.from);
      navigate(from, { replace: true });
    } catch (err) {
      setError("An error occurred while signing up.");
    }
  }

  return (
    <div className="grid min-h-screen bg-base-100 lg:grid-cols-2">
      {/* Left: brand panel (desktop only) */}
      <aside className="hidden flex-col justify-between gap-10 bg-primary p-12 text-primary-content lg:flex">
        <Trademark />

        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Bring your team’s work together in one place.
          </h2>
          <p className="mt-4 text-lg text-primary-content/80">
            Signing up takes about a minute. You can invite your team afterwards.
          </p>
        </div>

        <div className="w-full max-w-md rounded-box bg-base-100 p-6 text-base-content shadow-xl">
          <p className="text-sm font-medium">Included with your account</p>
          <ul className="mt-4 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-content">
                  <Svg className="size-3">
                    <path d="M20 6 9 17l-5-5" />
                  </Svg>
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-base-content/70">
            Fill in your details to get started.
          </p>

          <form className="mt-8 space-y-5" onSubmit={submitForm}>
            <Field
              id="name"
              label="Full name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              icon={
                <Svg>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </Svg>
              }
            />
            <Field
              id="email"
              label="Email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              icon={
                <Svg>
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </Svg>
              }
            />
            <Field
              id="password"
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              autoComplete="new-password"
              hint="Use at least 8 characters."
              icon={
                <Svg>
                  <rect width="18" height="11" x="3" y="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </Svg>
              }
            />
            <Field
              id="confirm-password"
              label="Confirm password"
              type="password"
              name="confirm-password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              icon={
                <Svg>
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </Svg>
              }
            />

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" className="checkbox checkbox-sm mt-0.5" required />
              <span>
                I agree to the{" "}
                <a href="/terms" className="link link-primary">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="link link-primary">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <button type="submit" className="btn btn-primary w-full">
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm">
            Already have an account?{" "}
            <a href="/login" className="link link-primary">
              Log in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}