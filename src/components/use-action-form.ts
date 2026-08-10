"use client";

import { startTransition, useActionState } from "react";
import type { FormEvent } from "react";

import type { ActionState } from "@/lib/action-state";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Liga um formulário a uma Server Action preservando o que o usuário digitou.
 *
 * Quando o `action` do formulário é uma função, o React limpa os campos assim
 * que a ação termina — o que apagaria, por exemplo, os dados do cartão logo
 * após uma recusa. Aqui a submissão é despachada manualmente dentro de uma
 * transição, de modo que os valores permanecem na tela para correção.
 *
 * O atributo `action` continua definido para que o formulário também funcione
 * com JavaScript desabilitado.
 */
export function useActionForm(action: Action) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(
    action,
    null
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit, action: dispatch };
}
