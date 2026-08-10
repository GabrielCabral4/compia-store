import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { pixQrCodeDataUrl } from "@/lib/pix";
import { STAFF_ROLES, type Role } from "@/lib/constants";
import { confirmPixAction } from "@/actions/checkout";
import { CopyButton } from "@/components/copy-button";
import { OrderDetails, OrderTimeline } from "@/components/order-summary";
import { Alert } from "@/components/ui";
import { CheckIcon, ClockIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderPage(props: PageProps<"/pedido/[number]">) {
  const { number } = await props.params;

  const [order, user, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { number },
      include: {
        items: { include: { product: { select: { slug: true } } } },
        payment: true,
        downloadGrants: {
          include: { product: { select: { title: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getCurrentUser(),
    getSettings(),
  ]);

  if (!order) notFound();

  // Pedidos vinculados a uma conta só podem ser vistos pelo dono ou pela
  // equipe; pedidos de visitante são acessíveis por quem tem o número.
  const isStaff = user ? STAFF_ROLES.includes(user.role as Role) : false;
  if (order.userId && order.userId !== user?.id && !isStaff) notFound();

  const payment = order.payment;
  const isPixPending =
    payment?.method === "PIX" &&
    payment.status === "AGUARDANDO" &&
    order.status === "PENDENTE_PAGAMENTO";

  const qrCode =
    isPixPending && payment?.pixPayload
      ? await pixQrCodeDataUrl(payment.pixPayload)
      : null;

  const isPaid = order.status !== "PENDENTE_PAGAMENTO" && order.status !== "CANCELADO";

  return (
    <div className="container-page py-8 lg:py-10">
      <nav aria-label="Trilha" className="mb-4 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/conta/pedidos" className="hover:text-brand-700">
          Meus pedidos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">{order.number}</span>
      </nav>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Pedido {order.number}
          </h1>
        </div>
        <p className="mt-1 text-[14px] text-ink-500">
          Realizado em {formatDateTime(order.createdAt)} · {order.customerEmail}
        </p>
      </header>

      {isPaid && (
        <div className="mb-6">
          <Alert tone="success">
            <strong>Pagamento confirmado.</strong> Enviamos os detalhes para{" "}
            {order.customerEmail}.
          </Alert>
        </div>
      )}

      <div className="mb-6 overflow-x-auto">
        <OrderTimeline order={order} />
      </div>

      {/* PIX */}
      {isPixPending && payment?.pixPayload && (
        <section className="card mb-6 overflow-hidden">
          <div className="border-b border-ink-100 bg-brand-50 px-5 py-3">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-brand-900">
              <ClockIcon className="size-5" />
              Pague com PIX para concluir
            </h2>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
            <div className="mx-auto w-full max-w-55">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode ?? ""}
                alt="QR Code para pagamento por PIX"
                className="w-full rounded-xl border border-ink-200"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[14px] text-ink-700">
                Abra o aplicativo do seu banco, escolha <strong>PIX</strong> →{" "}
                <strong>Pagar com QR Code</strong> e aponte a câmera. Você também
                pode copiar o código abaixo.
              </p>

              <dl className="mt-4 grid gap-2 text-[13.5px] sm:grid-cols-2">
                <div>
                  <dt className="text-ink-500">Valor</dt>
                  <dd className="text-lg font-bold text-ink-900">
                    {formatCents(order.totalCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">Chave PIX (aleatória)</dt>
                  <dd className="break-all font-mono text-[12.5px] text-ink-800">
                    {payment.pixKey}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ink-500">Beneficiário</dt>
                  <dd className="text-ink-800">
                    {settings.pixMerchantName} — {settings.pixMerchantCity}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="field-label">PIX copia e cola</p>
                <textarea
                  readOnly
                  rows={3}
                  value={payment.pixPayload}
                  className="field-input font-mono text-[11.5px]"
                  aria-label="Código PIX copia e cola"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <CopyButton value={payment.pixPayload} />
                  {payment.pixExpiresAt && (
                    <span className="text-[12.5px] text-ink-500">
                      Válido até {formatDateTime(payment.pixExpiresAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-ink-300 bg-ink-50 p-4">
                <p className="text-[12.5px] leading-relaxed text-ink-600">
                  <strong>Ambiente de testes:</strong> em produção, o banco
                  notificaria a loja por webhook. Aqui, use o botão abaixo para
                  simular a confirmação do PIX e ver o pedido avançar (e os
                  e-books serem liberados).
                </p>
                <form action={confirmPixAction} className="mt-3">
                  <input type="hidden" name="number" value={order.number} />
                  <SubmitButton
                    className="btn btn-dark btn-sm"
                    pendingLabel="Confirmando…"
                  >
                    <CheckIcon className="size-4" />
                    Simular confirmação do PIX
                  </SubmitButton>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      <OrderDetails order={order} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/produtos" className="btn btn-outline">
          Continuar comprando
        </Link>
        <Link href="/conta/pedidos" className="btn btn-ghost">
          Ver todos os meus pedidos
        </Link>
      </div>
    </div>
  );
}
