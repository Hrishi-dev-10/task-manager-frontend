import { initials } from "../auth/types";
import { cx } from "./cx";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cx(
        "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-content",
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
