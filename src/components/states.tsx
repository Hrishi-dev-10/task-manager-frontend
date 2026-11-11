import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-error">
      {message}
    </p>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label={label}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="panel h-28 animate-pulse bg-base-100" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="panel px-6 py-8">
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-base-content/70">{message}</p>
      <button type="button" className="btn btn-primary btn-sm mt-4" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel border-dashed px-6 py-12 text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-base-content/70">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
