import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  SHIPPING_METHODS,
  SHIPPING_METHOD_LABEL,
  type OrderStatus,
  type ShippingMethod,
} from "@/lib/constants";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Pedidos" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminOrdersPage(props: PageProps<"/admin/pedidos">) {
  await requirePermission("orders:write");
  const searchParams = await props.searchParams;

  const q = first(searchParams.q).trim();
  const status = first(searchParams.situacao);
  const shipping = first(searchParams.entrega);

  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { customerName: { contains: q } },
            { customerEmail: { contains: q } },
            { trackingCode: { contains: q } },
          ],
        }
      : {}),
    ...((ORDER_STATUSES as readonly string[]).includes(status) ? { status } : {}),
    ...((SHIPPING_METHODS as readonly string[]).includes(shipping)
      ? { shippingMethod: shipping }
      : {}),
  };

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        payment: { select: { method: true, status: true } },
        items: { select: { id: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Pedidos</h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {orders.length} pedido(s) listado(s)
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/pedidos"
          className={`badge ${status ? "bg-ink-100 text-ink-600" : "bg-ink-900 text-white"}`}
        >
          Todos
        </Link>
        {ORDER_STATUSES.map((option) => (
          <Link
            key={option}
            href={`/admin/pedidos?situacao=${option}`}
            className={`badge ${
              status === option ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600"
            }`}
          >
            {ORDER_STATUS_LABEL[option as OrderStatus]}
            <span className="ml-1 opacity-60">{countByStatus.get(option) ?? 0}</span>
          </Link>
        ))}
      </div>

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            className="field-input"
            defaultValue={q}
            placeholder="Número, cliente, e-mail ou rastreio"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="situacao">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            className="field-input"
            defaultValue={status}
          >
            <option value="">Todas</option>
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ORDER_STATUS_LABEL[option as OrderStatus]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="field-label" htmlFor="entrega">
              Entrega
            </label>
            <select
              id="entrega"
              name="entrega"
              className="field-input"
              defaultValue={shipping}
            >
              <option value="">Todas</option>
              {SHIPPING_METHODS.map((option) => (
                <option key={option} value={option}>
                  {SHIPPING_METHOD_LABEL[option as ShippingMethod]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-dark btn-sm">
            Filtrar
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Pagamento</th>
              <th>Situação</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}

            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="font-mono text-[13px] font-semibold text-brand-700 hover:underline"
                  >
                    {order.number}
                  </Link>
                  <p className="text-[12px] text-ink-400">
                    {formatDateTime(order.createdAt)} · {order.items.length} item(ns)
                  </p>
                </td>
                <td>
                  <p className="text-ink-800">{order.customerName}</p>
                  <p className="text-[12px] text-ink-400">{order.customerEmail}</p>
                </td>
                <td className="text-[13px] text-ink-600">
                  {SHIPPING_METHOD_LABEL[order.shippingMethod as ShippingMethod] ??
                    order.shippingMethod}
                  {order.trackingCode && (
                    <p className="font-mono text-[11.5px] text-ink-400">
                      {order.trackingCode}
                    </p>
                  )}
                </td>
                <td>
                  {order.payment ? (
                    <>
                      <PaymentStatusBadge status={order.payment.status} />
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        {order.payment.method === "PIX" ? "PIX" : "Cartão"}
                      </p>
                    </>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
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
    </div>
  );
}
