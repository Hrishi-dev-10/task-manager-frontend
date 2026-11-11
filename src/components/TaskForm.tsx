import { useMemo, useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { TASK_STATUSES, type Project, type Task, type TaskInput, type TaskStatus } from "../api/types";
import { FormError, FormField } from "./states";

const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  completed: "Completed",
};

export function validateTaskForm(values: TaskInput, projects: Project[]) {
  const fields: Record<string, string> = {};
  const name = values.name.trim();
  const description = values.description.trim();
  if (!name) fields.name = "Enter a task name.";
  else if (name.length > 120) fields.name = "Use a task name under 120 characters.";
  if (!description) fields.description = "Enter a description.";
  else if (description.length > 1000) fields.description = "Use a description under 1000 characters.";
  if (!values.projectId) fields.projectId = "Choose a project.";
  if (!TASK_STATUSES.includes(values.status)) fields.status = "Choose a status.";
  const project = projects.find((item) => item.id === values.projectId);
  if (values.projectId && !project) fields.projectId = "Choose a project you belong to.";
  if (!values.assigneeId) fields.assigneeId = "Choose someone to assign this task.";
  else if (project && !(project.members ?? []).some((member) => member.id === values.assigneeId)) {
    fields.assigneeId = "Choose a member of this project.";
  }
  return fields;
}

type TaskFormProps = {
  projects: Project[];
  initial: TaskInput;
  editing?: Task | null;
  submitLabel: string;
  onSubmit: (values: TaskInput) => Promise<void>;
  onCancel: () => void;
};

export function TaskForm({ projects, initial, editing, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<TaskStatus>(initial.status);
  const [projectId, setProjectId] = useState(initial.projectId);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const project = projects.find((item) => item.id === projectId);
  const members = useMemo(() => {
    const list = project?.members ?? [];
    if (editing?.assigneeId && editing.assigneeName && !list.some((member) => member.id === editing.assigneeId)) {
      return [
        ...list,
        {
          id: editing.assigneeId,
          name: `${editing.assigneeName} (no longer a member)`,
          email: "",
          role: "member" as const,
          former: true,
        },
      ];
    }
    return list.map((member) => ({ ...member, former: false }));
  }, [project, editing]);

  function changeProject(nextId: string) {
    setProjectId(nextId);
    const next = projects.find((item) => item.id === nextId);
    if (assigneeId && !next?.members.some((member) => member.id === assigneeId)) setAssigneeId("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = sessionStorage.getItem("taskmaster.session");
    const createdBy = session ? ((JSON.parse(session) as { user?: { id?: string } }).user?.id ?? "") : "";
    const values: TaskInput = {
      name,
      description,
      status,
      projectId,
      assigneeId: assigneeId || null,
      createdBy,
    };
    const nextFields = validateTaskForm(values, projects);
    setFields(nextFields);
    setFormError(null);
    if (!createdBy) {
      setFormError("Sign in to create a task.");
      return;
    }
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        status,
        projectId,
        assigneeId: assigneeId || null,
        createdBy,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("The task could not be saved.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField id="task-name" label="Task name" error={fields.name}>
        <div className="input w-full">
          <input
            id="task-name"
            className="grow"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fields.name)}
            aria-describedby={fields.name ? "task-name-error" : undefined}
            required
          />
        </div>
      </FormField>
      <FormField id="task-description" label="Description" error={fields.description}>
        <textarea
          id="task-description"
          className="textarea w-full"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(fields.description)}
          aria-describedby={fields.description ? "task-description-error" : undefined}
        />
      </FormField>
      <FormField id="task-project" label="Project" error={fields.projectId}>
        <select
          id="task-project"
          className="select w-full"
          value={projectId}
          onChange={(event) => changeProject(event.target.value)}
          aria-invalid={Boolean(fields.projectId)}
          aria-describedby={fields.projectId ? "task-project-error" : undefined}
          required
        >
          <option value="">Choose a project</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="task-status" label="Status" error={fields.status}>
        <select
          id="task-status"
          className="select w-full"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
          aria-invalid={Boolean(fields.status)}
          required
        >
          {TASK_STATUSES.map((item) => (
            <option key={item} value={item}>
              {statusLabel[item]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="task-assignee" label="Assigned user" error={fields.assigneeId}>
        <select
          id="task-assignee"
          className="select w-full"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          aria-invalid={Boolean(fields.assigneeId)}
          aria-describedby={fields.assigneeId ? "task-assignee-error" : undefined}
          disabled={!project}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormError message={formError} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
