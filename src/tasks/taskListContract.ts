import type { Project, Task, TaskOrderSubmission, TaskStatus } from "../api/types";

/**
 * Contract for the hand-coded task list.
 *
 * Implement the list UI in `src/tasks/TaskList.tsx`. The tasks page loads tasks
 * with `api.tasks()`, which returns them in the backend `displayOrder`.
 *
 * Drag-and-drop is also hand-written. On drop, call `onReorder` — the page
 * wires that to `submitTaskOrder` in `src/tasks/ordering.ts` — and render the
 * tasks that call returns. Do not keep a local array as the saved order.
 */
export type TaskListProps = {
  /** Tasks from the API, sorted by saved displayOrder. */
  tasks: Task[];
  /** Projects the current user is allowed to use. */
  projects: Project[];
  currentUserId: string;
  /** Administrators can delete. Members cannot. */
  canDelete: boolean;
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onReorder: (order: TaskOrderSubmission) => Promise<Task[]>;
};
