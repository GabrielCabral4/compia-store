import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { formatCpf, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Clientes" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminCustomersPage(
  props: PageProps<"/admin/clientes">
) {
  await requirePermission("customers:read");
  const searchParams = await props.searchParams;
  const q = first(searchParams.q).trim();

  const where: Prisma.UserWhereInput = {
    role: "CLIENTE",
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { cpf: { contains: q } },
          ],
        }
      : {}),
  };

  const customers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { totalCents: true, status: true, createdAt: true },
      },
      _count: { select: { orders: true, downloadGrants: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Clientes</h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {customers.length} cliente(s) cadastrado(s)
        </p>
      </header>

      <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-60 flex-1">
          <label className="field-label" htmlFor="q">
            Buscar cliente
          </label>
          <input
            id="q"
            name="q"
            className="field-input"
            defaultValue={q}
            placeholder="Nome, e-mail ou CPF"
          />
        </div>
        <button type="submit" className="btn btn-dark btn-sm">
          Buscar
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>CPF</th>
              <th>Cadastro</th>
              <th className="text-right">Pedidos</th>
              <th className="text-right">Total comprado</th>
              <th className="text-right">E-books</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink-500">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}

            {customers.map((customer) => {
              const spent = customer.orders
                .filter((order) => order.status !== "CANCELADO")
                .reduce((sum, order) => sum + order.totalCents, 0);

              return (
                <tr key={customer.id}>
                  <td>
                    <p className="font-medium text-ink-900">{customer.name}</p>
                    <p className="text-[12px] text-ink-400">{customer.email}</p>
                  </td>
                  <td className="text-ink-600">{formatCpf(customer.cpf)}</td>
                  <td className="text-ink-600">{formatDate(customer.createdAt)}</td>
                  <td className="text-right">
                    <Link
                      href={`/admin/pedidos?q=${encodeURIComponent(customer.email)}`}
                      className="text-brand-700 hover:underline"
                    >
                      {customer._count.orders}
                    </Link>
                  </td>
                  <td className="text-right font-semibold">{formatCents(spent)}</td>
                  <td className="text-right text-ink-600">
                    {customer._count.downloadGrants}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
