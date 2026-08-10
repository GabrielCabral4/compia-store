import Link from "next/link";
import type { Metadata } from "next";

import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import {
  CardIcon,
  DownloadIcon,
  PixIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Sobre a editora",
  description:
    "A COMPIA Editora publica livros, revistas e materiais digitais sobre inteligência artificial, unindo rigor técnico e linguagem acessível.",
};

export default async function AboutPage() {
  const [settings, categories, productCount] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.product.count({ where: { active: true } }),
  ]);

  return (
    <div>
      <section className="bg-ink-950 py-14 text-white">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            A {settings.storeName}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/75">
            A COMPIA Editora é uma iniciativa voltada para a publicação e
            disseminação de conteúdos de alta qualidade na área de Inteligência
            Artificial. Publicamos livros, revistas e materiais digitais que
            ajudam estudantes e profissionais a aprofundar seus conhecimentos em
            arquitetura de software inteligente, inteligência artificial,
            blockchain, criptografia e cibersegurança.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-white/75">
            Além de obras autorais e traduções de relevância internacional,
            valorizamos autores nacionais e incentivamos a produção de
            conhecimento local e atualizado — sendo parceira estratégica de
            instituições de ensino, pesquisadores e profissionais de TI.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-6 py-12 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Como compramos aqui</h2>
          <ul className="mt-4 space-y-3 text-[14px] text-ink-600">
            <li className="flex gap-3">
              <CardIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              Cartão de crédito das principais bandeiras (Visa, MasterCard, Elo,
              Hipercard, Amex e Diners), em até 12x sem juros.
            </li>
            <li className="flex gap-3">
              <PixIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              PIX com QR Code e chave aleatória, no padrão do Banco Central.
            </li>
            <li className="flex gap-3">
              <ShieldIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              Todo acesso administrativo é registrado em log de atividades.
            </li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Formas de entrega</h2>
          <ul className="mt-4 space-y-3 text-[14px] text-ink-600">
            <li className="flex gap-3">
              <TruckIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              Correios (PAC e SEDEX) e transportadora, com frete e prazo
              calculados pelo CEP. Frete grátis acima de{" "}
              {formatCents(settings.freeShippingAboveCents)}.
            </li>
            <li className="flex gap-3">
              <StoreIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              Retirada no local: {settings.pickupAddress} ({settings.pickupHours}).
            </li>
            <li className="flex gap-3">
              <DownloadIcon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              E-books com link de download liberado automaticamente após o
              pagamento.
            </li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Contato</h2>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div>
              <dt className="text-ink-500">E-mail</dt>
              <dd className="font-medium text-ink-900">{settings.storeEmail}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Telefone</dt>
              <dd className="font-medium text-ink-900">{settings.storePhone}</dd>
            </div>
            <div>
              <dt className="text-ink-500">CNPJ</dt>
              <dd className="font-medium text-ink-900">{settings.storeCnpj}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Endereço</dt>
              <dd className="text-ink-800">{settings.pickupAddress}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">
            Nosso catálogo — {productCount} títulos
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/produtos?categoria=${category.slug}`}
                className="rounded-xl border border-ink-200 p-4 transition hover:border-brand-300"
              >
                <p className="font-semibold text-ink-900">{category.name}</p>
                <p className="mt-1 text-[13px] text-ink-500">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
