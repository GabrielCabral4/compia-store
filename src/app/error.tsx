"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erro na página]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-red-600">
        Ops
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
        Algo deu errado
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-ink-500">
        Não foi possível carregar esta página. Tente novamente — se o problema
        continuar, avise a equipe da editora.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[12px] text-ink-400">
          código {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Tentar novamente
        </button>
        <Link href="/" className="btn btn-outline">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
