import { useRef, useState } from "react";
import { BOARD_STATUSES, type BoardStatus, type Task, type TaskStatus } from "../api/types";
import { StatusBadge, statusTone } from "../shared/StatusBadge";
import { cx } from "../shared/cx";

const columnTitle: Record<BoardStatus, string> = {
  in_progress: "In Progress",
  blocked: "Blocked",
  in_review: "In Review",
  completed: "Completed",
};

/** Pending work sits in In Progress until it is moved to another state. */
export function boardColumn(status: TaskStatus): BoardStatus {
  if (status === "pending") return "in_progress";
  return status;
}

type TaskBoardProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
};

export function TaskBoard({ tasks, onEdit, onStatusChange }: TaskBoardProps) {
  const [over, setOver] = useState<BoardStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragged = useRef(false);

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {BOARD_STATUSES.map((status) => {
        const items = tasks
          .filter((task) => boardColumn(task.status) === status)
          .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt));
        return (
          <section
            key={status}
            aria-label={columnTitle[status]}
            className={cx(
              "panel flex min-h-80 w-72 shrink-0 flex-col xl:w-auto xl:min-w-56 xl:flex-1",
              over === status && "ring-2 ring-primary/30",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver(status);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setOver((current) => (current === status ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(null);
              const id = event.dataTransfer.getData("text/task-id");
              const task = tasks.find((item) => item.id === id);
              setDraggingId(null);
              if (!task || task.status === status) return;
              void onStatusChange(task, status);
            }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-base-300/70 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <span className={cx("size-2 rounded-full", statusTone[status].dot)} aria-hidden="true" />
                {columnTitle[status]}
              </h3>
              <span className="text-xs font-medium text-base-content/50 tabular-nums">{items.length}</span>
            </header>
            <ul className="flex flex-1 flex-col gap-2 p-3">
              {items.length === 0 && (
                <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-base-300 px-3 py-8 text-center text-sm text-base-content/50">
                  Drop a task here
                </li>
              )}
              {items.map((task) => (
                <li key={task.id}>
                  <article
                    draggable
                    aria-grabbed={draggingId === task.id}
                    onDragStart={(event) => {
                      dragged.current = true;
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => {
                      if (dragged.current) {
                        dragged.current = false;
                        return;
                      }
                      onEdit(task);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onEdit(task);
                      }
                    }}
                    tabIndex={0}
                    className={cx(
                      "cursor-grab rounded-xl border border-base-300/80 bg-base-100 px-3 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-primary",
                      draggingId === task.id && "opacity-50",
                    )}
                  >
                    <p className="font-medium text-base-content">{task.name}</p>
                    <p className="mt-1 text-xs text-base-content/60">{task.assigneeName ?? "Unassigned"}</p>
                    {task.status === "pending" && (
                      <div className="mt-2">
                        <StatusBadge status="pending" />
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
