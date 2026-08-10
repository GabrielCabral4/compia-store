import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatCpf } from "@/lib/format";
import { OrderDetails, OrderTimeline } from "@/components/order-summary";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderPage(
  props: PageProps<"/admin/pedidos/[id]">
) {
  await requirePermission("orders:write");
  const { id } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      payment: true,
      downloadGrants: {
        include: { product: { select: { title: true } } },
        orderBy: { createdAt: "asc" },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-[13px] text-ink-500">
        <Link href="/admin/pedidos" className="hover:text-brand-700">
          Pedidos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">{order.number}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-ink-900">
            {order.number}
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            Criado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Link
          href={`/pedido/${order.number}`}
          target="_blank"
          className="btn btn-outline btn-sm"
        >
          Ver como o cliente
        </Link>
      </header>

      <div className="overflow-x-auto">
        <OrderTimeline order={order} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <OrderDetails order={order} />
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink-900">
              Atualizar pedido
            </h2>
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              trackingCode={order.trackingCode}
              shippingMethod={order.shippingMethod}
            />
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Cliente</h2>
            <dl className="mt-3 space-y-2 text-[13.5px]">
              <div>
                <dt className="text-ink-500">Nome</dt>
                <dd className="font-medium text-ink-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">E-mail</dt>
                <dd className="break-all text-ink-800">{order.customerEmail}</dd>
              </div>
              {order.customerPhone && (
                <div>
                  <dt className="text-ink-500">Telefone</dt>
                  <dd className="text-ink-800">{order.customerPhone}</dd>
                </div>
              )}
              {order.customerCpf && (
                <div>
                  <dt className="text-ink-500">CPF</dt>
                  <dd className="text-ink-800">{formatCpf(order.customerCpf)}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-500">Conta</dt>
                <dd className="text-ink-800">
                  {order.user ? (
                    <Link
                      href={`/admin/clientes?q=${encodeURIComponent(order.user.email)}`}
                      className="text-brand-700 hover:underline"
                    >
                      cliente cadastrado
                    </Link>
                  ) : (
                    "compra como visitante"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
