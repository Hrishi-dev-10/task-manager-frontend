import { useCallback } from "react";
import { api } from "../api/client";
import { useQuery } from "../api/useQuery";
import { roleLabel } from "../auth/types";
import { ErrorState, LoadingBlock } from "../components/states";
import { Avatar } from "../shared/Avatar";
import { cx } from "../shared/cx";

export default function Users() {
  const query = useQuery(useCallback(() => api.users(), []), []);
  const people = query.data;

  if (query.status === "loading" && !people) return <LoadingBlock label="Loading users" />;
  if (query.status === "error" && !people) {
    return <ErrorState message={query.error ?? "The directory could not be loaded."} onRetry={query.reload} />;
  }
  if (!people) return null;

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-base-300 px-5 py-4">
        <h2 className="font-semibold">Workspace members</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Administrators can see everyone in the workspace. Other roles do not have this page.
        </p>
      </div>
      {people.length === 0 ? (
        <p className="px-5 py-8 text-sm text-base-content/60">No people in the directory yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-base-300 md:hidden">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-5 py-4">
                <Avatar name={person.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{person.name}</p>
                  <p className="truncate text-sm text-base-content/60">{person.email}</p>
                  <p className="mt-1 text-xs text-base-content/60">
                    {person.title ? `${person.title} · ` : ""}
                    {roleLabel(person.role)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Title</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={person.name} className="size-8 text-[10px]" />
                        <span className="font-medium">{person.name}</span>
                      </div>
                    </td>
                    <td>{person.email}</td>
                    <td>{person.title}</td>
                    <td>
                      <span className={cx("badge badge-sm", person.role === "ADMIN" ? "badge-primary" : "badge-ghost")}>
                        {roleLabel(person.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
