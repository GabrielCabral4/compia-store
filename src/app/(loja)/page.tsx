import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  DownloadIcon,
  PixIcon,
  TruckIcon,
} from "@/components/icons";

const productSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  author: true,
  type: true,
  priceCents: true,
  compareAtCents: true,
  stock: true,
  images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
  category: { select: { name: true, slug: true } },
} as const;

export default async function HomePage() {
  const [featured, latest, ebooks, categories, settings, productCount] =
    await Promise.all([
      prisma.product.findMany({
        where: { active: true, featured: true },
        select: productSelect,
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      prisma.product.findMany({
        where: { active: true },
        select: productSelect,
        orderBy: { year: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: { active: true, type: "DIGITAL" },
        select: productSelect,
        take: 4,
      }),
      prisma.category.findMany({
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      getSettings(),
      prisma.product.count({ where: { active: true } }),
    ]);

  const hero = featured[0];

  return (
    <div className="pb-16">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="bg-ink-950 text-white">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-medium text-brand-200">
              <BookIcon className="size-4" />
              {productCount} títulos publicados
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Conhecimento em{" "}
              <span className="text-brand-300">Inteligência Artificial</span> com
              rigor técnico e linguagem acessível
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70">
              Livros físicos, e-books e kits sobre IA, arquitetura de software
              inteligente, blockchain, criptografia e cibersegurança — publicados
              pela {settings.storeName} para estudantes, pesquisadores e
              profissionais.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produtos" className="btn btn-primary">
                Ver o catálogo
                <ArrowRightIcon className="size-4.5" />
              </Link>
              <Link
                href="/produtos?tipo=DIGITAL"
                className="btn border-white/25 text-white hover:bg-white/10"
              >
                <DownloadIcon className="size-4.5" />
                E-books com entrega imediata
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[13px]">
              <div>
                <dt className="text-white/50">Frete grátis</dt>
                <dd className="mt-0.5 font-semibold">
                  acima de {formatCents(settings.freeShippingAboveCents)}
                </dd>
              </div>
              <div>
                <dt className="text-white/50">Pagamento</dt>
                <dd className="mt-0.5 font-semibold">PIX ou cartão em 12x</dd>
              </div>
              <div>
                <dt className="text-white/50">Retirada</dt>
                <dd className="mt-0.5 font-semibold">Campina Grande/PB</dd>
              </div>
            </dl>
          </div>

          {hero && (
            <Link
              href={`/produtos/${hero.slug}`}
              className="group relative mx-auto w-full max-w-sm"
            >
              <div className="absolute -inset-4 rounded-3xl bg-brand-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
                {hero.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hero.images[0].url}
                    alt={hero.images[0].alt}
                    className="aspect-3/4 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <div className="relative mt-5 rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
                  Destaque da editora
                </p>
                <p className="mt-1 font-semibold leading-snug">{hero.title}</p>
                <p className="mt-1 text-[13px] text-white/60">{hero.author}</p>
                <p className="mt-2 text-lg font-bold">
                  {formatCents(hero.priceCents)}
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- Categorias */}
      <section className="container-page py-12">
        <SectionHeading
          title="Navegue por área"
          description="O catálogo é organizado em categorias e etiquetas — novas áreas podem ser criadas pelo painel, sem programação."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              className="card flex items-start justify-between gap-4 p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <h3 className="font-semibold text-ink-900">{category.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  {category.description}
                </p>
                <p className="mt-2 text-[12px] font-medium text-brand-600">
                  {category._count.products}{" "}
                  {category._count.products === 1 ? "título" : "títulos"}
                </p>
              </div>
              <ArrowRightIcon className="mt-1 size-5 shrink-0 text-ink-300" />
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- Destaques */}
      {featured.length > 0 && (
        <section className="container-page py-6">
          <SectionHeading
            title="Destaques da COMPIA"
            description="Seleção da equipe editorial para esta campanha."
            action={
              <Link href="/produtos" className="btn btn-outline btn-sm">
                Ver tudo
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- Faixa */}
      <section className="container-page py-10">
        <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-200 sm:grid-cols-3">
          {[
            {
              icon: <TruckIcon className="size-6" />,
              title: "Entrega como você preferir",
              text: "PAC, SEDEX, transportadora ou retirada na editora, com prazo calculado pelo CEP.",
            },
            {
              icon: <PixIcon className="size-6" />,
              title: "PIX em segundos",
              text: "QR Code gerado no padrão do Banco Central, com chave aleatória da editora.",
            },
            {
              icon: <DownloadIcon className="size-6" />,
              title: "E-book na hora",
              text: "Link de download liberado automaticamente assim que o pagamento é aprovado.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <span className="mt-0.5 text-brand-600">{feature.icon}</span>
              <div>
                <p className="font-semibold text-ink-900">{feature.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                  {feature.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Ebooks */}
      {ebooks.length > 0 && (
        <section className="container-page py-6">
          <SectionHeading
            title="E-books e revistas"
            description="Entrega automática por link de download, sem frete."
            action={
              <Link href="/produtos?tipo=DIGITAL" className="btn btn-outline btn-sm">
                Ver e-books
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ebooks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- Lançamentos */}
      <section className="container-page py-6">
        <SectionHeading
          title="Publicações recentes"
          description="Os títulos mais novos do catálogo."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
