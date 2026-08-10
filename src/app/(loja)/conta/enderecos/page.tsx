import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCep } from "@/lib/shipping";
import { deleteAddressAction, setDefaultAddressAction } from "@/actions/auth";
import { AddressForm } from "@/components/address-forms";

export const metadata: Metadata = { title: "Endereços" };

export default async function AddressesPage() {
  const user = await requireUser();

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Endereços
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Endereços salvos aparecem prontos para uso no checkout.
        </p>
      </header>

      {addresses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{address.label}</p>
                  <p className="text-[13px] text-ink-500">{address.recipient}</p>
                </div>
                {address.isDefault && (
                  <span className="badge bg-brand-100 text-brand-800">Padrão</span>
                )}
              </div>

              <address className="mt-3 text-[13.5px] not-italic leading-relaxed text-ink-700">
                {address.street}, {address.number}
                {address.complement ? ` — ${address.complement}` : ""}
                <br />
                {address.district} · {address.city}/{address.state}
                <br />
                CEP {formatCep(address.cep)}
              </address>

              <div className="mt-4 flex flex-wrap gap-2">
                {!address.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="btn btn-outline btn-sm">
                      Tornar padrão
                    </button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="card p-5">
        <h2 className="text-[15px] font-bold text-ink-900">
          Adicionar novo endereço
        </h2>
        <p className="mb-4 mt-1 text-[13.5px] text-ink-500">
          Informe o CEP para preencher o restante automaticamente.
        </p>
        <AddressForm />
      </section>
    </div>
  );
}
