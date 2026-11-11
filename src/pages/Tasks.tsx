import { useCallback, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Project, Task, TaskInput } from "../api/types";
import { useQuery } from "../api/useQuery";
import { useAuth } from "../auth/authContext";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { ErrorState, FormError, LoadingBlock } from "../components/states";
import { formatDateTime } from "../shared/format";
import { StatusBadge } from "../shared/StatusBadge";

const blankTask = (projectId = ""): TaskInput => ({
  name: "",
  description: "",
  status: "pending",
  assigneeId: null,
  projectId,
});

export default function Tasks() {
  const { user } = useAuth();
  const projectsQuery = useQuery(useCallback(() => api.projects(), []), []);
  const tasksQuery = useQuery(useCallback(() => api.tasks(), []), []);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) return null;

  const projects = user.role === "USER"
    ? projectsQuery.data?.filter((project) => (project.members ?? []).some((member) => member.id === user.id))
    : projectsQuery.data;
  const memberProjectIds = new Set((projects ?? []).map((project) => project.id));
  const tasks = user.role === "USER"
    ? tasksQuery.data?.filter((task) => memberProjectIds.has(task.projectId))
    : tasksQuery.data;
  const loading = (!projects && projectsQuery.status === "loading") || (!tasks && tasksQuery.status === "loading");
  const blockingError = (!projects && projectsQuery.error) || (!tasks && tasksQuery.error);
  const refreshError = projects && tasks && (projectsQuery.status === "error" || tasksQuery.status === "error")
    ? projectsQuery.error ?? tasksQuery.error
    : undefined;

  async function saveTask(id: string | null, values: TaskInput) {
    setActionError(null);
    if (id) await api.updateTask(id, values);
    else await api.createTask(values);
    setCreating(false);
    setEditing(null);
    tasksQuery.reload();
    projectsQuery.reload();
  }

  const isMember = user.role === "USER";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-base-content/70">
          {isMember ? "Tasks from the projects you belong to." : "Every task, including projects you are not a member of."}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!projects || projects.length === 0}
          onClick={() => setCreating(true)}
        >
          New task
        </button>
      </div>

      {actionError && <FormError message={actionError} />}
      {refreshError && <FormError message={refreshError} />}
      {loading && <LoadingBlock label="Loading tasks" />}
      {blockingError && (
        <ErrorState
          message={blockingError}
          onRetry={() => {
            projectsQuery.reload();
            tasksQuery.reload();
          }}
        />
      )}

      {projects && tasks && (
        <MemberTaskTable tasks={tasks} projects={projectsQuery.data ?? projects} all={!isMember} onEdit={setEditing} />
      )}

      <Modal open={creating} title="New task" onClose={() => setCreating(false)}>
        {projects && (
          <TaskForm
            projects={projects}
            initial={blankTask(projects[0]?.id ?? "")}
            submitLabel="Create task"
            onCancel={() => setCreating(false)}
            onSubmit={async (values) => {
              try {
                await saveTask(null, values);
              } catch (error) {
                if (error instanceof ApiError) setActionError(error.message);
                throw error;
              }
            }}
          />
        )}
      </Modal>

      <Modal open={editing !== null} title="Edit task" onClose={() => setEditing(null)}>
        {editing && projects && (
          <TaskForm
            key={editing.id}
            projects={projects}
            editing={editing}
            initial={{
              name: editing.name,
              description: editing.description,
              status: editing.status,
              assigneeId: editing.assigneeId,
              projectId: editing.projectId,
            }}
            submitLabel="Save task"
            onCancel={() => setEditing(null)}
            onSubmit={(values) => saveTask(editing.id, values)}
          />
        )}
      </Modal>
    </>
  );
}

function projectLabel(projects: Project[], task: Task) {
  return projects.find((project) => project.id === task.projectId)?.name || task.projectName || "Unknown project";
}

function MemberTaskTable({
  tasks,
  projects,
  all,
  onEdit,
}: {
  tasks: Task[];
  projects: Project[];
  all: boolean;
  onEdit: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <section className="panel px-6 py-10">
        <p className="text-sm text-base-content/60">
          {all ? "No tasks yet." : "No tasks in your projects yet."}
        </p>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-base-300/70 px-5 py-4">
        <h2 className="font-semibold">{all ? "All tasks" : "Your tasks"}</h2>
        <p className="mt-1 text-sm text-base-content/60">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}{" "}
          {all ? "across every project." : "across the projects you belong to."}
        </p>
      </div>
      <ul className="divide-y divide-base-300 md:hidden">
        {tasks.map((task) => (
          <li key={task.id}>
            <button type="button" className="flex w-full flex-col gap-2 px-5 py-4 text-left" onClick={() => onEdit(task)}>
              <span className="font-medium">{task.name}</span>
              <span className="text-sm text-base-content/60">
                {projectLabel(projects, task)}
                {task.assigneeName ? ` · ${task.assigneeName}` : " · Unassigned"}
              </span>
              <StatusBadge status={task.status} />
            </button>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="cursor-pointer hover:bg-base-200/70" onClick={() => onEdit(task)}>
                <td className="font-medium">{task.name}</td>
                <td>{projectLabel(projects, task)}</td>
                <td>{task.assigneeName ?? "Unassigned"}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td className="text-base-content/60">{task.updatedAt ? formatDateTime(task.updatedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
