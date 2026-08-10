import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { SHIPPING_METHOD_LABEL, type ShippingMethod } from "@/lib/constants";
import { EmptyState, OrderStatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function MyOrdersPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
      payment: { select: { method: true, status: true } },
    },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido por aqui"
        description="Quando você comprar, seus pedidos aparecem nesta página."
        action={
          <Link href="/produtos" className="btn btn-primary btn-sm">
            Ver o catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Meus pedidos
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} no total
        </p>
      </header>

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50 px-5 py-3">
              <div>
                <p className="font-mono text-[13.5px] font-semibold text-ink-900">
                  {order.number}
                </p>
                <p className="text-[12.5px] text-ink-500">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <ul className="space-y-0.5 text-[13.5px] text-ink-700">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">
                      {item.quantity}× {item.titleSnapshot}
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-ink-500">
                      e mais {order.items.length - 3} item(ns)
                    </li>
                  )}
                </ul>
                <p className="mt-2 text-[12.5px] text-ink-500">
                  {SHIPPING_METHOD_LABEL[order.shippingMethod as ShippingMethod] ??
                    order.shippingMethod}
                  {order.trackingCode ? ` · rastreio ${order.trackingCode}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[19px] font-bold text-ink-900">
                  {formatCents(order.totalCents)}
                </p>
                <Link
                  href={`/pedido/${order.number}`}
                  className="btn btn-outline btn-sm mt-2"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
