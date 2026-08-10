import Link from "next/link";
import type { Metadata } from "next";

import { loadCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout-form";
import { Alert, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage() {
  const [cart, sessionUser, settings] = await Promise.all([
    loadCart(),
    getCurrentUser(),
    getSettings(),
  ]);

  if (cart.itemCount === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          title="Não há itens para finalizar"
          description="Adicione títulos ao carrinho antes de ir para o checkout."
          action={
            <Link href="/produtos" className="btn btn-primary">
              Ver o catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const [user, addresses] = sessionUser
    ? await Promise.all([
        prisma.user.findUnique({ where: { id: sessionUser.id } }),
        prisma.address.findMany({
          where: { userId: sessionUser.id },
          orderBy: [{ isDefault: "desc" }, { label: "asc" }],
        }),
      ])
    : [null, []];

  return (
    <div className="container-page py-8 lg:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Finalizar compra
      </h1>
      <p className="mt-1 text-[14px] text-ink-500">
        Confira seus dados, escolha a entrega e o pagamento.
      </p>

      {cart.issues.length > 0 && (
        <div className="mt-5 space-y-2">
          {cart.issues.map((issue) => (
            <Alert key={issue} tone="warning">
              {issue}{" "}
              <Link href="/carrinho" className="font-medium underline">
                Revisar carrinho
              </Link>
            </Alert>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CheckoutForm
          cart={cart}
          customer={
            user
              ? {
                  name: user.name,
                  email: user.email,
                  cpf: user.cpf ?? "",
                  phone: user.phone ?? "",
                }
              : null
          }
          addresses={addresses}
          pickupLabel={`${settings.pickupAddress} — ${settings.pickupHours}`}
        />
      </div>
    </div>
  );
}
