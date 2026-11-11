import { roleLabel } from "../auth/types";
import { useAuth } from "../auth/authContext";
import { UserUpdateForm } from "../components/UserUpdateForm";
import { Avatar } from "../shared/Avatar";
import { profileUpdated } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";
import { Modal } from "../components/Modal";
import { useState } from "react";

export default function Settings() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  if (!user) return null;
  const [editing,setEditing] = useState(false);

  return (
    <>
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="panel p-6" onClick={()=>setEditing(true)}>
        <h2 className="font-semibold">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={user.name} className="size-14 text-base" />
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-base-content/70">{user.email}</p>
            <p className="mt-1 text-sm text-base-content/60">{roleLabel(user.role)}</p>
          </div>
        </div>
        <div className="mt-6">
          {/* <UserUpdateForm
            userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            onSaved={(values) => dispatch(profileUpdated(values))}
          /> */}
        </div>
      </article>

      <article className="panel p-6">
        <h2 className="font-semibold">Workspace</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-base-content/60">Name</dt>
            <dd className="mt-1 font-medium">Task Master</dd>
          </div>
          <div>
            <dt className="text-base-content/60">Your access</dt>
            <dd className="mt-1 font-medium">
              {user.role === "ADMIN"
                ? "Admin. You can open Projects, Tasks, Users, and Settings."
                : "Member. Users is reserved for administrators."}
            </dd>
          </div>
        </dl>
      </article>
    </section>
    <Modal 
    open={editing}
    title="Edit User"
    onClose={() => setEditing(false)}
    >
      <UserUpdateForm
        userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            onSaved={(values) => dispatch(profileUpdated(values))}
      >

      </UserUpdateForm>
    </Modal>
    </>
  );
}
