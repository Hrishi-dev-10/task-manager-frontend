import type { TaskListProps } from "./taskListContract";

export function TaskList({ tasks, canDelete }: TaskListProps) {
  return (
    <section
      className="panel border-dashed px-6 py-10"
      aria-label="Task list integration point"
    >
      <h2 className="text-lg font-semibold">Task list</h2>
      <p className="mt-2 max-w-2xl text-sm text-base-content/70">
        The task list is connected here and is implemented by hand in{" "}
        <span className="font-medium">src/tasks/TaskList.tsx</span>. The API returned{" "}
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"} in the saved order.
        {canDelete
          ? " Delete is available for this role."
          : " Delete is reserved for administrators."}
      </p>
    </section>
  );
}
