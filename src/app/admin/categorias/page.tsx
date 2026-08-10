import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { deleteCategoryAction } from "@/actions/admin";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  await requirePermission("catalog:write");

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Categorias e etiquetas
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Novas áreas do catálogo podem ser criadas aqui, sem programação; elas
          aparecem automaticamente no menu, na home e nos filtros.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink-900">{category.name}</h2>
                  <p className="text-[12.5px] text-ink-500">
                    /{category.slug} · {category._count.products} título(s)
                  </p>
                </div>
                {category._count.products === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </form>
                )}
              </div>

              <CategoryForm category={category} />
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink-900">
              Nova categoria
            </h2>
            <CategoryForm />
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Etiquetas</h2>
            <p className="mb-3 mt-1 text-[13px] text-ink-500">
              Criadas automaticamente ao cadastrar produtos.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[12.5px] text-ink-600"
                >
                  {tag.name}
                  <span className="ml-1 text-ink-400">{tag._count.products}</span>
                </span>
              ))}
              {tags.length === 0 && (
                <p className="text-[13px] text-ink-500">Nenhuma etiqueta ainda.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
