"use client";

import { useTransition } from "react";

import { setQuantityAction } from "@/actions/cart";

/** Controle de quantidade de um item do carrinho. */
export function CartQuantity({
  productId,
  quantity,
  max,
}: {
  productId: string;
  quantity: number;
  max: number;
}) {
  const [pending, startTransition] = useTransition();

  const update = (next: number) => {
    const data = new FormData();
    data.set("productId", productId);
    data.set("quantity", String(next));
    startTransition(() => {
      void setQuantityAction(data);
    });
  };

  return (
    <div
      className="inline-flex items-center rounded-lg border border-ink-300 bg-white"
      aria-busy={pending}
    >
      <button
        type="button"
        onClick={() => update(quantity - 1)}
        disabled={pending || quantity <= 1}
        className="px-3 py-1.5 text-lg leading-none text-ink-600 disabled:opacity-40"
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span className="min-w-10 border-x border-ink-200 px-2 py-1.5 text-center text-[14px] font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => update(quantity + 1)}
        disabled={pending || quantity >= max}
        className="px-3 py-1.5 text-lg leading-none text-ink-600 disabled:opacity-40"
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}
