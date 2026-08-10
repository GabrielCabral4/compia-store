"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  MAX_QUANTITY_PER_ITEM,
  readCartCookie,
  writeCartCookie,
} from "@/lib/cart";
import { fail, succeed, toActionState, type ActionState } from "@/lib/action-state";

function refreshCartViews() {
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

export async function addToCartAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const productId = String(formData.get("productId") ?? "");
    const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));

    const product = await prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true, title: true, type: true, stock: true },
    });
    if (!product) return fail("Produto indisponível.");

    const lines = await readCartCookie();
    const existing = lines.find((line) => line.productId === productId);
    const desired = (existing?.quantity ?? 0) + quantity;

    if (product.type !== "DIGITAL" && desired > product.stock) {
      return fail(
        product.stock === 0
          ? "Produto sem estoque no momento."
          : `Temos apenas ${product.stock} unidade(s) em estoque.`
      );
    }

    const capped = Math.min(desired, MAX_QUANTITY_PER_ITEM);
    if (existing) {
      existing.quantity = capped;
    } else {
      lines.push({ productId, quantity: capped });
    }

    await writeCartCookie(lines);
    refreshCartViews();

    return succeed(`"${product.title}" foi adicionado ao carrinho.`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function setQuantityAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  const lines = await readCartCookie();
  const next =
    quantity <= 0
      ? lines.filter((line) => line.productId !== productId)
      : lines.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
            : line
        );

  await writeCartCookie(next);
  refreshCartViews();
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const lines = await readCartCookie();
  await writeCartCookie(lines.filter((line) => line.productId !== productId));
  refreshCartViews();
}

export async function clearCartAction(): Promise<void> {
  await writeCartCookie([]);
  refreshCartViews();
}
