import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "COMPIA Editora | Livros de Inteligência Artificial",
    template: "%s | COMPIA Editora",
  },
  description:
    "Loja virtual da COMPIA Editora: livros físicos, e-books e kits sobre inteligência artificial, arquitetura de software, blockchain, criptografia e cibersegurança.",
  keywords: [
    "inteligência artificial",
    "livros",
    "e-books",
    "COMPIA",
    "editora",
    "cibersegurança",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
