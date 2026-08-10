import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL } from "@/lib/constants";
import { toggleProductAction } from "@/actions/admin";
import { ProductTypeBadge } from "@/components/ui";
import { PencilIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Produtos" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminProductsPage(
  props: PageProps<"/admin/produtos">
) {
  await requirePermission("catalog:write");
  const searchParams = await props.searchParams;

  const q = first(searchParams.q).trim();
  const type = first(searchParams.tipo);
  const status = first(searchParams.situacao);
  const categoryId = first(searchParams.categoria);

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { sku: { contains: q } },
            { author: { contains: q } },
            { isbn: { contains: q } },
          ],
        }
      : {}),
    ...((PRODUCT_TYPES as readonly string[]).includes(type) ? { type } : {}),
    ...(status === "ativo" ? { active: true } : {}),
    ...(status === "inativo" ? { active: false } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, categories, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ active: "desc" }, { title: "asc" }],
      include: {
        category: { select: { name: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Produtos
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            {products.length} de {total} títulos no catálogo
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn btn-primary btn-sm">
          Novo produto
        </Link>
      </header>

      <form
        method="get"
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label className="field-label" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            className="field-input"
            defaultValue={q}
            placeholder="Título, SKU, autor ou ISBN"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="tipo">
            Formato
          </label>
          <select id="tipo" name="tipo" className="field-input" defaultValue={type}>
            <option value="">Todos</option>
            {PRODUCT_TYPES.map((option) => (
              <option key={option} value={option}>
                {PRODUCT_TYPE_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="categoria">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            className="field-input"
            defaultValue={categoryId}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="field-label" htmlFor="situacao">
              Situação
            </label>
            <select
              id="situacao"
              name="situacao"
              className="field-input"
              defaultValue={status}
            >
              <option value="">Todas</option>
              <option value="ativo">Publicados</option>
              <option value="inativo">Ocultos</option>
            </select>
          </div>
          <button type="submit" className="btn btn-dark btn-sm">
            Filtrar
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Título</th>
              <th>Formato</th>
              <th>Categoria</th>
              <th className="text-right">Preço</th>
              <th className="text-right">Estoque</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-500">
                  Nenhum produto encontrado com esses filtros.
                </td>
              </tr>
            )}

            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="h-14 w-10.5 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="block max-w-70 truncate font-medium text-ink-900 hover:text-brand-700"
                      >
                        {product.title}
                      </Link>
                      <p className="text-[12px] text-ink-400">
                        {product.sku}
                        {product.author ? ` · ${product.author}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <ProductTypeBadge type={product.type} />
                </td>
                <td className="text-ink-600">{product.category.name}</td>
                <td className="text-right font-medium">
                  {formatCents(product.priceCents)}
                </td>
                <td className="text-right">
                  {product.type === "DIGITAL" ? (
                    <span className="text-ink-400">ilimitado</span>
                  ) : (
                    <span
                      className={
                        product.stock <= 5
                          ? "font-semibold text-red-600"
                          : "text-ink-700"
                      }
                    >
                      {product.stock}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${
                      product.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-ink-200 text-ink-600"
                    }`}
                  >
                    {product.active ? "Publicado" : "Oculto"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="btn btn-ghost btn-sm"
                      aria-label={`Editar ${product.title}`}
                    >
                      <PencilIcon className="size-4" />
                    </Link>
                    <form action={toggleProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="btn btn-outline btn-sm">
                        {product.active ? "Ocultar" : "Publicar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
