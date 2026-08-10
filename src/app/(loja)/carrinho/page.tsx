import Link from "next/link";
import type { Metadata } from "next";

import { loadCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { clearCartAction, removeFromCartAction } from "@/actions/cart";
import { CartQuantity } from "@/components/cart-quantity";
import { Alert, EmptyState, ProductTypeBadge } from "@/components/ui";
import { ArrowRightIcon, TrashIcon, TruckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Carrinho" };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([loadCart(), getSettings()]);

  const missingForFreeShipping =
    settings.freeShippingAboveCents - cart.subtotalCents;

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          title="Seu carrinho está vazio"
          description="Explore o catálogo da COMPIA e adicione livros, e-books ou kits."
          action={
            <Link href="/produtos" className="btn btn-primary">
              Ver o catálogo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Carrinho
      </h1>
      <p className="mt-1 text-[14px] text-ink-500">
        {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"} no carrinho
      </p>

      {cart.issues.length > 0 && (
        <div className="mt-5 space-y-2">
          {cart.issues.map((issue) => (
            <Alert key={issue} tone="warning">
              {issue}
            </Alert>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ----------------------------------------------------------- Itens */}
        <section className="card divide-y divide-ink-100">
          {cart.items.map((item) => (
            <article key={item.productId} className="flex gap-4 p-4 sm:p-5">
              <Link
                href={`/produtos/${item.slug}`}
                className="shrink-0"
                aria-label={item.title}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={`Capa de ${item.title}`}
                    className="h-28 w-21 rounded-lg object-cover sm:h-32 sm:w-24"
                  />
                ) : (
                  <div className="h-28 w-21 rounded-lg bg-ink-100 sm:h-32 sm:w-24" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <ProductTypeBadge type={item.type} />
                    <h2 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink-900">
                      <Link
                        href={`/produtos/${item.slug}`}
                        className="hover:text-brand-700"
                      >
                        {item.title}
                      </Link>
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      Código {item.sku}
                    </p>
                  </div>

                  <form action={removeFromCartAction}>
                    <input type="hidden" name="productId" value={item.productId} />
                    <button
                      type="submit"
                      className="btn btn-ghost !px-2 text-ink-400 hover:text-red-600"
                      aria-label={`Remover ${item.title} do carrinho`}
                    >
                      <TrashIcon className="size-4.5" />
                    </button>
                  </form>
                </div>

                {item.outOfStock ? (
                  <p className="mt-2 text-[13px] font-medium text-red-600">
                    Sem estoque — remova para continuar.
                  </p>
                ) : (
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                    <CartQuantity
                      productId={item.productId}
                      quantity={item.availableQuantity}
                      max={item.type === "DIGITAL" ? 5 : Math.min(item.stock, 20)}
                    />
                    <div className="text-right">
                      <p className="text-[12.5px] text-ink-500">
                        {formatCents(item.unitCents)} cada
                      </p>
                      <p className="text-[17px] font-bold text-ink-900">
                        {formatCents(item.lineTotalCents)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <Link href="/produtos" className="btn btn-outline btn-sm">
              Continuar comprando
            </Link>
            <form action={clearCartAction}>
              <button type="submit" className="btn btn-ghost btn-sm text-ink-500">
                Esvaziar carrinho
              </button>
            </form>
          </div>
        </section>

        {/* --------------------------------------------------------- Resumo */}
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">
              Resumo do pedido
            </h2>

            <dl className="mt-4 space-y-2.5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-medium text-ink-900">
                  {formatCents(cart.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Impostos estimados</dt>
                <dd className="font-medium text-ink-900">
                  {formatCents(cart.taxCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Frete</dt>
                <dd className="text-[13px] text-ink-500">
                  {cart.hasPhysicalItems
                    ? "calculado no checkout"
                    : "não se aplica"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
              <span className="text-[15px] font-semibold text-ink-900">
                Total parcial
              </span>
              <span className="text-2xl font-bold text-ink-900">
                {formatCents(cart.subtotalCents + cart.taxCents)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="btn btn-primary mt-4 w-full"
              aria-disabled={cart.itemCount === 0}
            >
              Finalizar compra
              <ArrowRightIcon className="size-4.5" />
            </Link>

            {cart.hasPhysicalItems && missingForFreeShipping > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-[12.5px] text-brand-800">
                <TruckIcon className="mt-0.5 size-4 shrink-0" />
                Faltam {formatCents(missingForFreeShipping)} para você ganhar frete
                grátis no PAC.
              </p>
            )}

            {cart.hasDigitalItems && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
                Os e-books deste pedido ficam disponíveis para download assim que o
                pagamento for aprovado.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
