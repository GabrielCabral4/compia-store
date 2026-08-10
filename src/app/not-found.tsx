import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-brand-600">
        Erro 404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-ink-500">
        O endereço acessado não existe ou o título saiu do catálogo.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Ir para a página inicial
        </Link>
        <Link href="/produtos" className="btn btn-outline">
          Ver o catálogo
        </Link>
      </div>
    </div>
  );
}
