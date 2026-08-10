import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Minha biblioteca" };

export default async function LibraryPage() {
  const user = await requireUser();

  const grants = await prisma.downloadGrant.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          title: true,
          subtitle: true,
          author: true,
          slug: true,
          pages: true,
          images: { take: 1, select: { url: true, alt: true } },
        },
      },
      order: { select: { number: true } },
    },
  });

  if (grants.length === 0) {
    return (
      <EmptyState
        title="Sua biblioteca está vazia"
        description="Os e-books que você comprar aparecem aqui, prontos para download, assim que o pagamento for aprovado."
        action={
          <Link href="/produtos?tipo=DIGITAL" className="btn btn-primary btn-sm">
            Ver e-books
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Minha biblioteca
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {grants.length} {grants.length === 1 ? "título" : "títulos"} disponíveis
          para download.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {grants.map((grant) => {
          const exhausted = grant.downloadCount >= grant.maxDownloads;
          const expired = grant.expiresAt < new Date();
          const blocked = exhausted || expired;

          return (
            <li key={grant.id} className="card flex gap-4 p-4">
              {grant.product.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={grant.product.images[0].url}
                  alt={grant.product.images[0].alt}
                  className="h-32 w-24 shrink-0 rounded-lg object-cover"
                />
              )}

              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-[14.5px] font-semibold leading-snug text-ink-900">
                  <Link
                    href={`/produtos/${grant.product.slug}`}
                    className="hover:text-brand-700"
                  >
                    {grant.product.title}
                  </Link>
                </h2>
                {grant.product.author && (
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    {grant.product.author}
                  </p>
                )}
                <p className="mt-1 text-[12px] text-ink-500">
                  Pedido {grant.order.number}
                </p>

                <p className="mt-auto pt-2 text-[12px] text-ink-500">
                  {grant.downloadCount}/{grant.maxDownloads} downloads ·{" "}
                  {expired ? "expirado" : `válido até ${formatDateTime(grant.expiresAt)}`}
                </p>

                <a
                  href={`/api/download/${grant.token}`}
                  className={`btn btn-sm mt-2 ${blocked ? "btn-outline" : "btn-dark"}`}
                  aria-disabled={blocked}
                >
                  <DownloadIcon className="size-4" />
                  {expired
                    ? "Link expirado"
                    : exhausted
                      ? "Limite atingido"
                      : "Baixar PDF"}
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[12.5px] leading-relaxed text-ink-500">
        Os links são pessoais e limitados a um número de downloads por título. Se
        precisar de uma nova liberação, fale com a editora.
      </p>
    </div>
  );
}
