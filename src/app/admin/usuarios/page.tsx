import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL, STAFF_ROLES, type Role } from "@/lib/constants";
import { toggleUserAction } from "@/actions/admin";
import { UserForm } from "@/components/admin/user-form";

export const metadata: Metadata = { title: "Usuários e perfis" };

export default async function AdminUsersPage() {
  const current = await requirePermission("users:write");

  const users = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Usuários e perfis
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Controle de acesso por perfil: administrador, editor e vendedor. Toda
          alteração fica registrada no log de atividades.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="card p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">
                    {user.name}
                    {user.id === current.id && (
                      <span className="ml-2 text-[12px] font-normal text-ink-400">
                        (você)
                      </span>
                    )}
                  </p>
                  <p className="text-[12.5px] text-ink-500">
                    {user.email} · desde {formatDate(user.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      user.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-ink-200 text-ink-600"
                    }`}
                  >
                    {user.active ? "Ativo" : "Desativado"}
                  </span>
                  <span className="badge bg-brand-100 text-brand-800">
                    {ROLE_LABEL[user.role as Role]}
                  </span>

                  {user.id !== current.id && (
                    <form action={toggleUserAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <button type="submit" className="btn btn-outline btn-sm">
                        {user.active ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <UserForm user={user} />
            </div>
          ))}
        </section>

        <aside>
          <section className="card p-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink-900">
              Novo usuário
            </h2>
            <UserForm />
          </section>
        </aside>
      </div>
    </div>
  );
}
