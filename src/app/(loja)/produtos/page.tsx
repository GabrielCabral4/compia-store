import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseCurrencyToCents } from "@/lib/money";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL, type ProductType } from "@/lib/constants";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todos os livros, e-books e kits publicados pela COMPIA Editora, com filtros por categoria, formato, etiqueta e faixa de preço.",
};

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "lancamentos", label: "Lançamentos" },
  { value: "titulo", label: "Título (A–Z)" },
] as const;

function orderFor(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "menor-preco":
      return [{ priceCents: "asc" }];
    case "maior-preco":
      return [{ priceCents: "desc" }];
    case "lancamentos":
      return [{ year: "desc" }, { createdAt: "desc" }];
    case "titulo":
      return [{ title: "asc" }];
    default:
      return [{ featured: "desc" }, { createdAt: "asc" }];
  }
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function all(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export default async function CatalogPage(props: PageProps<"/produtos">) {
  const searchParams = await props.searchParams;

  const q = first(searchParams.q).trim();
  const categorySlugs = all(searchParams.categoria);
  const tagSlugs = all(searchParams.tag);
  const types = all(searchParams.tipo).filter((type) =>
    (PRODUCT_TYPES as readonly string[]).includes(type)
  );
  const sort = first(searchParams.ordenar) || "relevancia";
  const page = Math.max(1, Number(first(searchParams.pagina)) || 1);
  const minCents = parseCurrencyToCents(first(searchParams.min));
  const maxCents = parseCurrencyToCents(first(searchParams.max));

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { subtitle: { contains: q } },
            { description: { contains: q } },
            { author: { contains: q } },
            { isbn: { contains: q } },
            { sku: { contains: q } },
          ],
        }
      : {}),
    ...(categorySlugs.length ? { category: { slug: { in: categorySlugs } } } : {}),
    ...(tagSlugs.length ? { tags: { some: { slug: { in: tagSlugs } } } } : {}),
    ...(types.length ? { type: { in: types } } : {}),
    ...(minCents !== null || maxCents !== null
      ? {
          priceCents: {
            ...(minCents !== null ? { gte: minCents } : {}),
            ...(maxCents !== null ? { lte: maxCents } : {}),
          },
        }
      : {}),
  };

  const [products, total, categories, tags] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderFor(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    categorySlugs.forEach((slug) => params.append("categoria", slug));
    tagSlugs.forEach((slug) => params.append("tag", slug));
    types.forEach((type) => params.append("tipo", type));
    if (sort !== "relevancia") params.set("ordenar", sort);
    if (first(searchParams.min)) params.set("min", first(searchParams.min));
    if (first(searchParams.max)) params.set("max", first(searchParams.max));
    if (target > 1) params.set("pagina", String(target));
    const query = params.toString();
    return query ? `/produtos?${query}` : "/produtos";
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <nav aria-label="Trilha" className="mb-4 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">Catálogo</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {q ? `Resultados para “${q}”` : "Catálogo COMPIA"}
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {total === 0
            ? "Nenhum título encontrado."
            : `${total} ${total === 1 ? "título encontrado" : "títulos encontrados"}`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* -------------------------------------------------------- Filtros */}
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-ink-500">
              Filtrar
            </h2>

            <CatalogFilters>
              <div>
                <label className="field-label" htmlFor="filtro-q">
                  Busca
                </label>
                <input
                  id="filtro-q"
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Título, autor, ISBN…"
                  className="field-input"
                />
              </div>

              <fieldset>
                <legend className="field-label">Categoria</legend>
                <div className="space-y-1.5">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-[13.5px] text-ink-700"
                    >
                      <input
                        type="checkbox"
                        name="categoria"
                        value={category.slug}
                        defaultChecked={categorySlugs.includes(category.slug)}
                        className="size-4 rounded border-ink-300 accent-brand-600"
                      />
                      <span className="flex-1">{category.name}</span>
                      <span className="text-[12px] text-ink-400">
                        {category._count.products}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="field-label">Formato</legend>
                <div className="space-y-1.5">
                  {PRODUCT_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-[13.5px] text-ink-700"
                    >
                      <input
                        type="checkbox"
                        name="tipo"
                        value={type}
                        defaultChecked={types.includes(type)}
                        className="size-4 rounded border-ink-300 accent-brand-600"
                      />
                      {PRODUCT_TYPE_LABEL[type as ProductType]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="field-label">Preço (R$)</legend>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="min"
                    inputMode="decimal"
                    defaultValue={first(searchParams.min)}
                    placeholder="mín."
                    className="field-input"
                    aria-label="Preço mínimo"
                  />
                  <span className="text-ink-400">–</span>
                  <input
                    type="text"
                    name="max"
                    inputMode="decimal"
                    defaultValue={first(searchParams.max)}
                    placeholder="máx."
                    className="field-input"
                    aria-label="Preço máximo"
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend className="field-label">Etiquetas</legend>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const checked = tagSlugs.includes(tag.slug);
                    return (
                      <label
                        key={tag.id}
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-[12.5px] transition ${
                          checked
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-ink-200 bg-ink-50 text-ink-600 hover:border-ink-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="tag"
                          value={tag.slug}
                          defaultChecked={checked}
                          className="sr-only"
                        />
                        {tag.name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label className="field-label" htmlFor="filtro-ordenar">
                  Ordenar por
                </label>
                <select
                  id="filtro-ordenar"
                  name="ordenar"
                  defaultValue={sort}
                  className="field-input"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </CatalogFilters>
          </div>
        </aside>

        {/* -------------------------------------------------------- Resultados */}
        <section>
          {products.length === 0 ? (
            <EmptyState
              title="Nenhum título corresponde aos filtros"
              description="Tente remover algum filtro ou buscar por outro termo."
              action={
                <Link href="/produtos" className="btn btn-primary btn-sm">
                  Limpar filtros
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-center gap-1.5"
                  aria-label="Paginação"
                >
                  {page > 1 && (
                    <Link href={pageHref(page - 1)} className="btn btn-outline btn-sm">
                      Anterior
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (target) => (
                      <Link
                        key={target}
                        href={pageHref(target)}
                        aria-current={target === page ? "page" : undefined}
                        className={`btn btn-sm ${
                          target === page ? "btn-dark" : "btn-outline"
                        }`}
                      >
                        {target}
                      </Link>
                    )
                  )}
                  {page < totalPages && (
                    <Link href={pageHref(page + 1)} className="btn btn-outline btn-sm">
                      Próxima
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
