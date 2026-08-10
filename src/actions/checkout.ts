"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { loadCart, writeCartCookie } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { logActivity } from "@/lib/logs";
import { orderPlacedEmail, sendEmail } from "@/lib/mail";
import { approvePayment, siteUrl } from "@/lib/orders";
import { generateOrderNumber } from "@/lib/order-number";
import { buildPixPayload, normalizeTxid } from "@/lib/pix";
import { sandboxGateway } from "@/lib/gateway";
import {
  findQuote,
  normalizeCep,
  quoteShipping,
  type ShippingQuote,
} from "@/lib/shipping";
import {
  cepSchema,
  cpfSchema,
  emailSchema,
  fieldErrors,
  nameSchema,
} from "@/lib/validation";
import { fail, toActionState, type ActionState } from "@/lib/action-state";
import {
  ORDER_STATUS_LABEL,
  SHIPPING_METHOD_LABEL,
  type ShippingMethod,
} from "@/lib/constants";

/**
 * Recalcula as opções de frete no servidor. É usada tanto pela tela de
 * checkout (ao digitar o CEP) quanto pela criação do pedido; o valor enviado
 * pelo navegador nunca é aceito diretamente.
 */
export async function quoteShippingAction(cep: string): Promise<{
  ok: boolean;
  message?: string;
  quotes: ShippingQuote[];
}> {
  const cart = await loadCart();
  const settings = await getSettings();
  const normalized = normalizeCep(cep);

  if (cart.itemCount === 0) {
    return { ok: false, message: "Seu carrinho está vazio.", quotes: [] };
  }

  if (cart.hasPhysicalItems && normalized.length !== 8) {
    return {
      ok: false,
      message: "Informe um CEP com 8 dígitos para calcular o frete.",
      quotes: settings.pickupEnabled
        ? quoteShipping({
            cep: "",
            weightGrams: cart.weightGrams,
            subtotalCents: cart.subtotalCents,
            hasPhysicalItems: true,
            settings,
          })
        : [],
    };
  }

  return {
    ok: true,
    quotes: quoteShipping({
      cep: normalized,
      weightGrams: cart.weightGrams,
      subtotalCents: cart.subtotalCents,
      hasPhysicalItems: cart.hasPhysicalItems,
      settings,
    }),
  };
}

const baseSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerCpf: cpfSchema,
  customerPhone: z.string().trim().max(20).optional(),
  shippingMethod: z.enum([
    "PAC",
    "SEDEX",
    "TRANSPORTADORA",
    "RETIRADA_LOCAL",
    "DIGITAL",
  ]),
  paymentMethod: z.enum(["PIX", "CARTAO_CREDITO"]),
  notes: z.string().trim().max(500).optional(),
});

const addressPartSchema = z.object({
  shipCep: cepSchema,
  shipStreet: z.string().trim().min(3, "Informe o logradouro."),
  shipNumber: z.string().trim().min(1, "Informe o número."),
  shipComplement: z.string().trim().max(80).optional(),
  shipDistrict: z.string().trim().min(2, "Informe o bairro."),
  shipCity: z.string().trim().min(2, "Informe a cidade."),
  shipState: z.string().trim().length(2, "UF inválida."),
});

const cardSchema = z.object({
  cardNumber: z.string().min(13, "Informe o número do cartão."),
  cardHolder: z.string().trim().min(3, "Informe o nome impresso no cartão."),
  cardExpiry: z
    .string()
    .regex(/^\d{2}\s*\/\s*\d{2,4}$/, "Use o formato MM/AA."),
  cardCvv: z.string().regex(/^\d{3,4}$/, "CVV inválido."),
  installments: z.coerce.number().int().min(1).max(12).default(1),
});

export async function placeOrderAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let orderNumber: string | null = null;

  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = baseSchema.safeParse(raw);
    if (!parsed.success) {
      return fail("Revise os dados do pedido.", fieldErrors(parsed.error));
    }

    const cart = await loadCart();
    if (cart.itemCount === 0) {
      return fail("Seu carrinho está vazio.");
    }
    if (cart.items.some((item) => item.availableQuantity < item.quantity)) {
      return fail(
        "O estoque de um dos itens mudou. Revise o carrinho antes de continuar."
      );
    }

    const settings = await getSettings();
    const user = await getCurrentUser();
    const method = parsed.data.shippingMethod as ShippingMethod;
    const needsAddress = ["PAC", "SEDEX", "TRANSPORTADORA"].includes(method);

    let address: z.infer<typeof addressPartSchema> | null = null;
    if (needsAddress) {
      const parsedAddress = addressPartSchema.safeParse(raw);
      if (!parsedAddress.success) {
        return fail(
          "Complete o endereço de entrega.",
          fieldErrors(parsedAddress.error)
        );
      }
      address = parsedAddress.data;
    }

    // Frete sempre recalculado no servidor.
    const quotes = quoteShipping({
      cep: address?.shipCep ?? "",
      weightGrams: cart.weightGrams,
      subtotalCents: cart.subtotalCents,
      hasPhysicalItems: cart.hasPhysicalItems,
      settings,
    });
    const quote = findQuote(quotes, method);
    if (!quote) {
      return fail("Forma de entrega indisponível para este pedido.", {
        shippingMethod: "Escolha uma forma de entrega válida.",
      });
    }

    const subtotalCents = cart.subtotalCents;
    const taxCents = cart.taxCents;
    const shippingCents = quote.cents;
    const totalCents = subtotalCents + taxCents + shippingCents;

    // Autorização do cartão antes de gravar o pedido.
    let cardResult: Awaited<ReturnType<typeof sandboxGateway.authorizeCard>> | null =
      null;
    let installments = 1;
    let cardHolder: string | null = null;

    const number = generateOrderNumber();

    if (parsed.data.paymentMethod === "CARTAO_CREDITO") {
      const parsedCard = cardSchema.safeParse(raw);
      if (!parsedCard.success) {
        return fail("Revise os dados do cartão.", fieldErrors(parsedCard.error));
      }

      const [monthPart, yearPart] = parsedCard.data.cardExpiry.split("/");
      installments = parsedCard.data.installments;
      cardHolder = parsedCard.data.cardHolder.toUpperCase();

      cardResult = await sandboxGateway.authorizeCard({
        amountCents: totalCents,
        cardNumber: parsedCard.data.cardNumber,
        holder: parsedCard.data.cardHolder,
        expiryMonth: Number(monthPart.trim()),
        expiryYear: Number(yearPart.trim()),
        cvv: parsedCard.data.cardCvv,
        installments,
        orderNumber: number,
      });

      if (!cardResult.approved) {
        await logActivity({
          action: "PAGAMENTO_RECUSADO",
          entity: "Order",
          detail: `${number}: ${cardResult.reason}`,
          actorEmail: parsed.data.customerEmail,
        });
        return fail(cardResult.reason, { cardNumber: cardResult.reason });
      }
    }

    const pixPayload =
      parsed.data.paymentMethod === "PIX"
        ? buildPixPayload({
            key: settings.pixKey,
            merchantName: settings.pixMerchantName,
            merchantCity: settings.pixMerchantCity,
            amountCents: totalCents,
            txid: number,
            description: `Pedido ${number}`,
          })
        : null;

    // Criação do pedido com baixa de estoque na mesma transação.
    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        if (item.type === "DIGITAL") continue;
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.availableQuantity } },
          data: { stock: { decrement: item.availableQuantity } },
        });
        if (updated.count === 0) {
          throw new Error(
            `O estoque de "${item.title}" acabou enquanto você finalizava a compra.`
          );
        }
      }

      return tx.order.create({
        data: {
          number,
          userId: user?.id ?? null,
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerCpf: parsed.data.customerCpf || null,
          customerPhone: parsed.data.customerPhone || null,
          status: "PENDENTE_PAGAMENTO",
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          shippingMethod: method,
          shippingCarrier: quote.carrier,
          shippingEtaDays: quote.etaDays,
          shipCep: address?.shipCep ?? null,
          shipStreet: address?.shipStreet ?? null,
          shipNumber: address?.shipNumber ?? null,
          shipComplement: address?.shipComplement || null,
          shipDistrict: address?.shipDistrict ?? null,
          shipCity: address?.shipCity ?? null,
          shipState: address?.shipState.toUpperCase() ?? null,
          notes: parsed.data.notes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              titleSnapshot: item.title,
              skuSnapshot: item.sku,
              typeSnapshot: item.type,
              unitCents: item.unitCents,
              quantity: item.availableQuantity,
              taxCents: item.taxCents,
            })),
          },
          payment: {
            create: {
              method: parsed.data.paymentMethod,
              status: cardResult?.approved ? "APROVADO" : "AGUARDANDO",
              amountCents: totalCents,
              providerRef: cardResult?.approved ? cardResult.providerRef : null,
              cardBrand: cardResult?.approved ? cardResult.brand : null,
              cardLast4: cardResult?.approved ? cardResult.last4 : null,
              cardHolder,
              installments:
                parsed.data.paymentMethod === "CARTAO_CREDITO" ? installments : null,
              pixKey: pixPayload ? settings.pixKey : null,
              pixTxid: pixPayload ? normalizeTxid(number) : null,
              pixPayload,
              pixExpiresAt: pixPayload
                ? new Date(Date.now() + settings.pixExpiryMinutes * 60 * 1000)
                : null,
            },
          },
        },
      });
    });

    await logActivity({
      action: "PEDIDO_CRIADO",
      entity: "Order",
      entityId: order.id,
      detail: `${order.number} / ${formatCents(totalCents)} / ${
        SHIPPING_METHOD_LABEL[method]
      }`,
      userId: user?.id ?? null,
      actorEmail: parsed.data.customerEmail,
    });

    const message = orderPlacedEmail({
      number: order.number,
      customerName: order.customerName,
      totalFormatted: formatCents(totalCents),
      statusLabel: ORDER_STATUS_LABEL.PENDENTE_PAGAMENTO,
      itemLines: cart.items.map(
        (item) =>
          `${item.availableQuantity}× ${item.title} - ${formatCents(
            item.lineTotalCents
          )}`
      ),
      extra:
        parsed.data.paymentMethod === "PIX"
          ? "<p>Finalize o pagamento pelo QR Code PIX disponível na página do pedido.</p>"
          : undefined,
      url: siteUrl(`/pedido/${order.number}`),
    });
    await sendEmail({ to: order.customerEmail, ...message });

    // Cartão aprovado: confirma o pagamento e libera downloads.
    if (cardResult?.approved) {
      await approvePayment(order.id);
    }

    await writeCartCookie([]);
    orderNumber = order.number;
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/", "layout");
  redirect(`/pedido/${orderNumber}`);
}

/**
 * Confirmação manual do PIX na sandbox. Equivale ao webhook que o banco
 * enviaria. Disponível na própria página do pedido para permitir o teste.
 */
export async function confirmPixAction(formData: FormData): Promise<void> {
  const number = String(formData.get("number") ?? "");
  const order = await prisma.order.findUnique({
    where: { number },
    include: { payment: true },
  });

  if (order?.payment?.method === "PIX" && order.status === "PENDENTE_PAGAMENTO") {
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerRef: `PIX-${normalizeTxid(order.number)}` },
    });
    await approvePayment(order.id);
  }

  revalidatePath(`/pedido/${number}`);
  revalidatePath("/conta/pedidos");
  revalidatePath("/admin/pedidos");
}
