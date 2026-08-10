"use client";

import Link from "next/link";
import { useState } from "react";

import { saveProductAction } from "@/actions/admin";
import { useActionForm } from "../use-action-form";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL, type ProductType } from "@/lib/constants";

import { SubmitButton } from "../submit-button";
import { Alert, Field } from "../ui";

type ProductFormData = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  sku: string;
  description: string;
  type: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  weightGrams: number;
  taxRateBasisPoints: number;
  categoryId: string;
  author: string | null;
  isbn: string | null;
  pages: number | null;
  edition: string | null;
  year: number | null;
  language: string;
  digitalFileName: string | null;
  digitalFileUrl: string | null;
  active: boolean;
  featured: boolean;
  tags: { name: string }[];
  images: { url: string }[];
};

function decimal(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormData;
  categories: { id: string; name: string }[];
}) {
  const { state, pending, onSubmit, action } = useActionForm(saveProductAction);
  const [type, setType] = useState<ProductType>(
    (product?.type as ProductType) ?? "FISICO"
  );

  const errors = state?.errors ?? {};
  const isDigital = type === "DIGITAL";

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state && !state.ok && <Alert tone="error">{state.message}</Alert>}

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Informações principais
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Título" name="title" error={errors.title}>
              <input
                id="title"
                name="title"
                className="field-input"
                defaultValue={product?.title ?? ""}
                required
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Subtítulo" name="subtitle" error={errors.subtitle}>
              <input
                id="subtitle"
                name="subtitle"
                className="field-input"
                defaultValue={product?.subtitle ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Código (SKU)"
            name="sku"
            error={errors.sku}
            hint="Identificador interno único."
          >
            <input
              id="sku"
              name="sku"
              className="field-input"
              defaultValue={product?.sku ?? ""}
              required
            />
          </Field>

          <Field
            label="Endereço na loja (slug)"
            name="slug"
            error={errors.slug}
            hint="Deixe em branco para gerar a partir do título."
          >
            <input
              id="slug"
              name="slug"
              className="field-input"
              defaultValue={product?.slug ?? ""}
            />
          </Field>

          <Field label="Formato" name="type" error={errors.type}>
            <select
              id="type"
              name="type"
              className="field-input"
              value={type}
              onChange={(event) => setType(event.target.value as ProductType)}
            >
              {PRODUCT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {PRODUCT_TYPE_LABEL[option]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Categoria" name="categoryId" error={errors.categoryId}>
            <select
              id="categoryId"
              name="categoryId"
              className="field-input"
              defaultValue={product?.categoryId ?? categories[0]?.id}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Descrição" name="description" error={errors.description}>
              <textarea
                id="description"
                name="description"
                rows={6}
                className="field-input"
                defaultValue={product?.description ?? ""}
                required
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Etiquetas"
              name="tags"
              hint="Separe por vírgulas. Etiquetas novas são criadas automaticamente."
            >
              <input
                id="tags"
                name="tags"
                className="field-input"
                defaultValue={product?.tags.map((tag) => tag.name).join(", ") ?? ""}
                placeholder="machine-learning, iniciante, universitario"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Preço, estoque e impostos
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Preço (R$)" name="price" error={errors.price}>
            <input
              id="price"
              name="price"
              className="field-input"
              inputMode="decimal"
              defaultValue={decimal(product?.priceCents)}
              placeholder="129,90"
              required
            />
          </Field>

          <Field
            label="Preço de comparação"
            name="compareAt"
            hint="Opcional, exibido riscado."
          >
            <input
              id="compareAt"
              name="compareAt"
              className="field-input"
              inputMode="decimal"
              defaultValue={decimal(product?.compareAtCents)}
            />
          </Field>

          <Field
            label="Imposto (%)"
            name="taxPercent"
            hint="0 usa a alíquota padrão da loja."
          >
            <input
              id="taxPercent"
              name="taxPercent"
              className="field-input"
              inputMode="decimal"
              defaultValue={
                product ? String(product.taxRateBasisPoints / 100).replace(".", ",") : "9"
              }
            />
          </Field>

          <Field
            label="Estoque"
            name="stock"
            hint={isDigital ? "E-books não controlam estoque." : undefined}
          >
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              className="field-input"
              defaultValue={product?.stock ?? 0}
              disabled={isDigital}
            />
          </Field>

          <Field
            label="Peso (gramas)"
            name="weightGrams"
            hint={isDigital ? "Não se aplica." : "Usado no cálculo do frete."}
          >
            <input
              id="weightGrams"
              name="weightGrams"
              type="number"
              min={0}
              className="field-input"
              defaultValue={product?.weightGrams ?? 500}
              disabled={isDigital}
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Dados bibliográficos
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Autoria" name="author">
            <input
              id="author"
              name="author"
              className="field-input"
              defaultValue={product?.author ?? ""}
            />
          </Field>
          <Field label="ISBN" name="isbn">
            <input
              id="isbn"
              name="isbn"
              className="field-input"
              defaultValue={product?.isbn ?? ""}
            />
          </Field>
          <Field label="Edição" name="edition">
            <input
              id="edition"
              name="edition"
              className="field-input"
              defaultValue={product?.edition ?? ""}
            />
          </Field>
          <Field label="Páginas" name="pages">
            <input
              id="pages"
              name="pages"
              type="number"
              min={0}
              className="field-input"
              defaultValue={product?.pages ?? ""}
            />
          </Field>
          <Field label="Ano" name="year">
            <input
              id="year"
              name="year"
              type="number"
              className="field-input"
              defaultValue={product?.year ?? ""}
            />
          </Field>
          <Field label="Idioma" name="language">
            <input
              id="language"
              name="language"
              className="field-input"
              defaultValue={product?.language ?? "Português"}
            />
          </Field>
        </div>
      </section>

      {isDigital && (
        <section className="card p-5">
          <h2 className="mb-1 text-[15px] font-bold text-ink-900">
            Entrega do e-book
          </h2>
          <p className="mb-4 text-[13px] text-ink-500">
            O arquivo é entregue por link com token gerado após o pagamento. Use
            um caminho dentro de <code>storage/ebooks/</code> ou uma URL completa
            (armazenamento externo).
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do arquivo" name="digitalFileName">
              <input
                id="digitalFileName"
                name="digitalFileName"
                className="field-input"
                defaultValue={product?.digitalFileName ?? ""}
                placeholder="meu-ebook.pdf"
              />
            </Field>
            <Field label="Caminho ou URL do arquivo" name="digitalFileUrl">
              <input
                id="digitalFileUrl"
                name="digitalFileUrl"
                className="field-input"
                defaultValue={product?.digitalFileUrl ?? ""}
                placeholder="storage/ebooks/meu-ebook.pdf"
              />
            </Field>
          </div>
        </section>
      )}

      <section className="card p-5">
        <h2 className="mb-1 text-[15px] font-bold text-ink-900">Capa e exibição</h2>
        <p className="mb-4 text-[13px] text-ink-500">
          Sem imagem informada, a loja gera automaticamente uma capa a partir do
          título, do autor e da categoria.
        </p>

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div className="space-y-4">
            <Field label="URL da imagem de capa" name="imageUrl">
              <input
                id="imageUrl"
                name="imageUrl"
                className="field-input"
                defaultValue={
                  product?.images[0]?.url.startsWith("data:")
                    ? ""
                    : (product?.images[0]?.url ?? "")
                }
                placeholder="/covers/meu-livro.svg ou https://…"
              />
            </Field>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-[14px] text-ink-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={product?.active ?? true}
                  className="size-4 accent-brand-600"
                />
                Publicado na loja
              </label>
              <label className="flex items-center gap-2 text-[14px] text-ink-700">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product?.featured ?? false}
                  className="size-4 accent-brand-600"
                />
                Destaque na página inicial
              </label>
            </div>
          </div>

          {product?.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0].url}
              alt="Capa atual"
              className="h-44 w-33 rounded-lg border border-ink-200 object-cover"
            />
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending} className="btn btn-primary" pendingLabel="Salvando…">
          {product ? "Salvar alterações" : "Cadastrar produto"}
        </SubmitButton>
        <Link href="/admin/produtos" className="btn btn-outline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
