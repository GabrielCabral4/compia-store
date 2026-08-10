// Todo valor monetário circula pelo sistema como inteiro em centavos.

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: number): string {
  return BRL.format((cents ?? 0) / 100);
}

/**
 * Converte texto digitado pelo usuário ("1.234,50", "1234.5", "R$ 89,90")
 * em centavos. Retorna null quando não é um número válido.
 */
export function parseCurrencyToCents(input: string): number | null {
  if (input == null) return null;
  let raw = String(input).trim().replace(/[R$\s]/g, "");
  if (!raw) return null;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  if (hasComma && hasDot) {
    // O último separador é o decimal; o outro é separador de milhar.
    raw =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (hasComma) {
    raw = raw.replace(",", ".");
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Aplica uma alíquota em pontos base (900 = 9,00%) sobre um valor. */
export function applyBasisPoints(cents: number, basisPoints: number): number {
  return Math.round((cents * basisPoints) / 10000);
}

export function formatPercentFromBasisPoints(basisPoints: number): string {
  return `${(basisPoints / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}
