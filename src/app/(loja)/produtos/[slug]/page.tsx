import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { formatCents, formatPercentFromBasisPoints } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { PRODUCT_TYPE_LABEL, type ProductType } from "@/lib/constants";
import { installmentOptions } from "@/lib/cards";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { ShippingCalculator } from "@/components/shipping-calculator";
import { ProductTypeBadge, SectionHeading } from "@/components/ui";
import { BookIcon, DownloadIcon, ShieldIcon } from "@/components/icons";

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      tags: true,
      images: { orderBy: { position: "asc" } },
      kitItems: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              title: true,
              author: true,
              priceCents: true,
              images: { take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata(
  props: PageProps<"/produtos/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    select: { title: true, subtitle: true, description: true },
  });

  if (!product) return { title: "Título não encontrado" };

  return {
    title: product.title,
    description: product.subtitle ?? product.description.slice(0, 155),
  };
}

export default async function ProductPage(props: PageProps<"/produtos/[slug]">) {
  const { slug } = await props.params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);

  if (!product) notFound();

  const type = product.type as ProductType;
  const isDigital = type === "DIGITAL";
  const available = isDigital || product.stock > 0;
  const installments = installmentOptions(product.priceCents);
  const bestInstallment = installments[installments.length - 1];
  const taxRate =
    product.taxRateBasisPoints > 0
      ? product.taxRateBasisPoints
      : settings.defaultTaxBasisPoints;

  const related = await prisma.product.findMany({
    where: {
      active: true,
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      author: true,
      type: true,
      priceCents: true,
      compareAtCents: true,
      stock: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  const specs: Array<[string, string | null]> = [
    ["Formato", PRODUCT_TYPE_LABEL[type]],
    ["Autoria", product.author],
    ["Editora", settings.storeName],
    ["Edição", product.edition],
    ["Ano", product.year ? String(product.year) : null],
    ["Páginas", product.pages ? String(product.pages) : null],
    ["Idioma", product.language],
    ["ISBN", product.isbn],
    ["Código (SKU)", product.sku],
    [
      "Peso",
      type === "DIGITAL"
        ? "Arquivo digital"
        : `${(product.weightGrams / 1000).toLocaleString("pt-BR")} kg`,
    ],
  ];

  return (
    <div className="container-page py-8 lg:py-10">
      <nav aria-label="Trilha" className="mb-5 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/produtos" className="hover:text-brand-700">
          Catálogo
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/produtos?categoria=${product.category.slug}`}
          className="hover:text-brand-700"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
        {/* ------------------------------------------------------------ Capa */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <div className="card overflow-hidden">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt || `Capa de ${product.title}`}
                className="aspect-3/4 w-full object-cover"
              />
            ) : (
              <div className="grid aspect-3/4 place-items-center bg-ink-100 text-ink-400">
                sem imagem
              </div>
            )}
          </div>

          <div className="mt-4 hidden lg:block">
            <ShippingCalculator
              weightGrams={product.weightGrams}
              subtotalCents={product.priceCents}
            />
          </div>
        </div>

        {/* --------------------------------------------------------- Detalhes */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ProductTypeBadge type={product.type} />
            <Link
              href={`/produtos?categoria=${product.category.slug}`}
              className="badge bg-ink-100 text-ink-600 hover:bg-ink-200"
            >
              {product.category.name}
            </Link>
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink-900">
            {product.title}
          </h1>

          {product.subtitle && (
            <p className="mt-2 text-[16px] text-ink-600">{product.subtitle}</p>
          )}

          {product.author && (
            <p className="mt-3 text-[14px] text-ink-500">
              por <span className="font-medium text-ink-700">{product.author}</span>
            </p>
          )}

          {/* ------------------------------------------------------- Compra */}
          <div className="card mt-6 p-5">
            {product.compareAtCents &&
              product.compareAtCents > product.priceCents && (
                <p className="text-[13px] text-ink-400">
                  De{" "}
                  <span className="line-through">
                    {formatCents(product.compareAtCents)}
                  </span>{" "}
                  por
                </p>
              )}

            <p className="text-3xl font-bold text-ink-900">
              {formatCents(product.priceCents)}
            </p>

            {bestInstallment && bestInstallment.count > 1 && (
              <p className="mt-1 text-[13.5px] text-ink-600">
                ou {bestInstallment.label} no cartão
              </p>
            )}

            <p className="mt-1 text-[12.5px] text-ink-500">
              Preço com {formatPercentFromBasisPoints(taxRate)} de impostos
              destacados no resumo do pedido.
            </p>

            <div className="mt-4">
              <AddToCart
                productId={product.id}
                withQuantity
                disabled={!available}
                maxQuantity={isDigital ? 5 : Math.min(product.stock, 20)}
                label={available ? "Adicionar ao carrinho" : "Indisponível"}
              />
            </div>

            <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-[13px] text-ink-600">
              <li className="flex items-center gap-2">
                {isDigital ? (
                  <DownloadIcon className="size-4.5 text-brand-600" />
                ) : (
                  <BookIcon className="size-4.5 text-brand-600" />
                )}
                {isDigital
                  ? "Link de download liberado automaticamente após a aprovação do pagamento."
                  : `${product.stock} unidade(s) em estoque — envio pelos Correios, transportadora ou retirada no local.`}
              </li>
              <li className="flex items-center gap-2">
                <ShieldIcon className="size-4.5 text-brand-600" />
                Pagamento por PIX ou cartão em ambiente de testes seguro.
              </li>
            </ul>
          </div>

          <div className="mt-4 lg:hidden">
            <ShippingCalculator
              weightGrams={product.weightGrams}
              subtotalCents={product.priceCents}
            />
          </div>

          {/* --------------------------------------------- Conteúdo do kit */}
          {product.kitItems.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink-900">
                O que vem neste kit
              </h2>
              <ul className="mt-3 space-y-2">
                {product.kitItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/produtos/${item.product.slug}`}
                      className="card flex items-center gap-3 p-3 transition hover:border-brand-300"
                    >
                      {item.product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt}
                          className="h-16 w-12 rounded object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink-900">
                          {item.quantity}× {item.product.title}
                        </span>
                        <span className="block text-[12.5px] text-ink-500">
                          {item.product.author}
                        </span>
                      </span>
                      <span className="text-[13px] text-ink-500">
                        {formatCents(item.product.priceCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ----------------------------------------------------- Descrição */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink-900">Sobre a obra</h2>
            <div className="prose-compia mt-3 max-w-none text-[15px] text-ink-700">
              {product.description.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* ------------------------------------------------ Ficha técnica */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink-900">Ficha técnica</h2>
            <dl className="card mt-3 divide-y divide-ink-100 text-[14px]">
              {specs
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="text-right font-medium text-ink-800">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {product.tags.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-ink-500">
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/produtos?tag=${tag.slug}`}
                    className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[12.5px] text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="Da mesma área"
            description={`Outros títulos em ${product.category.name}.`}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
