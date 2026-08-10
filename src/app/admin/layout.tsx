import Link from "next/link";

import { can, requirePermission, type Permission } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import {
  BoxIcon,
  ChartIcon,
  ListIcon,
  MailIcon,
  SettingsIcon,
  ShieldIcon,
  StoreIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

type AdminLink = {
  href: string;
  label: string;
  permission: Permission;
  icon: React.ReactNode;
};

const LINKS: AdminLink[] = [
  {
    href: "/admin",
    label: "Painel",
    permission: "admin:access",
    icon: <ChartIcon className="size-4.5" />,
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    permission: "catalog:write",
    icon: <BoxIcon className="size-4.5" />,
  },
  {
    href: "/admin/categorias",
    label: "Categorias",
    permission: "catalog:write",
    icon: <TagIcon className="size-4.5" />,
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    permission: "orders:write",
    icon: <ListIcon className="size-4.5" />,
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    permission: "customers:read",
    icon: <UsersIcon className="size-4.5" />,
  },
  {
    href: "/admin/usuarios",
    label: "Usuários e perfis",
    permission: "users:write",
    icon: <ShieldIcon className="size-4.5" />,
  },
  {
    href: "/admin/emails",
    label: "E-mails enviados",
    permission: "logs:read",
    icon: <MailIcon className="size-4.5" />,
  },
  {
    href: "/admin/logs",
    label: "Logs de atividade",
    permission: "logs:read",
    icon: <ListIcon className="size-4.5" />,
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    permission: "settings:write",
    icon: <SettingsIcon className="size-4.5" />,
  },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePermission("admin:access");
  const links = LINKS.filter((link) => can(user, link.permission));

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      {/* ------------------------------------------------------- Navegação */}
      <aside className="bg-ink-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:block">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-500 text-[15px] font-black">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-[0.12em]">
                COMPIA
              </span>
              <span className="block text-[10px] tracking-[0.22em] text-white/60">
                ADMINISTRAÇÃO
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-[12.5px] text-white/60 hover:text-white lg:hidden"
          >
            Ver loja
          </Link>
        </div>

        <nav className="px-3 pb-3 lg:pb-0">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {links.map((link) => (
              <li key={link.href} className="shrink-0 lg:shrink">
                <Link
                  href={link.href}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13.5px] text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <span className="text-brand-300">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[12px] text-white/55">{user.email}</p>
          <span className="badge mt-2 bg-white/15 text-white">
            {ROLE_LABEL[user.role as Role]}
          </span>

          <div className="mt-3 flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <StoreIcon className="size-4" />
              Ver a loja
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
