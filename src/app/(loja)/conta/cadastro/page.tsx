import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage(props: PageProps<"/conta/cadastro">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.next;
  const next = typeof raw === "string" && raw.startsWith("/") ? raw : undefined;

  const user = await getCurrentUser();
  if (user) redirect(next ?? "/conta");

  return (
    <div className="container-page flex justify-center py-12 lg:py-16">
      <div className="w-full max-w-xl">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Criar conta
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            Com uma conta você acompanha pedidos, salva endereços e acessa a
            biblioteca de e-books.
          </p>

          <div className="mt-6">
            <RegisterForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
