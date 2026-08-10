import "server-only";
import { prisma } from "./prisma";
import { randomToken } from "./crypto";
import { getSettings } from "./settings";
import { formatCents } from "./money";
import { logActivity } from "./logs";
import {
  orderStatusEmail,
  paymentApprovedEmail,
  sendEmail,
} from "./mail";
import {
  ORDER_STATUS_LABEL,
  SHIPPING_METHOD_LABEL,
  type OrderStatus,
  type ShippingMethod,
} from "./constants";

export function siteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export const orderInclude = {
  items: { include: { product: { select: { slug: true, type: true } } } },
  payment: true,
  downloadGrants: { include: { product: { select: { title: true, slug: true } } } },
  user: { select: { id: true, name: true, email: true } },
} as const;

export type DetailedOrder = Awaited<
  ReturnType<
    typeof prisma.order.findFirstOrThrow<{ include: typeof orderInclude }>
  >
>;

/**
 * Cria as autorizações de download dos e-books do pedido. Idempotente: se o
 * pedido já tem autorizações, nada é criado.
 */
export async function createDownloadGrants(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      downloadGrants: true,
    },
  });
  if (!order || order.downloadGrants.length > 0) return 0;

  const settings = await getSettings();
  const expiresAt = new Date(
    Date.now() + settings.downloadExpiryDays * 24 * 60 * 60 * 1000
  );

  const digitalItems = order.items.filter(
    (item) => item.product && item.product.type === "DIGITAL"
  );
  if (digitalItems.length === 0) return 0;

  await prisma.downloadGrant.createMany({
    data: digitalItems.map((item) => ({
      token: randomToken(24),
      orderId: order.id,
      productId: item.productId!,
      userId: order.userId,
      maxDownloads: settings.downloadMaxPerItem,
      expiresAt,
    })),
  });

  return digitalItems.length;
}

/**
 * Confirma o pagamento: marca o pedido como pago, libera os downloads e
 * notifica o cliente por e-mail. Idempotente.
 */
export async function approvePayment(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: true },
  });
  if (!order || order.status !== "PENDENTE_PAGAMENTO") return;

  const now = new Date();
  const hasPhysical = order.shippingMethod !== "DIGITAL";
  const nextStatus: OrderStatus = hasPhysical ? "PAGO" : "ENTREGUE";

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus, paidAt: now },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: "APROVADO", paidAt: now },
    }),
  ]);

  const grants = await createDownloadGrants(orderId);

  const extra =
    grants > 0
      ? `<p>Seus e-books já estão disponíveis em <a href="${siteUrl(
          "/conta/biblioteca"
        )}">Minha biblioteca</a>.</p>`
      : order.shippingMethod === "RETIRADA_LOCAL"
        ? "<p>Avisaremos por e-mail assim que o pedido estiver separado para retirada.</p>"
        : "<p>O pedido entrou na fila de separação e você receberá o código de rastreio em breve.</p>";

  const message = paymentApprovedEmail({
    number: order.number,
    customerName: order.customerName,
    totalFormatted: formatCents(order.totalCents),
    statusLabel: ORDER_STATUS_LABEL[nextStatus],
    itemLines: [],
    extra,
    url: siteUrl(`/pedido/${order.number}`),
  });
  await sendEmail({ to: order.customerEmail, ...message });

  await logActivity({
    action: "PAGAMENTO_APROVADO",
    entity: "Order",
    entityId: order.id,
    detail: `Pedido ${order.number} — ${formatCents(order.totalCents)}`,
    userId: order.userId,
    actorEmail: order.customerEmail,
  });
}

type StatusChangeOptions = {
  trackingCode?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
};

/** Muda a situação do pedido, devolvendo estoque em cancelamentos. */
export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  options: StatusChangeOptions = {}
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === status) return;

  const wasCancelled = order.status === "CANCELADO";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        trackingCode: options.trackingCode ?? order.trackingCode,
        shippedAt: status === "ENVIADO" ? new Date() : order.shippedAt,
        paidAt:
          order.paidAt ??
          (["PAGO", "EM_SEPARACAO", "ENVIADO", "PRONTO_RETIRADA", "ENTREGUE"].includes(
            status
          )
            ? new Date()
            : null),
      },
    });

    // O estoque é reservado na criação do pedido: cancelar devolve as
    // unidades, reabrir um pedido cancelado as retira novamente.
    if (status === "CANCELADO" && !wasCancelled) {
      for (const item of order.items) {
        if (!item.productId || item.typeSnapshot === "DIGITAL") continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.payment.updateMany({
        where: { orderId, status: "APROVADO" },
        data: { status: "ESTORNADO" },
      });
    } else if (wasCancelled) {
      for (const item of order.items) {
        if (!item.productId || item.typeSnapshot === "DIGITAL") continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
  });

  if (status === "PAGO" || status === "ENTREGUE") {
    await createDownloadGrants(orderId);
  }

  const notifiable: OrderStatus[] = [
    "ENVIADO",
    "PRONTO_RETIRADA",
    "ENTREGUE",
    "CANCELADO",
    "EM_SEPARACAO",
  ];

  if (notifiable.includes(status)) {
    const trackingCode = options.trackingCode ?? order.trackingCode;
    const extra =
      status === "ENVIADO" && trackingCode
        ? `<p>Código de rastreio: <strong>${trackingCode}</strong> (${
            SHIPPING_METHOD_LABEL[order.shippingMethod as ShippingMethod] ??
            order.shippingMethod
          }).</p>`
        : status === "PRONTO_RETIRADA"
          ? "<p>Leve um documento com foto e o número do pedido no momento da retirada.</p>"
          : undefined;

    const message = orderStatusEmail({
      number: order.number,
      customerName: order.customerName,
      totalFormatted: formatCents(order.totalCents),
      statusLabel: ORDER_STATUS_LABEL[status],
      itemLines: [],
      extra,
      url: siteUrl(`/pedido/${order.number}`),
    });
    await sendEmail({ to: order.customerEmail, ...message });
  }

  await logActivity({
    action: "PEDIDO_STATUS",
    entity: "Order",
    entityId: order.id,
    detail: `${order.number}: ${ORDER_STATUS_LABEL[order.status as OrderStatus]} → ${
      ORDER_STATUS_LABEL[status]
    }`,
    userId: options.actorId ?? null,
    actorEmail: options.actorEmail ?? null,
  });
}

/** Situações que o cliente ainda pode cancelar sozinho. */
export function canCustomerCancel(status: string): boolean {
  return status === "PENDENTE_PAGAMENTO";
}
