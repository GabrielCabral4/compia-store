"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { logActivity } from "@/lib/logs";
import { parseCurrencyToCents } from "@/lib/money";
import { accentFor, coverDataUri } from "@/lib/cover";
import { saveSettings } from "@/lib/settings";
import { setOrderStatus } from "@/lib/orders";
import { fieldErrors, emailSchema, nameSchema, slugify } from "@/lib/validation";
import { fail, succeed, toActionState, type ActionState } from "@/lib/action-state";
import {
  ORDER_STATUSES,
  PRODUCT_TYPES,
  ROLES,
  type OrderStatus,
} from "@/lib/constants";

// ===========================================================================
// Catálogo — produtos
// ===========================================================================

const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Informe o título."),
  subtitle: z.string().trim().max(160).optional(),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2, "Informe o código (SKU)."),
  description: z.string().trim().min(20, "Descreva a obra em pelo menos 20 caracteres."),
  type: z.enum(PRODUCT_TYPES),
  price: z.string().min(1, "Informe o preço."),
  compareAt: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  weightGrams: z.coerce.number().int().min(0).default(0),
  taxPercent: z.string().optional(),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  author: z.string().trim().max(120).optional(),
  isbn: z.string().trim().max(30).optional(),
  pages: z.string().optional(),
  edition: z.string().trim().max(40).optional(),
  year: z.string().optional(),
  language: z.string().trim().max(40).optional(),
  digitalFileName: z.string().trim().max(160).optional(),
  digitalFileUrl: z.string().trim().max(400).optional(),
  imageUrl: z.string().trim().max(400).optional(),
  tags: z.string().optional(),
  active: z.string().optional(),
  featured: z.string().optional(),
});

function optionalInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/** Garante um slug único acrescentando um sufixo quando necessário. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "titulo";
  let candidate = root;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}

export async function saveProductAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let redirectTo: string | null = null;

  try {
    const user = await assertPermission("catalog:write");
    const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const data = parsed.data;
    const priceCents = parseCurrencyToCents(data.price);
    if (priceCents === null || priceCents <= 0) {
      return fail("Preço inválido.", { price: "Informe um preço válido." });
    }

    const compareAtCents = data.compareAt
      ? parseCurrencyToCents(data.compareAt)
      : null;

    const taxRateBasisPoints = data.taxPercent
      ? Math.max(0, Math.round(Number(data.taxPercent.replace(",", ".")) * 100))
      : 0;

    const duplicateSku = await prisma.product.findUnique({
      where: { sku: data.sku },
      select: { id: true },
    });
    if (duplicateSku && duplicateSku.id !== data.id) {
      return fail("Já existe um produto com este código.", {
        sku: "Código (SKU) já utilizado.",
      });
    }

    const slug = await uniqueSlug(data.slug || data.title, data.id);
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: data.categoryId },
    });

    // Etiquetas informadas como texto livre viram registros reutilizáveis.
    const tagNames = (data.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const tagIds: string[] = [];
    for (const name of tagNames) {
      const tagSlug = slugify(name);
      if (!tagSlug) continue;
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: { slug: tagSlug, name },
        update: {},
      });
      tagIds.push(tag.id);
    }

    const payload = {
      title: data.title,
      subtitle: data.subtitle || null,
      slug,
      sku: data.sku,
      description: data.description,
      type: data.type,
      priceCents,
      compareAtCents: compareAtCents && compareAtCents > 0 ? compareAtCents : null,
      stock: data.type === "DIGITAL" ? 0 : data.stock,
      weightGrams: data.type === "DIGITAL" ? 0 : data.weightGrams,
      taxRateBasisPoints,
      categoryId: data.categoryId,
      author: data.author || null,
      isbn: data.isbn || null,
      pages: optionalInt(data.pages),
      edition: data.edition || null,
      year: optionalInt(data.year),
      language: data.language || "Português",
      digitalFileName: data.type === "DIGITAL" ? data.digitalFileName || null : null,
      digitalFileUrl: data.type === "DIGITAL" ? data.digitalFileUrl || null : null,
      active: data.active === "on",
      featured: data.featured === "on",
    };

    // Sem imagem informada, a loja gera uma capa a partir do próprio título.
    const imageUrl =
      data.imageUrl ||
      coverDataUri({
        title: data.title,
        subtitle: data.subtitle,
        author: data.author,
        category: category.name,
        accent: accentFor(category.slug),
        badge:
          data.type === "DIGITAL" ? "E-book" : data.type === "KIT" ? "Kit" : undefined,
      });

    if (data.id) {
      await prisma.product.update({ where: { id: data.id }, data: payload });
      await prisma.product.update({
        where: { id: data.id },
        data: { tags: { set: tagIds.map((id) => ({ id })) } },
      });

      const existingImage = await prisma.productImage.findFirst({
        where: { productId: data.id },
        orderBy: { position: "asc" },
      });
      if (existingImage) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { url: imageUrl, alt: `Capa de ${data.title}` },
        });
      } else {
        await prisma.productImage.create({
          data: { productId: data.id, url: imageUrl, alt: `Capa de ${data.title}` },
        });
      }

      await logActivity({
        action: "PRODUTO_ATUALIZADO",
        entity: "Product",
        entityId: data.id,
        detail: `${data.sku} — ${data.title}`,
        userId: user.id,
        actorEmail: user.email,
      });
      redirectTo = `/admin/produtos/${data.id}?salvo=1`;
    } else {
      const created = await prisma.product.create({
        data: {
          ...payload,
          tags: { connect: tagIds.map((id) => ({ id })) },
          images: { create: { url: imageUrl, alt: `Capa de ${data.title}` } },
        },
      });
      await logActivity({
        action: "PRODUTO_CRIADO",
        entity: "Product",
        entityId: created.id,
        detail: `${created.sku} — ${created.title}`,
        userId: user.id,
        actorEmail: user.email,
      });
      redirectTo = `/admin/produtos/${created.id}?salvo=1`;
    }
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath("/");
  redirect(redirectTo);
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  const user = await assertPermission("catalog:write");
  const id = String(formData.get("id") ?? "");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  await logActivity({
    action: product.active ? "PRODUTO_DESATIVADO" : "PRODUTO_ATIVADO",
    entity: "Product",
    entityId: id,
    detail: product.title,
    userId: user.id,
    actorEmail: user.email,
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const user = await assertPermission("catalog:write");
  const id = String(formData.get("id") ?? "");

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) return;

  // Produtos já vendidos são apenas desativados, para preservar o histórico.
  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    await logActivity({
      action: "PRODUTO_DESATIVADO",
      entity: "Product",
      entityId: id,
      detail: `${product.title} (possui pedidos; exclusão convertida em desativação)`,
      userId: user.id,
      actorEmail: user.email,
    });
  } else {
    await prisma.product.delete({ where: { id } });
    await logActivity({
      action: "PRODUTO_EXCLUIDO",
      entity: "Product",
      entityId: id,
      detail: product.title,
      userId: user.id,
      actorEmail: user.email,
    });
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  redirect("/admin/produtos");
}

// ===========================================================================
// Catálogo — categorias
// ===========================================================================

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome da categoria."),
  description: z.string().trim().max(240).optional(),
  position: z.coerce.number().int().min(0).default(0),
});

export async function saveCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await assertPermission("catalog:write");
    const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const { id, name, description, position } = parsed.data;
    const slug = slugify(name);

    const conflict = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) {
      return fail("Já existe uma categoria com este nome.", {
        name: "Nome já utilizado.",
      });
    }

    if (id) {
      await prisma.category.update({
        where: { id },
        data: { name, slug, description: description || null, position },
      });
    } else {
      await prisma.category.create({
        data: { name, slug, description: description || null, position },
      });
    }

    await logActivity({
      action: id ? "CATEGORIA_ATUALIZADA" : "CATEGORIA_CRIADA",
      entity: "Category",
      entityId: id ?? null,
      detail: name,
      userId: user.id,
      actorEmail: user.email,
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/produtos");
    revalidatePath("/", "layout");
    return succeed(id ? "Categoria atualizada." : "Categoria criada.");
  } catch (error) {
    return toActionState(error);
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const user = await assertPermission("catalog:write");
  const id = String(formData.get("id") ?? "");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category || category._count.products > 0) return;

  await prisma.category.delete({ where: { id } });
  await logActivity({
    action: "CATEGORIA_EXCLUIDA",
    entity: "Category",
    entityId: id,
    detail: category.name,
    userId: user.id,
    actorEmail: user.email,
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
}

// ===========================================================================
// Pedidos
// ===========================================================================

export async function updateOrderAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await assertPermission("orders:write");
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "");
    const trackingCode = String(formData.get("trackingCode") ?? "").trim();

    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      return fail("Situação inválida.");
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return fail("Pedido não encontrado.");

    if (trackingCode !== (order.trackingCode ?? "")) {
      await prisma.order.update({
        where: { id },
        data: { trackingCode: trackingCode || null },
      });
    }

    await setOrderStatus(id, status as OrderStatus, {
      trackingCode: trackingCode || null,
      actorId: user.id,
      actorEmail: user.email,
    });

    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath("/admin/pedidos");
    revalidatePath(`/pedido/${order.number}`);
    return succeed("Pedido atualizado e cliente notificado por e-mail.");
  } catch (error) {
    return toActionState(error);
  }
}

// ===========================================================================
// Usuários e perfis
// ===========================================================================

const staffSchema = z.object({
  id: z.string().optional(),
  name: nameSchema,
  email: emailSchema,
  role: z.enum(ROLES),
  password: z.string().optional(),
});

export async function saveUserAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const actor = await assertPermission("users:write");
    const parsed = staffSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const { id, name, email, role, password } = parsed.data;

    const conflict = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) {
      return fail("E-mail já cadastrado.", { email: "E-mail já cadastrado." });
    }

    if (id) {
      if (id === actor.id && role !== "ADMIN") {
        return fail("Você não pode remover o próprio acesso de administrador.");
      }
      await prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          role,
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        },
      });
    } else {
      if (!password || password.length < 8) {
        return fail("Defina uma senha com ao menos 8 caracteres.", {
          password: "Mínimo de 8 caracteres.",
        });
      }
      await prisma.user.create({
        data: { name, email, role, passwordHash: hashPassword(password) },
      });
    }

    await logActivity({
      action: id ? "USUARIO_ATUALIZADO" : "USUARIO_CRIADO",
      entity: "User",
      entityId: id ?? null,
      detail: `${email} (${role})`,
      userId: actor.id,
      actorEmail: actor.email,
    });

    revalidatePath("/admin/usuarios");
    return succeed(id ? "Usuário atualizado." : "Usuário criado.");
  } catch (error) {
    return toActionState(error);
  }
}

export async function toggleUserAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("users:write");
  const id = String(formData.get("id") ?? "");
  if (id === actor.id) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;

  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  if (user.active) {
    // Ao desativar, encerra as sessões abertas.
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  await logActivity({
    action: user.active ? "USUARIO_DESATIVADO" : "USUARIO_ATIVADO",
    entity: "User",
    entityId: id,
    detail: user.email,
    userId: actor.id,
    actorEmail: actor.email,
  });

  revalidatePath("/admin/usuarios");
}

// ===========================================================================
// Configurações da loja
// ===========================================================================

export async function saveSettingsAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await assertPermission("settings:write");
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;

    const freeShipping = parseCurrencyToCents(raw.freeShippingAbove ?? "0") ?? 0;
    const shippingBase = parseCurrencyToCents(raw.shippingBase ?? "0") ?? 0;
    const shippingPerKg = parseCurrencyToCents(raw.shippingPerKg ?? "0") ?? 0;
    const taxPercent = Number((raw.defaultTaxPercent ?? "0").replace(",", "."));

    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      return fail("Alíquota inválida.", {
        defaultTaxPercent: "Informe um percentual entre 0 e 100.",
      });
    }

    await saveSettings({
      storeName: raw.storeName?.trim() || "COMPIA Editora",
      storeEmail: raw.storeEmail?.trim() || "",
      storePhone: raw.storePhone?.trim() || "",
      storeCnpj: raw.storeCnpj?.trim() || "",
      pixKey: raw.pixKey?.trim() || "",
      pixMerchantName: raw.pixMerchantName?.trim() || "",
      pixMerchantCity: raw.pixMerchantCity?.trim() || "",
      pixExpiryMinutes: Math.max(5, Number(raw.pixExpiryMinutes) || 30),
      defaultTaxBasisPoints: Math.round(taxPercent * 100),
      freeShippingAboveCents: freeShipping,
      shippingBaseCents: shippingBase,
      shippingPerKgCents: shippingPerKg,
      pickupEnabled: raw.pickupEnabled === "on",
      pickupAddress: raw.pickupAddress?.trim() || "",
      pickupHours: raw.pickupHours?.trim() || "",
      downloadMaxPerItem: Math.max(1, Number(raw.downloadMaxPerItem) || 5),
      downloadExpiryDays: Math.max(1, Number(raw.downloadExpiryDays) || 365),
    });

    await logActivity({
      action: "CONFIGURACOES_ATUALIZADAS",
      entity: "Setting",
      detail: "Parâmetros da loja alterados pelo painel.",
      userId: user.id,
      actorEmail: user.email,
    });

    revalidatePath("/admin/configuracoes");
    revalidatePath("/", "layout");
    return succeed("Configurações salvas.");
  } catch (error) {
    return toActionState(error);
  }
}
