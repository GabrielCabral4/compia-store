import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { STAFF_ROLES, ROLE_LABEL, type Role } from "@/lib/constants";

const LINKS = [
  { href: "/conta", label: "Visão geral" },
  { href: "/conta/pedidos", label: "Meus pedidos" },
  { href: "/conta/biblioteca", label: "Minha biblioteca" },
  { href: "/conta/enderecos", label: "Endereços" },
  { href: "/conta/dados", label: "Dados e senha" },
];

export default async function AccountLayout({ children }: LayoutProps<"/conta">) {
  const user = await getCurrentUser();

  // As telas de login e cadastro usam este mesmo segmento, mas não exigem
  // sessão; nesse caso o conteúdo é renderizado sem a navegação lateral.
  if (!user) return <>{children}</>;

  const isStaff = STAFF_ROLES.includes(user.role as Role);

  return (
    <div className="container-page py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <div className="card p-4">
            <p className="text-[13px] text-ink-500">Conectado como</p>
            <p className="mt-0.5 truncate font-semibold text-ink-900">
              {user.name}
            </p>
            <p className="truncate text-[12.5px] text-ink-500">{user.email}</p>
            <span className="badge mt-2 bg-brand-100 text-brand-800">
              {ROLE_LABEL[user.role as Role]}
            </span>
          </div>

          <nav className="card mt-4 p-2">
            <ul>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-[14px] text-ink-700 hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isStaff && (
                <li>
                  <Link
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-[14px] font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Painel administrativo
                  </Link>
                </li>
              )}
            </ul>
            <form action={logoutAction} className="mt-1 border-t border-ink-100 pt-1">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-ink-500 hover:bg-ink-100"
              >
                Sair
              </button>
            </form>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
