import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { ProjectInput, ProjectUpdate, WorkspaceUser } from "../api/types";
import { useAuth } from "../auth/authContext";
import { FormError, FormField } from "./states";

export type ProjectFormValues = {
  name: string;
  description: string;
  memberIds: string[];
};

type ProjectFormProps = {
  mode: "create" | "edit";
  initial: ProjectFormValues;
  users: WorkspaceUser[];
  submitLabel: string;
  onSubmit: (values: ProjectInput | ProjectUpdate) => Promise<void>;
  onCancel: () => void;
};

export function validateProjectForm(values: ProjectFormValues, mode: "create" | "edit") {
  const fields: Record<string, string> = {};
  const name = values.name.trim();
  const description = values.description.trim();
  if (!name) fields.name = "Enter a project name.";
  else if (name.length > 80) fields.name = "Use a project name under 80 characters.";
  if (!description) fields.description = "Enter a description.";
  else if (description.length > 500) fields.description = "Use a description under 500 characters.";
  if (mode === "create" && values.memberIds.length === 0) fields.memberIds = "Choose at least one member.";
  return fields;
}

export function ProjectForm({ mode, initial, users, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [memberIds, setMemberIds] = useState(initial.memberIds);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleMember(id: string) {
    setMemberIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { name, description, memberIds };
    const nextFields = validateProjectForm(values, mode);
    setFields(nextFields);
    setFormError(null);
    if (Object.keys(nextFields).length > 0) return;
    if (mode === "create" && !user) {
      setFormError("Sign in to create a project.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create" && user) {
        await onSubmit({
          name: name.trim(),
          description: description.trim(),
          createdBy: user.id,
          projectMembers: memberIds.map((userId) => ({ userId })),
        });
      } else {
        await onSubmit({ name: name.trim(), description: description.trim() });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("The project could not be saved.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField id="project-name" label="Project name" error={fields.name}>
        <div className="input w-full">
          <input
            id="project-name"
            className="grow"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fields.name)}
            aria-describedby={fields.name ? "project-name-error" : undefined}
            required
          />
        </div>
      </FormField>
      <FormField id="project-description" label="Description" error={fields.description}>
        <textarea
          id="project-description"
          className="textarea w-full"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(fields.description)}
          aria-describedby={fields.description ? "project-description-error" : undefined}
          required
        />
      </FormField>
      {mode === "create" && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Members</legend>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-box border border-base-300 p-3">
            {users.map((user) => (
              <label key={user.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={memberIds.includes(user.id)}
                  onChange={() => toggleMember(user.id)}
                />
                <span>
                  {user.name} <span className="text-base-content/60">({user.email})</span>
                </span>
              </label>
            ))}
          </div>
          {fields.memberIds && (
            <p id="project-members-error" role="alert" className="mt-1.5 text-xs text-error">
              {fields.memberIds}
            </p>
          )}
        </fieldset>
      )}
      <FormError message={Object.keys(fields).length === 0 ? formError : null} />
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
