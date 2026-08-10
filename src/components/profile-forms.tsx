"use client";

import { changePasswordAction, updateProfileAction } from "@/actions/auth";
import { useActionForm } from "./use-action-form";

import { SubmitButton } from "./submit-button";
import { Alert, Field } from "./ui";

type Profile = {
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state, pending, onSubmit, action } = useActionForm(updateProfileAction);
  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <Field label="Nome completo" name="name" error={errors.name}>
        <input
          id="name"
          name="name"
          className="field-input"
          defaultValue={profile.name}
        />
      </Field>

      <Field
        label="E-mail"
        name="email-readonly"
        hint="O e-mail identifica sua conta e não pode ser alterado por aqui."
      >
        <input
          id="email-readonly"
          className="field-input"
          defaultValue={profile.email}
          disabled
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CPF" name="cpf" error={errors.cpf}>
          <input
            id="cpf"
            name="cpf"
            className="field-input"
            inputMode="numeric"
            defaultValue={profile.cpf ?? ""}
          />
        </Field>
        <Field label="Telefone" name="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            className="field-input"
            defaultValue={profile.phone ?? ""}
          />
        </Field>
      </div>

      <SubmitButton pending={pending} className="btn btn-primary" pendingLabel="Salvando…">
        Salvar dados
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const { state, pending, onSubmit, action } = useActionForm(changePasswordAction);
  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <Field label="Senha atual" name="currentPassword" error={errors.currentPassword}>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          className="field-input"
          autoComplete="current-password"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nova senha"
          name="password"
          error={errors.password}
          hint="Mínimo de 8 caracteres."
        >
          <input
            id="password"
            name="password"
            type="password"
            className="field-input"
            autoComplete="new-password"
          />
        </Field>
        <Field
          label="Confirmar nova senha"
          name="confirmPassword"
          error={errors.confirmPassword}
        >
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="field-input"
            autoComplete="new-password"
          />
        </Field>
      </div>

      <SubmitButton pending={pending} className="btn btn-dark" pendingLabel="Alterando…">
        Alterar senha
      </SubmitButton>
    </form>
  );
}
