import Link from "next/link";

import { formatCents } from "@/lib/money";
import type { ProductType } from "@/lib/constants";

import { AddToCart } from "./add-to-cart";
import { ProductTypeBadge } from "./ui";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  type: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  images: { url: string; alt: string }[];
  category: { name: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const type = product.type as ProductType;
  const isDigital = type === "DIGITAL";
  const unavailable = !isDigital && product.stock <= 0;
  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(
          ((product.compareAtCents - product.priceCents) /
            product.compareAtCents) *
            100
        )
      : 0;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <Link
        href={`/produtos/${product.slug}`}
        className="relative block aspect-3/4 overflow-hidden bg-ink-100"
      >
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || `Capa de ${product.title}`}
            className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center text-ink-400">
            sem imagem
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <ProductTypeBadge type={product.type} />
          {discount > 0 && (
            <span className="badge bg-accent-500 text-ink-950">-{discount}%</span>
          )}
        </div>

        {unavailable && (
          <div className="absolute inset-x-0 bottom-0 bg-ink-950/80 py-1.5 text-center text-[12px] font-semibold text-white">
            Esgotado
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {product.category.name}
        </p>

        <h3 className="text-[15px] font-semibold leading-snug text-ink-900">
          <Link href={`/produtos/${product.slug}`} className="hover:text-brand-700">
            {product.title}
          </Link>
        </h3>

        {product.author && (
          <p className="text-[13px] text-ink-500">{product.author}</p>
        )}

        <div className="mt-auto pt-2">
          {product.compareAtCents &&
            product.compareAtCents > product.priceCents && (
              <p className="text-[12px] text-ink-400 line-through">
                {formatCents(product.compareAtCents)}
              </p>
            )}
          <p className="text-[19px] font-bold text-ink-900">
            {formatCents(product.priceCents)}
          </p>
          <p className="mb-3 text-[12px] text-ink-500">
            {isDigital
              ? "Download imediato após o pagamento"
              : product.stock > 0
                ? `${product.stock} em estoque`
                : "Indisponível no momento"}
          </p>

          <AddToCart
            productId={product.id}
            disabled={unavailable}
            label={unavailable ? "Esgotado" : "Adicionar ao carrinho"}
            className="btn btn-dark w-full btn-sm"
          />
        </div>
      </div>
    </article>
  );
}
