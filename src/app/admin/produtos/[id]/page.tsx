import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { deleteProductAction } from "@/actions/admin";
import { ProductForm } from "@/components/admin/product-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage(
  props: PageProps<"/admin/produtos/[id]">
) {
  await requirePermission("catalog:write");
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        tags: true,
        images: { orderBy: { position: "asc" } },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const saved = searchParams.salvo === "1";

  return (
    <div className="space-y-6">
      <nav className="text-[13px] text-ink-500">
        <Link href="/admin/produtos" className="hover:text-brand-700">
          Produtos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">{product.title}</span>
      </nav>

      {saved && <Alert tone="success">Produto salvo com sucesso.</Alert>}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Editar produto
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            {product.sku} · {product._count.orderItems} venda(s) registrada(s)
          </p>
        </div>
        <Link
          href={`/produtos/${product.slug}`}
          className="btn btn-outline btn-sm"
          target="_blank"
        >
          Ver na loja
        </Link>
      </header>

      <ProductForm product={product} categories={categories} />

      <section className="card border-red-200 p-5">
        <h2 className="text-[15px] font-bold text-red-700">Excluir produto</h2>
        <p className="mt-1 text-[13.5px] text-ink-600">
          {product._count.orderItems > 0
            ? "Este título já foi vendido, portanto será apenas ocultado da loja; o histórico de pedidos é preservado."
            : "Esta ação não pode ser desfeita."}
        </p>
        <form action={deleteProductAction} className="mt-4">
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="btn btn-danger btn-sm">
            {product._count.orderItems > 0 ? "Ocultar da loja" : "Excluir definitivamente"}
          </button>
        </form>
      </section>
    </div>
  );
}
