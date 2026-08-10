import "server-only";
import { headers } from "next/headers";
import { prisma } from "./prisma";

type LogInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
  userId?: string | null;
  actorEmail?: string | null;
};

/**
 * Registra uma atividade relevante (requisito de auditoria). Nunca deve
 * interromper a operação principal, então falhas de log são silenciadas.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null;
    } catch {
      // headers() indisponível fora do ciclo de requisição.
    }

    await prisma.activityLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
        userId: input.userId ?? null,
        actorEmail: input.actorEmail ?? null,
        ip,
      },
    });
  } catch (error) {
    console.error("[log] falha ao registrar atividade:", error);
  }
}
