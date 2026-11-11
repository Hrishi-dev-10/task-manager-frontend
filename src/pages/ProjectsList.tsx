import { useCallback, useState } from "react";
import { Link } from "react-router";
import { api, ApiError } from "../api/client";
import type { Project, WorkspaceUser } from "../api/types";
import { useQuery } from "../api/useQuery";
import { useAuth } from "../auth/authContext";
import { Modal } from "../components/Modal";
import { ProjectForm } from "../components/ProjectForm";
import { EmptyState, ErrorState, FormError, LoadingBlock } from "../components/states";
import { Avatar } from "../shared/Avatar";
import { formatDisplayDate } from "../shared/format";

export default function ProjectsList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const projectsQuery = useQuery(useCallback(() => api.projects(), []), []);
  const usersQuery = useQuery(
    useCallback(() => (isAdmin ? api.users() : Promise.resolve([] as WorkspaceUser[])), [isAdmin]),
    [isAdmin],
  );
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [membersOf, setMembersOf] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [memberId, setMemberId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  if (!user) return null;
  const projects = user.role === "USER"
    ? projectsQuery.data?.filter((project) => (project.members ?? []).some((member) => member.id === user.id))
    : projectsQuery.data;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-base-content/70">
          {isAdmin ? "Every project in the workspace." : "Projects you belong to."}
        </p>
        {isAdmin && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            New project
          </button>
        )}
      </div>

      {projectsQuery.status === "error" && projects && projectsQuery.error && <FormError message={projectsQuery.error} />}
      {actionError && !membersOf && !deleting && <FormError message={actionError} />}
      {projectsQuery.status === "loading" && !projects && <LoadingBlock label="Loading projects" />}
      {projectsQuery.status === "error" && !projects && (
        <ErrorState message={projectsQuery.error ?? "Projects could not be loaded."} onRetry={projectsQuery.reload} />
      )}
      {projects && projects.length === 0 && (
        <EmptyState
          title="No projects"
          detail={
            isAdmin
              ? "Create a project and add the people who will work on it."
              : "You are not a member of a project yet."
          }
          action={
            isAdmin ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                New project
              </button>
            ) : undefined
          }
        />
      )}
      {projects && projects.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="panel flex flex-col transition-shadow hover:shadow-[0_10px_28px_rgb(15_23_42/0.07)]">
              <Link
                to={`/projects/${project.id}`}
                className="flex flex-1 flex-col rounded-box p-5 outline-none focus-visible:outline-2 focus-visible:outline-primary"
              >
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="mt-2 text-sm text-base-content/70">{project.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-medium tracking-wide text-base-content/50 uppercase">Members</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <li key={member.id} className="flex items-center gap-2 rounded-full bg-base-200 py-1 pr-3 pl-1 text-sm">
                        <Avatar name={member.name} className="size-6 text-[10px]" />
                        {member.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-sm text-base-content/60">
                  {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"} · Created {formatDisplayDate(project.createdAt)}
                </p>
              </Link>
              {isAdmin && (
                <div className="flex flex-wrap gap-2 px-5 pb-5">
                  <button type="button" className="btn btn-sm" onClick={() => setEditing(project)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => { setMembersOf(project); setMemberId(""); setActionError(null); }}>
                    Members
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost text-error" onClick={() => { setActionError(null); setDeleting(project); }}>
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <Modal open={creating} title="New project" onClose={() => setCreating(false)}>
        {usersQuery.status === "loading" && !usersQuery.data ? (
          <p className="text-sm text-base-content/70">Loading people…</p>
        ) : usersQuery.status === "error" ? (
          <ErrorState message={usersQuery.error ?? "People could not be loaded."} onRetry={usersQuery.reload} />
        ) : (
          <ProjectForm
            mode="create"
            initial={{ name: "", description: "", memberIds: [user.id] }}
            users={usersQuery.data ?? []}
            submitLabel="Create project"
            onCancel={() => setCreating(false)}
            onSubmit={async (values) => {
              if (!("projectMembers" in values)) return;
              await api.createProject(values);
              setCreating(false);
              projectsQuery.reload();
            }}
          />
        )}
      </Modal>

      <Modal open={editing !== null} title="Edit project" onClose={() => setEditing(null)}>
        {editing && (
          <ProjectForm
            key={editing.id}
            mode="edit"
            initial={{ name: editing.name, description: editing.description, memberIds: editing.members.map((member) => member.id) }}
            users={[]}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await api.updateProject(editing.id, { name: values.name, description: values.description });
              setEditing(null);
              projectsQuery.reload();
            }}
          />
        )}
      </Modal>

      <Modal open={membersOf !== null} title={membersOf ? `${membersOf.name} members` : "Members"} onClose={() => setMembersOf(null)}>
        {membersOf && (
          <div className="space-y-4">
            <ul className="divide-y divide-base-300 rounded-box border border-base-300">
              {membersOf.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-base-content/60">{member.email}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-error"
                    disabled={working || membersOf.members.length === 1}
                    onClick={() => {
                      setWorking(true);
                      setActionError(null);
                      void api
                        .removeProjectMember(membersOf.id, member.id)
                        .then((updated) => {
                          setMembersOf(updated);
                          projectsQuery.reload();
                        })
                        .catch((error: unknown) => {
                          setActionError(error instanceof ApiError ? error.message : "That member could not be removed.");
                        })
                        .finally(() => setWorking(false));
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (!memberId) {
                  setActionError("Choose a person to add.");
                  return;
                }
                setWorking(true);
                setActionError(null);
                void api
                  .addProjectMember(membersOf.id, memberId)
                  .then((updated) => {
                    setMembersOf(updated);
                    setMemberId("");
                    projectsQuery.reload();
                  })
                  .catch((error: unknown) => {
                    setActionError(error instanceof ApiError ? error.message : "That person could not be added.");
                  })
                  .finally(() => setWorking(false));
              }}
            >
              <select
                className="select w-full"
                value={memberId}
                aria-label="Person to add"
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">Add a person</option>
                {(usersQuery.data ?? [])
                  .filter((candidate) => !membersOf.members.some((member) => member.id === candidate.id))
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
              </select>
              <button type="submit" className="btn btn-primary" disabled={working}>
                Add
              </button>
            </form>
            <FormError message={actionError} />
          </div>
        )}
      </Modal>

      <Modal open={deleting !== null} title="Delete project" onClose={() => setDeleting(null)}>
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-base-content/70">
              Delete {deleting.name}? Its tasks will be removed as well.
            </p>
            <FormError message={actionError} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)} disabled={working}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={working}
                onClick={() => {
                  setWorking(true);
                  setActionError(null);
                  void api
                    .deleteProject(deleting.id)
                    .then(() => {
                      setDeleting(null);
                      projectsQuery.reload();
                    })
                    .catch((error: unknown) => {
                      setActionError(error instanceof ApiError ? error.message : "The project could not be deleted.");
                    })
                    .finally(() => setWorking(false));
                }}
              >
                {working ? "Deleting…" : "Delete project"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
