/** Retorno padrão das Server Actions consumidas por `useActionState`. */
export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Dados extras devolvidos pela ação (ex.: número do pedido criado). */
  data?: Record<string, unknown>;
} | null;

export function fail(
  message: string,
  errors?: Record<string, string>
): ActionState {
  return { ok: false, message, errors };
}

export function succeed(
  message?: string,
  data?: Record<string, unknown>
): ActionState {
  return { ok: true, message, data };
}

/** Converte exceções em mensagem amigável, preservando os erros esperados. */
export function toActionState(error: unknown): ActionState {
  const message =
    error instanceof Error ? error.message : "Não foi possível concluir a operação.";
  return { ok: false, message };
}
