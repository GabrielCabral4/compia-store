"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import {
  createSession,
  destroySession,
  getCurrentUser,
  requireUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/logs";
import { sendEmail, welcomeEmail } from "@/lib/mail";
import {
  cepSchema,
  cpfSchema,
  emailSchema,
  fieldErrors,
  nameSchema,
  passwordSchema,
} from "@/lib/validation";
import { fail, succeed, toActionState, type ActionState } from "@/lib/action-state";
import { STAFF_ROLES, type Role } from "@/lib/constants";

/** Impede que `?next=` seja usado para redirecionar a um site externo. */
function safeNext(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    cpf: cpfSchema.optional(),
    phone: z.string().trim().max(20).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let destination: string | null = null;

  try {
    const parsed = registerSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const { name, email, cpf, phone, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail("Já existe uma conta com este e-mail.", {
        email: "E-mail já cadastrado.",
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        cpf: cpf || null,
        phone: phone || null,
        passwordHash: hashPassword(password),
        role: "CLIENTE",
      },
    });

    await createSession(user.id);
    await logActivity({
      action: "CADASTRO",
      entity: "User",
      entityId: user.id,
      detail: `Nova conta de cliente: ${email}`,
      userId: user.id,
      actorEmail: email,
    });
    await sendEmail({ to: email, ...welcomeEmail(name) });

    destination = safeNext(formData.get("next"), "/conta");
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function loginAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let destination: string | null = null;

  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return fail("Informe e-mail e senha.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && verifyPassword(password, user.passwordHash);

    if (!user || !valid) {
      await logActivity({
        action: "LOGIN_FALHOU",
        entity: "User",
        detail: `Tentativa de acesso com ${email}`,
        actorEmail: email,
      });
      return fail("E-mail ou senha incorretos.");
    }

    if (!user.active) {
      return fail("Esta conta está desativada. Fale com a administração.");
    }

    await createSession(user.id);
    await logActivity({
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      detail: `Acesso de ${user.email} (${user.role})`,
      userId: user.id,
      actorEmail: user.email,
    });

    const fallback = STAFF_ROLES.includes(user.role as Role) ? "/admin" : "/conta";
    destination = safeNext(formData.get("next"), fallback);
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await logActivity({
      action: "LOGOUT",
      entity: "User",
      entityId: user.id,
      detail: `Saída de ${user.email}`,
      userId: user.id,
      actorEmail: user.email,
    });
  }
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

// Perfil e endereços

const profileSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().max(20).optional(),
  cpf: cpfSchema.optional(),
});

export async function updateProfileAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        cpf: parsed.data.cpf || null,
      },
    });

    revalidatePath("/conta");
    revalidatePath("/", "layout");
    return succeed("Dados atualizados.");
  } catch (error) {
    return toActionState(error);
  }
}

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await requireUser();
    const parsed = passwordChangeSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
    });
    if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      return fail("Senha atual incorreta.", {
        currentPassword: "Senha atual incorreta.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(parsed.data.password) },
    });
    await logActivity({
      action: "SENHA_ALTERADA",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
    });

    return succeed("Senha alterada com sucesso.");
  } catch (error) {
    return toActionState(error);
  }
}

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Informe um apelido para o endereço."),
  recipient: nameSchema,
  cep: cepSchema,
  street: z.string().trim().min(3, "Informe o logradouro."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().max(80).optional(),
  district: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "UF inválida."),
});

export async function saveAddressAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = addressSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!parsed.success) {
      return fail("Revise os campos destacados.", fieldErrors(parsed.error));
    }

    const { id, ...data } = parsed.data;
    const payload = {
      ...data,
      complement: data.complement || null,
      state: data.state.toUpperCase(),
      userId: user.id,
    };

    const count = await prisma.address.count({ where: { userId: user.id } });

    if (id) {
      await prisma.address.updateMany({
        where: { id, userId: user.id },
        data: payload,
      });
    } else {
      await prisma.address.create({
        data: { ...payload, isDefault: count === 0 },
      });
    }

    revalidatePath("/conta/enderecos");
    revalidatePath("/checkout");
    return succeed("Endereço salvo.");
  } catch (error) {
    return toActionState(error);
  }
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/conta/enderecos");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.updateMany({
      where: { id, userId: user.id },
      data: { isDefault: true },
    }),
  ]);
  revalidatePath("/conta/enderecos");
  revalidatePath("/checkout");
}
