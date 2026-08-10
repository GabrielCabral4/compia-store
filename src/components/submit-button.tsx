"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  /**
   * Estado de envio informado pelo formulário. Necessário quando a submissão é
   * despachada manualmente (ver `useActionForm`), pois nesse caso o
   * `useFormStatus` não acompanha a ação.
   */
  pending?: boolean;
};

/** Botão de envio que mostra estado de carregamento durante a Server Action. */
export function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  className = "btn btn-primary",
  disabled,
  name,
  value,
  pending,
}: Props) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={busy || disabled}
      aria-busy={busy}
    >
      {busy ? pendingLabel : children}
    </button>
  );
}
