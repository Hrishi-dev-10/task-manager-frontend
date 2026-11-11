import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { FormError, FormField } from "./states";

type UserUpdateFormProps = {
  userId: string;
  initialName: string;
  initialEmail: string;
  onSaved?: (values: { name: string; email: string }) => void;
};

function validate(name: string, email: string) {
  const fields: Record<string, string> = {};
  if (!name) fields.name = "Enter a name.";
  else if (name.length > 150) fields.name = "Use a name under 150 characters.";
  if (!email) fields.email = "Enter an email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter a valid email.";
  return fields;
}

export function UserUpdateForm({ userId, initialName, initialEmail, onSaved }: UserUpdateFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextFields = validate(nextName, nextEmail);
    setFields(nextFields);
    setFormError(null);
    setSaved(false);
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await api.updateUser(userId, { name: nextName, email: nextEmail });
      onSaved?.({ name: nextName, email: nextEmail });
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("The user could not be updated.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField id="user-name" label="Name" error={fields.name}>
        <div className="input w-full">
          <input
            id="user-name"
            name="name"
            className="grow"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fields.name)}
            aria-describedby={fields.name ? "user-name-error" : undefined}
            required
          />
        </div>
      </FormField>
      <FormField id="user-email" label="Email" error={fields.email}>
        <div className="input w-full">
          <input
            id="user-email"
            name="email"
            type="email"
            className="grow"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fields.email)}
            aria-describedby={fields.email ? "user-email-error" : undefined}
            required
          />
        </div>
      </FormField>
      <FormError message={Object.keys(fields).length === 0 ? formError : null} />
      {saved && <p className="text-sm text-success">Profile updated.</p>}
      <div className="flex justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
