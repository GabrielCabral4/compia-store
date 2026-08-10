import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PasswordForm, ProfileForm } from "@/components/profile-forms";

export const metadata: Metadata = { title: "Dados e senha" };

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Dados e senha
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Mantenha seus dados atualizados para agilizar o checkout.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">Dados pessoais</h2>
        <ProfileForm
          profile={{
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone,
          }}
        />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">Alterar senha</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
