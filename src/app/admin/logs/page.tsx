import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Logs de atividade" };

const PAGE_SIZE = 60;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminLogsPage(props: PageProps<"/admin/logs">) {
  await requirePermission("logs:read");
  const searchParams = await props.searchParams;
  const q = first(searchParams.q).trim();

  const logs = await prisma.activityLog.findMany({
    where: q
      ? {
          OR: [
            { action: { contains: q } },
            { entity: { contains: q } },
            { detail: { contains: q } },
            { actorEmail: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Logs de atividade
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Registro de acessos, alterações de catálogo, pedidos e pagamentos —
          exibindo os {PAGE_SIZE} eventos mais recentes.
        </p>
      </header>

      <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-60 flex-1">
          <label className="field-label" htmlFor="q">
            Filtrar
          </label>
          <input
            id="q"
            name="q"
            className="field-input"
            defaultValue={q}
            placeholder="Ação, entidade, detalhe ou e-mail"
          />
        </div>
        <button type="submit" className="btn btn-dark btn-sm">
          Filtrar
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>Detalhe</th>
              <th>Responsável</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}

            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-[12.5px] text-ink-500">
                  {formatDateTime(log.createdAt)}
                </td>
                <td>
                  <span className="badge bg-ink-100 text-ink-700">
                    {log.action}
                  </span>
                </td>
                <td className="text-[13px] text-ink-600">{log.entity}</td>
                <td className="max-w-90 text-[13px] text-ink-700">
                  {log.detail ?? "—"}
                </td>
                <td className="text-[12.5px] text-ink-600">
                  {log.actorEmail ?? "sistema"}
                </td>
                <td className="font-mono text-[11.5px] text-ink-400">
                  {log.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
