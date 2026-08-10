"use client";

import { saveCategoryAction } from "@/actions/admin";
import { useActionForm } from "../use-action-form";

import { SubmitButton } from "../submit-button";
import { Alert, Field } from "../ui";

type Category = {
  id: string;
  name: string;
  description: string | null;
  position: number;
};

export function CategoryForm({ category }: { category?: Category }) {
  const { state, pending, onSubmit, action } = useActionForm(saveCategoryAction);
  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <Field label="Nome" name={`name-${category?.id ?? "novo"}`} error={errors.name}>
          <input
            id={`name-${category?.id ?? "novo"}`}
            name="name"
            className="field-input"
            defaultValue={category?.name ?? ""}
            required
          />
        </Field>
        <Field label="Ordem" name={`position-${category?.id ?? "novo"}`}>
          <input
            id={`position-${category?.id ?? "novo"}`}
            name="position"
            type="number"
            min={0}
            className="field-input"
            defaultValue={category?.position ?? 0}
          />
        </Field>
      </div>

      <Field
        label="Descrição"
        name={`description-${category?.id ?? "novo"}`}
        hint="Aparece na página inicial e na listagem do catálogo."
      >
        <input
          id={`description-${category?.id ?? "novo"}`}
          name="description"
          className="field-input"
          defaultValue={category?.description ?? ""}
        />
      </Field>

      <SubmitButton
        pending={pending}
        className={category ? "btn btn-outline btn-sm" : "btn btn-primary"}
        pendingLabel="Salvando…"
      >
        {category ? "Salvar" : "Criar categoria"}
      </SubmitButton>
    </form>
  );
}
