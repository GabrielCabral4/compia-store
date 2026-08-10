import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_DESCRIPTION, ROLE_LABEL, type Role } from "@/lib/constants";

export default async function NoAccessPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-2xl font-bold text-ink-900">Acesso não permitido</h1>
      <p className="mt-2 text-[14.5px] text-ink-600">
        Seu perfil{" "}
        {user && (
          <strong>{ROLE_LABEL[user.role as Role]}</strong>
        )}{" "}
        não tem permissão para esta área.
      </p>

      {user && (
        <p className="mt-2 text-[13.5px] text-ink-500">
          {ROLE_DESCRIPTION[user.role as Role]}
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/admin" className="btn btn-primary btn-sm">
          Voltar ao painel
        </Link>
        <Link href="/" className="btn btn-outline btn-sm">
          Ir para a loja
        </Link>
      </div>
    </div>
  );
}
