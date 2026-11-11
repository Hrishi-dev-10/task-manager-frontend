import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { api, ApiError } from "../api/client";
import type { Task, TaskInput, TaskStatus } from "../api/types";
import { useQuery } from "../api/useQuery";
import { useAuth } from "../auth/authContext";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { ErrorState, FormError, LoadingBlock } from "../components/states";
import { useSetPageMeta } from "../layouts/pageMeta";
import { Avatar } from "../shared/Avatar";
import { formatDisplayDate } from "../shared/format";
import { TaskBoard } from "../tasks/TaskBoard";

const blankTask = (projectId: string): TaskInput => ({
  name: "",
  description: "",
  status: "in_progress",
  assigneeId: null,
  projectId,
});

export default function ProjectDetail() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const projectQuery = useQuery(useCallback(() => api.project(projectId), [projectId]), [projectId]);
  const tasksQuery = useQuery(useCallback(() => api.tasks(projectId), [projectId]), [projectId]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);

  const project = projectQuery.data;
  const tasks = tasksQuery.data;
  const boardTasks = optimisticTasks ?? tasks;

  useEffect(() => {
    setOptimisticTasks(null);
  }, [tasks]);
  const pageMeta = useMemo(
    () =>
      project
        ? {
            title: project.name,
            breadcrumb: [
              { label: "Projects", to: "/projects" },
              { label: project.name },
            ],
          }
        : null,
    [project],
  );
  useSetPageMeta(pageMeta);

  if (!user) return null;

  const loading = (!project && projectQuery.status === "loading") || (!tasks && tasksQuery.status === "loading");
  const blockingError = (!project && projectQuery.error) || (!tasks && tasksQuery.error);

  async function saveTask(id: string | null, values: TaskInput) {
    setActionError(null);
    if (id) await api.updateTask(id, values);
    else await api.createTask(values);
    setCreating(false);
    setEditing(null);
    tasksQuery.reload();
    projectQuery.reload();
  }

  const onStatusChange = async (task: Task, status: TaskStatus) => {
    if (!tasks) return;
    setActionError(null);
    setOptimisticTasks((current) =>
      (current ?? tasks).map((item) => (item.id === task.id ? { ...item, status } : item)),
    );
    try {
      await api.updateTask(task.id, { status });
      tasksQuery.reload();
    } catch (error) {
      setOptimisticTasks(null);
      setActionError(error instanceof ApiError ? error.message : "The status could not be changed.");
    }
  };

  return (
    <>
      {loading && <LoadingBlock label="Loading project" />}
      {blockingError && (
        <ErrorState
          message={blockingError}
          onRetry={() => {
            projectQuery.reload();
            tasksQuery.reload();
          }}
        />
      )}

      {project && boardTasks && (
        <>
          <section className="panel p-6">
            <p className="text-sm text-base-content/70">{project.description}</p>
            <p className="mt-4 text-xs font-medium tracking-wide text-base-content/50 uppercase">Members</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(project.members ?? []).map((member) => (
                <li key={member.id} className="flex items-center gap-2 rounded-full bg-base-200 py-1 pr-3 pl-1 text-sm">
                  <Avatar name={member.name} className="size-6 text-[10px]" />
                  {member.name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-base-content/60">
              {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"} · Created {formatDisplayDate(project.createdAt)}
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
              New task
            </button>
          </div>
          <p className="text-sm text-base-content/60">Drag a task into another column to change its state.</p>
          {actionError && <FormError message={actionError} />}
          <TaskBoard tasks={boardTasks} onEdit={setEditing} onStatusChange={onStatusChange} />
        </>
      )}

      <Modal open={creating && project !== undefined} title="New task" onClose={() => setCreating(false)}>
        {project && (
          <TaskForm
            projects={[project]}
            initial={blankTask(project.id)}
            submitLabel="Create task"
            onCancel={() => setCreating(false)}
            onSubmit={(values) => saveTask(null, values)}
          />
        )}
      </Modal>

      <Modal open={editing !== null} title="Edit task" onClose={() => setEditing(null)}>
        {editing && project && (
          <TaskForm
            key={editing.id}
            projects={[project]}
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
