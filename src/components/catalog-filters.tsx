"use client";

import Link from "next/link";
import { useRef } from "react";

/**
 * Formulário de filtros do catálogo. Funciona sem JavaScript (envio normal via
 * GET) e, com JavaScript, aplica os filtros assim que o usuário muda uma opção.
 */
export function CatalogFilters({
  children,
}: {
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action="/produtos"
      method="get"
      className="space-y-6"
      onChange={(event) => {
        const target = event.target as HTMLElement;
        // Campos de texto só aplicam ao enviar; selects e caixas, na hora.
        if (target instanceof HTMLInputElement && target.type === "text") return;
        formRef.current?.requestSubmit();
      }}
    >
      {children}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-dark btn-sm flex-1">
          Aplicar filtros
        </button>
        <Link href="/produtos" className="btn btn-outline btn-sm">
          Limpar
        </Link>
      </div>
    </form>
  );
}
