import Link from "next/link";

import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

import { CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <footer className="mt-auto bg-ink-950 text-white/70">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <TruckIcon className="size-6" />,
              title: "Entrega para todo o Brasil",
              text: "Correios (PAC e SEDEX), transportadora ou retirada na editora.",
            },
            {
              icon: <PixIcon className="size-6" />,
              title: "PIX com QR Code",
              text: "Pagamento imediato por chave aleatória, sem taxas adicionais.",
            },
            {
              icon: <CardIcon className="size-6" />,
              title: "Cartão em até 12x",
              text: "Visa, MasterCard, Elo, Hipercard, Amex e Diners.",
            },
            {
              icon: <ShieldIcon className="size-6" />,
              title: "Compra protegida",
              text: "Dados trafegam por HTTPS e todo acesso administrativo é registrado.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <span className="mt-0.5 text-brand-300">{feature.icon}</span>
              <div>
                <p className="text-[14px] font-semibold text-white">
                  {feature.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-500 text-[15px] font-black text-white">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-[16px] font-bold tracking-[0.14em] text-white">
                COMPIA
              </span>
              <span className="block text-[10px] tracking-[0.28em]">EDITORA</span>
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed">
            Publicações de alta qualidade em Inteligência Artificial, unindo rigor
            técnico e linguagem acessível, fazendo a ponte entre a universidade e o
            mercado.
          </p>
        </div>

        <nav aria-labelledby="footer-catalogo">
          <h2
            id="footer-catalogo"
            className="text-[13px] font-semibold uppercase tracking-wider text-white"
          >
            Catálogo
          </h2>
          <ul className="mt-4 space-y-2 text-[13px]">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/produtos?categoria=${category.slug}`}
                  className="hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-conta">
          <h2
            id="footer-conta"
            className="text-[13px] font-semibold uppercase tracking-wider text-white"
          >
            Sua conta
          </h2>
          <ul className="mt-4 space-y-2 text-[13px]">
            <li>
              <Link href="/conta" className="hover:text-white">
                Minha conta
              </Link>
            </li>
            <li>
              <Link href="/conta/pedidos" className="hover:text-white">
                Meus pedidos
              </Link>
            </li>
            <li>
              <Link href="/conta/biblioteca" className="hover:text-white">
                Minha biblioteca (e-books)
              </Link>
            </li>
            <li>
              <Link href="/carrinho" className="hover:text-white">
                Carrinho
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:text-white">
                Sobre a editora
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white">
            Contato
          </h2>
          <ul className="mt-4 space-y-2 text-[13px]">
            <li>{settings.storeEmail}</li>
            <li>{settings.storePhone}</li>
            <li className="leading-relaxed">{settings.pickupAddress}</li>
            <li className="text-white/50">CNPJ {settings.storeCnpj}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[12px] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Projeto acadêmico da
            disciplina Programação para Web (UFCG).
          </p>
          <p className="text-white/45">
            Pagamentos processados em ambiente de testes (sandbox).
          </p>
        </div>
      </div>
    </footer>
  );
}
