import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { can, requirePermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { OrderStatusBadge } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Painel" };

export default async function AdminDashboard() {
  const user = await requirePermission("admin:access");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    revenue,
    monthRevenue,
    orderCount,
    pendingCount,
    productCount,
    lowStock,
    customerCount,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELADO", "PENDENTE_PAGAMENTO"] } },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { notIn: ["CANCELADO", "PENDENTE_PAGAMENTO"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDENTE_PAGAMENTO" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true, type: { not: "DIGITAL" }, stock: { lte: 15 } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, title: true, stock: true, sku: true },
    }),
    prisma.user.count({ where: { role: "CLIENTE" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        customerName: true,
        status: true,
        totalCents: true,
        createdAt: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["titleSnapshot"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const cards = [
    {
      label: "Receita confirmada",
      value: formatCents(revenue._sum.totalCents ?? 0),
      hint: "pedidos pagos, enviados ou entregues",
    },
    {
      label: "Receita do mês",
      value: formatCents(monthRevenue._sum.totalCents ?? 0),
      hint: `${monthRevenue._count} pedido(s) neste mês`,
    },
    {
      label: "Pedidos",
      value: String(orderCount),
      hint: `${pendingCount} aguardando pagamento`,
    },
    {
      label: "Catálogo",
      value: String(productCount),
      hint: `${customerCount} cliente(s) cadastrado(s)`,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Bem-vindo(a), {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Visão geral da loja em {formatDateTime(new Date())}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <p className="text-[13px] text-ink-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{card.value}</p>
            <p className="mt-1 text-[12px] text-ink-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-[15px] font-bold text-ink-900">
              Pedidos recentes
            </h2>
            {can(user, "orders:write") && (
              <Link href="/admin/pedidos" className="btn btn-ghost btn-sm">
                Ver todos <ArrowRightIcon className="size-4" />
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Situação</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={
                          can(user, "orders:write")
                            ? `/admin/pedidos/${order.id}`
                            : `/pedido/${order.number}`
                        }
                        className="font-mono text-[13px] font-semibold text-brand-700 hover:underline"
                      >
                        {order.number}
                      </Link>
                      <p className="text-[12px] text-ink-400">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </td>
                    <td className="text-ink-700">{order.customerName}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-right font-semibold">
                      {formatCents(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="border-b border-ink-100 px-5 py-4 text-[15px] font-bold text-ink-900">
              Mais vendidos
            </h2>
            <ul className="divide-y divide-ink-100">
              {topProducts.length === 0 && (
                <li className="px-5 py-4 text-[13.5px] text-ink-500">
                  Ainda não há vendas registradas.
                </li>
              )}
              {topProducts.map((item) => (
                <li
                  key={item.titleSnapshot}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <span className="min-w-0 truncate text-[13.5px] text-ink-700">
                    {item.titleSnapshot}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-ink-900">
                    {item._sum.quantity} un.
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="border-b border-ink-100 px-5 py-4 text-[15px] font-bold text-ink-900">
              Estoque baixo
            </h2>
            <ul className="divide-y divide-ink-100">
              {lowStock.length === 0 && (
                <li className="px-5 py-4 text-[13.5px] text-ink-500">
                  Nenhum título com estoque crítico.
                </li>
              )}
              {lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="min-w-0 truncate text-[13.5px] text-ink-700 hover:text-brand-700"
                  >
                    {product.title}
                  </Link>
                  <span
                    className={`badge shrink-0 ${
                      product.stock <= 5
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {product.stock} un.
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
