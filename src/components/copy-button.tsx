"use client";

import { useState } from "react";

import { CheckIcon } from "./icons";

export function CopyButton({
  value,
  label = "Copiar código",
  className = "btn btn-outline btn-sm",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // Navegadores sem permissão de área de transferência: o usuário
          // ainda pode selecionar o texto exibido na tela.
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? (
        <>
          <CheckIcon className="size-4" />
          Copiado
        </>
      ) : (
        label
      )}
    </button>
  );
}
