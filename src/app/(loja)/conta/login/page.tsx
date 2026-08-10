import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage(props: PageProps<"/conta/login">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.next;
  const next = typeof raw === "string" && raw.startsWith("/") ? raw : undefined;

  const user = await getCurrentUser();
  if (user) redirect(next ?? "/conta");

  return (
    <div className="container-page flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Entrar
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            Acesse sua conta para acompanhar pedidos e baixar seus e-books.
          </p>

          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>

        <div className="card mt-4 bg-ink-50 p-4 text-[12.5px] leading-relaxed text-ink-600">
          <p className="font-semibold text-ink-800">
            Acessos de demonstração (senha <code>compia123</code>)
          </p>
          <ul className="mt-2 space-y-0.5">
            <li>
              <code>admin@compia.com.br</code> — administrador
            </li>
            <li>
              <code>editor@compia.com.br</code> — editor (catálogo)
            </li>
            <li>
              <code>vendedor@compia.com.br</code> — vendedor (pedidos)
            </li>
            <li>
              <code>cliente@compia.com.br</code> — cliente
            </li>
          </ul>
        </div>

        <p className="mt-4 text-center text-[13px] text-ink-500">
          <Link href="/produtos" className="hover:text-brand-700">
            Voltar ao catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
