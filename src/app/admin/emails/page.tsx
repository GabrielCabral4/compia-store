import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "E-mails enviados" };

export default async function AdminEmailsPage() {
  await requirePermission("logs:read");

  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Notificações por e-mail
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Mensagens automáticas enviadas aos clientes: confirmação de pedido,
          aprovação de pagamento, envio e retirada.
        </p>
      </header>

      <div
        className={`rounded-xl border px-4 py-3 text-[13.5px] ${
          smtpConfigured
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {smtpConfigured ? (
          <>
            <strong>SMTP configurado.</strong> As mensagens abaixo foram enviadas
            de verdade.
          </>
        ) : (
          <>
            <strong>SMTP não configurado.</strong> As mensagens são registradas
            aqui em vez de enviadas. Para enviar de verdade, defina{" "}
            <code>SMTP_HOST</code>, <code>SMTP_USER</code> e{" "}
            <code>SMTP_PASS</code> no arquivo <code>.env</code>.
          </>
        )}
      </div>

      <div className="space-y-3">
        {emails.length === 0 && (
          <p className="card px-5 py-10 text-center text-[14px] text-ink-500">
            Nenhuma notificação registrada ainda.
          </p>
        )}

        {emails.map((email) => (
          <details key={email.id} className="card overflow-hidden">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">
                  {email.subject}
                </p>
                <p className="text-[12.5px] text-ink-500">
                  para {email.to} · {formatDateTime(email.createdAt)}
                </p>
              </div>
              <span
                className={`badge ${
                  email.status === "ENVIADO"
                    ? "bg-emerald-100 text-emerald-800"
                    : email.status === "FALHOU"
                      ? "bg-red-100 text-red-700"
                      : "bg-ink-100 text-ink-600"
                }`}
              >
                {email.status}
              </span>
            </summary>

            <div className="border-t border-ink-100 bg-ink-50 p-4">
              {email.error && (
                <p className="mb-3 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700">
                  {email.error}
                </p>
              )}
              <div
                className="overflow-x-auto rounded-lg bg-white"
                // O conteúdo é gerado pela própria aplicação (src/lib/mail.ts),
                // a partir de modelos fixos, não há entrada de terceiros.
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
