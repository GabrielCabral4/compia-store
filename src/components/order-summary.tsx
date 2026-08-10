import Link from "next/link";

import { formatCents } from "@/lib/money";
import { formatDateTime, formatEta } from "@/lib/format";
import { formatCep } from "@/lib/shipping";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  SHIPPING_METHOD_LABEL,
  type OrderStatus,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/constants";
import { CARD_BRAND_LABEL, type CardBrand } from "@/lib/cards";

import { DownloadIcon } from "./icons";
import { OrderStatusBadge, PaymentStatusBadge } from "./ui";

type OrderLike = {
  number: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: string;
  shippingCarrier: string | null;
  shippingEtaDays: number | null;
  trackingCode: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  shipCep: string | null;
  shipStreet: string | null;
  shipNumber: string | null;
  shipComplement: string | null;
  shipDistrict: string | null;
  shipCity: string | null;
  shipState: string | null;
  items: Array<{
    id: string;
    titleSnapshot: string;
    skuSnapshot: string;
    typeSnapshot: string;
    unitCents: number;
    quantity: number;
    product: { slug: string } | null;
  }>;
  payment: {
    method: string;
    status: string;
    cardBrand: string | null;
    cardLast4: string | null;
    installments: number | null;
    providerRef: string | null;
  } | null;
  downloadGrants?: Array<{
    id: string;
    token: string;
    downloadCount: number;
    maxDownloads: number;
    expiresAt: Date;
    product: { title: string };
  }>;
};

/** Trilha de situações que um pedido físico percorre. */
const PHYSICAL_FLOW: OrderStatus[] = [
  "PENDENTE_PAGAMENTO",
  "PAGO",
  "EM_SEPARACAO",
  "ENVIADO",
  "ENTREGUE",
];

const PICKUP_FLOW: OrderStatus[] = [
  "PENDENTE_PAGAMENTO",
  "PAGO",
  "EM_SEPARACAO",
  "PRONTO_RETIRADA",
  "ENTREGUE",
];

const DIGITAL_FLOW: OrderStatus[] = ["PENDENTE_PAGAMENTO", "ENTREGUE"];

export function OrderTimeline({ order }: { order: OrderLike }) {
  if (order.status === "CANCELADO") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
        Este pedido foi cancelado.
      </div>
    );
  }

  const flow =
    order.shippingMethod === "DIGITAL"
      ? DIGITAL_FLOW
      : order.shippingMethod === "RETIRADA_LOCAL"
        ? PICKUP_FLOW
        : PHYSICAL_FLOW;

  const currentIndex = flow.indexOf(order.status as OrderStatus);

  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {flow.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex items-center">
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-medium ${
                done ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
              }`}
            >
              <span
                className={`grid size-4.5 place-items-center rounded-full text-[10px] ${
                  done ? "bg-white/25" : "bg-white"
                }`}
              >
                {index + 1}
              </span>
              {ORDER_STATUS_LABEL[step]}
            </span>
            {index < flow.length - 1 && (
              <span
                className={`mx-1.5 h-px w-4 sm:w-6 ${
                  index < currentIndex ? "bg-brand-500" : "bg-ink-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetails({
  order,
  showDownloads = true,
}: {
  order: OrderLike;
  showDownloads?: boolean;
}) {
  const method = order.shippingMethod as ShippingMethod;
  const hasAddress = Boolean(order.shipCep);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">
            Itens do pedido
          </h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink-900">
                    {item.product ? (
                      <Link
                        href={`/produtos/${item.product.slug}`}
                        className="hover:text-brand-700"
                      >
                        {item.titleSnapshot}
                      </Link>
                    ) : (
                      item.titleSnapshot
                    )}
                  </p>
                  <p className="text-[12.5px] text-ink-500">
                    {item.skuSnapshot} · {item.quantity} ×{" "}
                    {formatCents(item.unitCents)}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-ink-900">
                  {formatCents(item.unitCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {showDownloads &&
          order.downloadGrants &&
          order.downloadGrants.length > 0 && (
            <section className="card p-5">
              <h2 className="text-[15px] font-bold text-ink-900">
                Seus downloads
              </h2>
              <p className="mt-1 text-[13px] text-ink-500">
                Links pessoais e intransferíveis, válidos até{" "}
                {formatDateTime(order.downloadGrants[0].expiresAt)}.
              </p>
              <ul className="mt-3 space-y-2">
                {order.downloadGrants.map((grant) => {
                  const exhausted = grant.downloadCount >= grant.maxDownloads;
                  return (
                    <li
                      key={grant.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-ink-900">
                          {grant.product.title}
                        </p>
                        <p className="text-[12px] text-ink-500">
                          {grant.downloadCount} de {grant.maxDownloads} downloads
                          utilizados
                        </p>
                      </div>
                      <a
                        href={`/api/download/${grant.token}`}
                        className={`btn btn-sm ${
                          exhausted ? "btn-outline" : "btn-dark"
                        }`}
                        aria-disabled={exhausted}
                      >
                        <DownloadIcon className="size-4" />
                        {exhausted ? "Limite atingido" : "Baixar PDF"}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">Entrega</h2>
          <dl className="mt-3 space-y-2 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Forma</dt>
              <dd className="text-right font-medium text-ink-900">
                {SHIPPING_METHOD_LABEL[method] ?? order.shippingMethod}
                {order.shippingCarrier ? ` · ${order.shippingCarrier}` : ""}
              </dd>
            </div>
            {order.shippingEtaDays !== null && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Prazo</dt>
                <dd className="text-right text-ink-800">
                  {formatEta(order.shippingEtaDays)}
                </dd>
              </div>
            )}
            {order.trackingCode && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Rastreio</dt>
                <dd className="text-right font-mono text-[13px] text-ink-900">
                  {order.trackingCode}
                </dd>
              </div>
            )}
            {hasAddress && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Endereço</dt>
                <dd className="text-right text-ink-800">
                  {order.shipStreet}, {order.shipNumber}
                  {order.shipComplement ? ` — ${order.shipComplement}` : ""}
                  <br />
                  {order.shipDistrict} · {order.shipCity}/{order.shipState}
                  <br />
                  CEP {formatCep(order.shipCep ?? "")}
                </dd>
              </div>
            )}
          </dl>

          {order.notes && (
            <p className="mt-3 rounded-lg bg-ink-50 p-3 text-[13px] text-ink-600">
              <span className="font-medium text-ink-800">Observações:</span>{" "}
              {order.notes}
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">Valores</h2>
          <dl className="mt-3 space-y-2 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd>{formatCents(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Impostos</dt>
              <dd>{formatCents(order.taxCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Frete</dt>
              <dd>
                {order.shippingCents === 0
                  ? "Grátis"
                  : formatCents(order.shippingCents)}
              </dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Desconto</dt>
                <dd>-{formatCents(order.discountCents)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="text-xl font-bold text-ink-900">
              {formatCents(order.totalCents)}
            </span>
          </div>
        </section>

        {order.payment && (
          <section className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Pagamento</h2>
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Forma</dt>
                <dd className="font-medium text-ink-900">
                  {PAYMENT_METHOD_LABEL[order.payment.method as PaymentMethod] ??
                    order.payment.method}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Situação</dt>
                <dd>
                  <PaymentStatusBadge status={order.payment.status} />
                </dd>
              </div>
              {order.payment.cardBrand && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Cartão</dt>
                  <dd className="text-ink-800">
                    {CARD_BRAND_LABEL[order.payment.cardBrand as CardBrand] ??
                      order.payment.cardBrand}{" "}
                    •••• {order.payment.cardLast4}
                    {order.payment.installments && order.payment.installments > 1
                      ? ` · ${order.payment.installments}x`
                      : ""}
                  </dd>
                </div>
              )}
              {order.payment.providerRef && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Autorização</dt>
                  <dd className="font-mono text-[12.5px] text-ink-700">
                    {order.payment.providerRef}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">Acompanhamento</h2>
          <dl className="mt-3 space-y-2 text-[13.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Situação</dt>
              <dd>
                <OrderStatusBadge status={order.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Pedido feito em</dt>
              <dd className="text-ink-800">{formatDateTime(order.createdAt)}</dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Pagamento</dt>
                <dd className="text-ink-800">{formatDateTime(order.paidAt)}</dd>
              </div>
            )}
            {order.shippedAt && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Envio</dt>
                <dd className="text-ink-800">{formatDateTime(order.shippedAt)}</dd>
              </div>
            )}
          </dl>
        </section>
      </aside>
    </div>
  );
}

export { ORDER_STATUSES };
