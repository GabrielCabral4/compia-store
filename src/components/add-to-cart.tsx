"use client";

import { useState } from "react";

import { addToCartAction } from "@/actions/cart";
import { useActionForm } from "./use-action-form";

import { CartIcon } from "./icons";
import { SubmitButton } from "./submit-button";

type Props = {
  productId: string;
  disabled?: boolean;
  /** Mostra o seletor de quantidade (usado na página do produto). */
  withQuantity?: boolean;
  label?: string;
  className?: string;
  maxQuantity?: number;
};

export function AddToCart({
  productId,
  disabled,
  withQuantity = false,
  label = "Adicionar ao carrinho",
  className = "btn btn-primary w-full",
  maxQuantity = 20,
}: Props) {
  const { state, pending, onSubmit, action } = useActionForm(addToCartAction);
  const [quantity, setQuantity] = useState(1);

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />

      {withQuantity ? (
        <div className="flex items-stretch gap-3">
          <div className="flex items-center rounded-lg border border-ink-300 bg-white">
            <button
              type="button"
              className="px-3 py-2 text-lg leading-none text-ink-600 disabled:opacity-40"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <input
              type="number"
              name="quantity"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  Math.min(
                    maxQuantity,
                    Math.max(1, Number(event.target.value) || 1)
                  )
                )
              }
              className="w-14 border-x border-ink-200 py-2 text-center text-[15px] font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Quantidade"
            />
            <button
              type="button"
              className="px-3 py-2 text-lg leading-none text-ink-600 disabled:opacity-40"
              onClick={() =>
                setQuantity((value) => Math.min(maxQuantity, value + 1))
              }
              disabled={quantity >= maxQuantity}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Adicionando…"
            disabled={disabled}
          >
            <CartIcon className="size-4.5" />
            {label}
          </SubmitButton>
        </div>
      ) : (
        <>
          <input type="hidden" name="quantity" value={1} />
          <SubmitButton
            pending={pending}
            className={className}
            pendingLabel="Adicionando…"
            disabled={disabled}
          >
            {label}
          </SubmitButton>
        </>
      )}

      {state && (
        <p
          className={`text-[13px] ${state.ok ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
