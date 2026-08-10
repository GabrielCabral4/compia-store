import "server-only";
import { cookies } from "next/headers";

import { prisma } from "./prisma";
import { readSignedPayload, signPayload } from "./crypto";
import { applyBasisPoints } from "./money";
import { getSettings } from "./settings";
import type { ProductType } from "./constants";

export const CART_COOKIE = "compia_cart";
const MAX_QUANTITY_PER_ITEM = 20;

export type CartLine = { productId: string; quantity: number };

type CartCookiePayload = { items: CartLine[] };

export type LoadedCartItem = {
  productId: string;
  slug: string;
  sku: string;
  title: string;
  type: ProductType;
  imageUrl: string | null;
  unitCents: number;
  quantity: number;
  /** Quantidade de fato disponível (limitada pelo estoque). */
  availableQuantity: number;
  lineTotalCents: number;
  taxCents: number;
  weightGrams: number;
  stock: number;
  outOfStock: boolean;
};

export type LoadedCart = {
  items: LoadedCartItem[];
  itemCount: number;
  subtotalCents: number;
  taxCents: number;
  weightGrams: number;
  hasPhysicalItems: boolean;
  hasDigitalItems: boolean;
  /** Avisos: itens removidos do catálogo ou com estoque insuficiente. */
  issues: string[];
};

export const EMPTY_CART: LoadedCart = {
  items: [],
  itemCount: 0,
  subtotalCents: 0,
  taxCents: 0,
  weightGrams: 0,
  hasPhysicalItems: false,
  hasDigitalItems: false,
  issues: [],
};

// Leitura e escrita do cookie

export async function readCartCookie(): Promise<CartLine[]> {
  const store = await cookies();
  const payload = readSignedPayload<CartCookiePayload>(
    store.get(CART_COOKIE)?.value
  );
  if (!payload || !Array.isArray(payload.items)) return [];

  return payload.items
    .filter(
      (line): line is CartLine =>
        typeof line?.productId === "string" &&
        Number.isInteger(line?.quantity) &&
        line.quantity > 0
    )
    .map((line) => ({
      productId: line.productId,
      quantity: Math.min(line.quantity, MAX_QUANTITY_PER_ITEM),
    }));
}

/** Só pode ser chamada de Server Actions ou Route Handlers. */
export async function writeCartCookie(items: CartLine[]): Promise<void> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, signPayload({ items } satisfies CartCookiePayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// Carrinho resolvido contra o catálogo

/**
 * Junta as linhas do cookie com os dados atuais do catálogo e calcula os
 * totais. Preço, estoque e disponibilidade são sempre lidos do banco; o
 * cookie guarda apenas identificador e quantidade.
 */
export async function loadCart(): Promise<LoadedCart> {
  const lines = await readCartCookie();
  if (lines.length === 0) return EMPTY_CART;

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) }, active: true },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    getSettings(),
  ]);

  const byId = new Map(products.map((product) => [product.id, product]));
  const items: LoadedCartItem[] = [];
  const issues: string[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) {
      issues.push("Um item foi removido do carrinho por não estar mais disponível.");
      continue;
    }

    const type = product.type as ProductType;
    const isPhysical = type !== "DIGITAL";
    const availableQuantity = isPhysical
      ? Math.min(line.quantity, product.stock)
      : line.quantity;

    if (isPhysical && availableQuantity < line.quantity) {
      issues.push(
        availableQuantity === 0
          ? `"${product.title}" está sem estoque.`
          : `"${product.title}" tem apenas ${product.stock} unidade(s) em estoque.`
      );
    }

    const quantity = Math.max(availableQuantity, 0);
    const lineTotalCents = product.priceCents * quantity;
    const rate =
      product.taxRateBasisPoints > 0
        ? product.taxRateBasisPoints
        : settings.defaultTaxBasisPoints;

    items.push({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      title: product.title,
      type,
      imageUrl: product.images[0]?.url ?? null,
      unitCents: product.priceCents,
      quantity: line.quantity,
      availableQuantity: quantity,
      lineTotalCents,
      taxCents: applyBasisPoints(lineTotalCents, rate),
      weightGrams: isPhysical ? product.weightGrams * quantity : 0,
      stock: product.stock,
      outOfStock: isPhysical && product.stock <= 0,
    });
  }

  const billable = items.filter((item) => item.availableQuantity > 0);

  return {
    items,
    itemCount: billable.reduce((sum, item) => sum + item.availableQuantity, 0),
    subtotalCents: billable.reduce((sum, item) => sum + item.lineTotalCents, 0),
    taxCents: billable.reduce((sum, item) => sum + item.taxCents, 0),
    weightGrams: billable.reduce((sum, item) => sum + item.weightGrams, 0),
    hasPhysicalItems: billable.some((item) => item.type !== "DIGITAL"),
    hasDigitalItems: billable.some((item) => item.type === "DIGITAL"),
    issues: [...new Set(issues)],
  };
}

/** Contagem leve para o ícone do carrinho no cabeçalho. */
export async function cartCount(): Promise<number> {
  const lines = await readCartCookie();
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export { MAX_QUANTITY_PER_ITEM };
