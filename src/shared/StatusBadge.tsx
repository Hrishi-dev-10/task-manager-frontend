import type { TaskStatus } from "../api/types";
import { cx } from "./cx";

const labels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  completed: "Completed",
};

export const statusTone: Record<TaskStatus, { dot: string; chip: string; bar: string }> = {
  pending: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-950 ring-amber-200",
    bar: "bg-amber-500",
  },
  in_progress: {
    dot: "bg-sky-600",
    chip: "bg-sky-50 text-sky-950 ring-sky-200",
    bar: "bg-sky-600",
  },
  blocked: {
    dot: "bg-rose-600",
    chip: "bg-rose-50 text-rose-950 ring-rose-200",
    bar: "bg-rose-600",
  },
  in_review: {
    dot: "bg-violet-600",
    chip: "bg-violet-50 text-violet-950 ring-violet-200",
    bar: "bg-violet-600",
  },
  completed: {
    dot: "bg-emerald-600",
    chip: "bg-emerald-50 text-emerald-950 ring-emerald-200",
    bar: "bg-emerald-600",
  },
};

export function statusLabel(status: TaskStatus) {
  return labels[status];
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const tone = statusTone[status];
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone.chip)}>
      <span className={cx("size-1.5 rounded-full", tone.dot)} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
