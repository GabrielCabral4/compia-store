import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  await requirePermission("catalog:write");
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <nav className="text-[13px] text-ink-500">
        <Link href="/admin/produtos" className="hover:text-brand-700">
          Produtos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-800">Novo</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Cadastrar produto
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Preencha os dados do título. Nenhuma etapa exige conhecimento técnico.
        </p>
      </header>

      <ProductForm categories={categories} />
    </div>
  );
}
