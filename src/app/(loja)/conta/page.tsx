import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { OrderStatusBadge } from "@/components/ui";
import { ArrowRightIcon, BoxIcon, DownloadIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requireUser();

  const [orders, orderCount, grantCount, totalSpent] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { items: { select: { id: true } } },
    }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.downloadGrant.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, status: { not: "CANCELADO" } },
      _sum: { totalCents: true },
    }),
  ]);

  const stats = [
    { label: "Pedidos realizados", value: String(orderCount) },
    { label: "E-books na biblioteca", value: String(grantCount) },
    {
      label: "Total comprado",
      value: formatCents(totalSpent._sum.totalCents ?? 0),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Olá, {user.name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Aqui você acompanha seus pedidos e acessa seus materiais digitais.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-[13px] text-ink-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-ink-900">Pedidos recentes</h2>
          <Link href="/conta/pedidos" className="btn btn-ghost btn-sm">
            Ver todos
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <BoxIcon className="mx-auto size-8 text-ink-300" />
            <p className="mt-2 text-[14px] text-ink-500">
              Você ainda não fez nenhum pedido.
            </p>
            <Link href="/produtos" className="btn btn-primary btn-sm mt-4">
              Explorar o catálogo
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/pedido/${order.number}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-ink-50"
                >
                  <div>
                    <p className="font-mono text-[13.5px] font-semibold text-ink-900">
                      {order.number}
                    </p>
                    <p className="text-[12.5px] text-ink-500">
                      {formatDateTime(order.createdAt)} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold text-ink-900">
                      {formatCents(order.totalCents)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <DownloadIcon className="mt-0.5 size-6 text-brand-600" />
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">
              Minha biblioteca
            </h2>
            <p className="mt-0.5 text-[13.5px] text-ink-500">
              Baixe novamente os e-books que você já comprou.
            </p>
          </div>
        </div>
        <Link href="/conta/biblioteca" className="btn btn-outline btn-sm">
          Acessar biblioteca
        </Link>
      </section>
    </div>
  );
}
