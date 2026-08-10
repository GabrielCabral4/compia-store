"use client";

import Link from "next/link";

import { loginAction, registerAction } from "@/actions/auth";
import { useActionForm } from "./use-action-form";

import { SubmitButton } from "./submit-button";
import { Alert, Field } from "./ui";

export function LoginForm({ next }: { next?: string }) {
  const { state, pending, onSubmit, action } = useActionForm(loginAction);

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state && !state.ok && <Alert tone="error">{state.message}</Alert>}

      <Field label="E-mail" name="email">
        <input
          id="email"
          name="email"
          type="email"
          className="field-input"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Senha" name="password">
        <input
          id="password"
          name="password"
          type="password"
          className="field-input"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton pending={pending} className="btn btn-primary w-full" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>

      <p className="text-center text-[13.5px] text-ink-500">
        Ainda não tem conta?{" "}
        <Link
          href={next ? `/conta/cadastro?next=${encodeURIComponent(next)}` : "/conta/cadastro"}
          className="font-medium text-brand-700 hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { state, pending, onSubmit, action } = useActionForm(registerAction);
  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state && !state.ok && <Alert tone="error">{state.message}</Alert>}

      <Field label="Nome completo" name="name" error={errors.name}>
        <input
          id="name"
          name="name"
          className="field-input"
          autoComplete="name"
          required
        />
      </Field>

      <Field label="E-mail" name="email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          className="field-input"
          autoComplete="email"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CPF (opcional)" name="cpf" error={errors.cpf}>
          <input
            id="cpf"
            name="cpf"
            className="field-input"
            inputMode="numeric"
            placeholder="000.000.000-00"
          />
        </Field>
        <Field label="Telefone (opcional)" name="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            className="field-input"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Senha"
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
            required
          />
        </Field>
        <Field
          label="Confirmar senha"
          name="confirmPassword"
          error={errors.confirmPassword}
        >
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="field-input"
            autoComplete="new-password"
            required
          />
        </Field>
      </div>

      <SubmitButton pending={pending} className="btn btn-primary w-full" pendingLabel="Criando conta…">
        Criar minha conta
      </SubmitButton>

      <p className="text-center text-[13.5px] text-ink-500">
        Já tem conta?{" "}
        <Link
          href={next ? `/conta/login?next=${encodeURIComponent(next)}` : "/conta/login"}
          className="font-medium text-brand-700 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
