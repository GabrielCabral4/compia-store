"use client";

import { saveUserAction } from "@/actions/admin";
import { useActionForm } from "../use-action-form";
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL, type Role } from "@/lib/constants";

import { SubmitButton } from "../submit-button";
import { Alert, Field } from "../ui";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function UserForm({ user }: { user?: StaffUser }) {
  const { state, pending, onSubmit, action } = useActionForm(saveUserAction);
  const errors = state?.errors ?? {};
  const suffix = user?.id ?? "novo";

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {user && <input type="hidden" name="id" value={user.id} />}
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name={`name-${suffix}`} error={errors.name}>
          <input
            id={`name-${suffix}`}
            name="name"
            className="field-input"
            defaultValue={user?.name ?? ""}
            required
          />
        </Field>
        <Field label="E-mail" name={`email-${suffix}`} error={errors.email}>
          <input
            id={`email-${suffix}`}
            name="email"
            type="email"
            className="field-input"
            defaultValue={user?.email ?? ""}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Perfil de acesso" name={`role-${suffix}`} error={errors.role}>
          <select
            id={`role-${suffix}`}
            name="role"
            className="field-input"
            defaultValue={user?.role ?? "VENDEDOR"}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role as Role]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={user ? "Nova senha (opcional)" : "Senha"}
          name={`password-${suffix}`}
          error={errors.password}
          hint="Mínimo de 8 caracteres."
        >
          <input
            id={`password-${suffix}`}
            name="password"
            type="password"
            className="field-input"
            autoComplete="new-password"
          />
        </Field>
      </div>

      <ul className="space-y-1 rounded-lg bg-ink-50 p-3 text-[12.5px] text-ink-600">
        {ROLES.map((role) => (
          <li key={role}>
            <strong className="text-ink-800">{ROLE_LABEL[role as Role]}:</strong>{" "}
            {ROLE_DESCRIPTION[role as Role]}
          </li>
        ))}
      </ul>

      <SubmitButton
        pending={pending}
        className={user ? "btn btn-outline btn-sm" : "btn btn-primary"}
        pendingLabel="Salvando…"
      >
        {user ? "Salvar" : "Criar usuário"}
      </SubmitButton>
    </form>
  );
}
