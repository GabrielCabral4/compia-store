import Link from "next/link";

import { cartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, type Role } from "@/lib/constants";

import { CartIcon, SearchIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";

export async function SiteHeader() {
  const [count, user, categories] = await Promise.all([
    cartCount(),
    getCurrentUser(),
    prisma.category.findMany({ orderBy: { position: "asc" }, take: 8 }),
  ]);

  const isStaff = user ? STAFF_ROLES.includes(user.role as Role) : false;

  const navLinks = [
    { href: "/produtos", label: "Todo o catálogo" },
    ...categories.map((category) => ({
      href: `/produtos?categoria=${category.slug}`,
      label: category.name,
    })),
    { href: "/sobre", label: "Sobre a editora" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-ink-950 text-white">
      <div className="border-b border-white/10">
        <div className="container-page flex h-11 items-center justify-between text-[12.5px] text-white/70">
          <p className="hidden sm:block">
            Frete grátis em compras acima de R$ 250 · E-books com entrega imediata
          </p>
          <p className="sm:hidden">Frete grátis acima de R$ 250</p>
          <div className="flex items-center gap-4">
            {isStaff && (
              <Link href="/admin" className="hover:text-white">
                Painel administrativo
              </Link>
            )}
            <Link href="/sobre" className="hidden hover:text-white sm:block">
              Ajuda
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-500 text-[15px] font-black">
            C
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-bold tracking-[0.14em]">
              COMPIA
            </span>
            <span className="block text-[10px] tracking-[0.28em] text-white/60">
              EDITORA
            </span>
          </span>
        </Link>

        <form
          action="/produtos"
          className="ml-2 hidden flex-1 items-center md:flex"
          role="search"
        >
          <label htmlFor="header-search" className="sr-only">
            Buscar no catálogo
          </label>
          <div className="relative w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-400" />
            <input
              id="header-search"
              type="search"
              name="q"
              placeholder="Buscar por título, autor ou assunto…"
              className="w-full rounded-full border border-white/10 bg-white/10 py-2.5 pl-10 pr-4 text-[14px] text-white placeholder:text-white/50 focus:bg-white focus:text-ink-900 focus:placeholder:text-ink-400"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Link
            href={user ? "/conta" : "/conta/login"}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] hover:bg-white/10"
          >
            <UserIcon className="size-5" />
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-white/60">
                {user ? "Olá," : "Entrar ou"}
              </span>
              <span className="block font-semibold">
                {user ? user.name.split(" ")[0] : "cadastrar"}
              </span>
            </span>
          </Link>

          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] hover:bg-white/10"
          >
            <span className="relative">
              <CartIcon className="size-5.5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 grid size-[18px] place-items-center rounded-full bg-accent-500 text-[11px] font-bold text-ink-950">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </span>
            <span className="hidden font-semibold lg:block">Carrinho</span>
          </Link>

          <MobileMenu links={navLinks} />
        </div>
      </div>

      <nav className="hidden border-t border-white/10 md:block">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-1.5">
          <Link
            href="/produtos"
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-white/10"
          >
            Todo o catálogo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] text-white/75 hover:bg-white/10 hover:text-white"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      <form action="/produtos" className="container-page pb-3 md:hidden" role="search">
        <label htmlFor="header-search-mobile" className="sr-only">
          Buscar no catálogo
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-400" />
          <input
            id="header-search-mobile"
            type="search"
            name="q"
            placeholder="Buscar no catálogo…"
            className="w-full rounded-full border border-white/10 bg-white/10 py-2.5 pl-10 pr-4 text-[14px] text-white placeholder:text-white/50 focus:bg-white focus:text-ink-900"
          />
        </div>
      </form>
    </header>
  );
}
