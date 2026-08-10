import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "./prisma";
import { randomToken } from "./crypto";
import type { Role } from "./constants";

export const SESSION_COOKIE = "compia_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// ---------------------------------------------------------------------------
// Permissões por perfil
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  "admin:access": ["ADMIN", "EDITOR", "VENDEDOR"],
  "catalog:write": ["ADMIN", "EDITOR"],
  "orders:write": ["ADMIN", "VENDEDOR"],
  "customers:read": ["ADMIN", "VENDEDOR"],
  "users:write": ["ADMIN"],
  "settings:write": ["ADMIN"],
  "logs:read": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(
  user: Pick<SessionUser, "role"> | null,
  permission: Permission
): boolean {
  if (!user) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(user.role);
}

// ---------------------------------------------------------------------------
// Ciclo de vida da sessão
// ---------------------------------------------------------------------------

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Usuário da requisição atual, ou null. Memoizado por requisição para que
 * vários componentes possam chamar sem consultas repetidas.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
  };
});

export async function requireUser(redirectTo = "/conta/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Exige uma permissão; redireciona para o login ou para /admin/sem-acesso. */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/conta/login?next=/admin`);
  if (!can(user, permission)) redirect("/admin/sem-acesso");
  return user;
}

/** Versão para Server Actions: lança erro em vez de redirecionar. */
export async function assertPermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Faça login para continuar.");
  if (!can(user, permission)) {
    throw new Error("Seu perfil não tem permissão para esta operação.");
  }
  return user;
}
