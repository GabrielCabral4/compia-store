/**
 * Detecção de bandeira, validação de cartão e regras de parcelamento.
 *
 * A autorização em si é feita pelo gateway simulado (src/lib/gateway.ts); aqui
 * ficam apenas as validações que a loja faz antes de enviar os dados.
 */

export const CARD_BRANDS = [
  "VISA",
  "MASTERCARD",
  "ELO",
  "HIPERCARD",
  "AMEX",
  "DINERS",
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number];

export const CARD_BRAND_LABEL: Record<CardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "MasterCard",
  ELO: "Elo",
  HIPERCARD: "Hipercard",
  AMEX: "American Express",
  DINERS: "Diners Club",
};

const BRAND_PATTERNS: Array<{ brand: CardBrand; pattern: RegExp }> = [
  // Elo precisa vir antes de Visa/Master: alguns BINs começam com 4 ou 5.
  {
    brand: "ELO",
    pattern:
      /^(4011(78|79)|431274|438935|451416|457393|45763[12]|504175|506699|5067[0-6][0-9]|50677[0-8]|509[0-9]{3}|627780|636297|636368|636369|650[0-9]{3}|6516[5-9][0-9]|6550[0-9]{2})/,
  },
  { brand: "HIPERCARD", pattern: /^(606282|3841[046]0)/ },
  { brand: "VISA", pattern: /^4/ },
  {
    brand: "MASTERCARD",
    pattern: /^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/,
  },
  { brand: "AMEX", pattern: /^3[47]/ },
  { brand: "DINERS", pattern: /^3(0[0-5]|[68])/ },
];

export function onlyDigits(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export function detectBrand(cardNumber: string): CardBrand | null {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 4) return null;
  for (const { brand, pattern } of BRAND_PATTERNS) {
    if (pattern.test(digits)) return brand;
  }
  return null;
}

/** Algoritmo de Luhn — confere o dígito verificador do cartão. */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function isValidExpiry(month: number, year: number): boolean {
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  const fullYear = year < 100 ? 2000 + year : year;
  const now = new Date();
  const lastDay = new Date(fullYear, month, 0, 23, 59, 59);
  return lastDay >= now && fullYear <= now.getFullYear() + 25;
}

export function isValidCvv(cvv: string, brand: CardBrand | null): boolean {
  const digits = onlyDigits(cvv);
  return brand === "AMEX" ? digits.length === 4 : digits.length === 3;
}

export function maskCardNumber(cardNumber: string): string {
  const digits = onlyDigits(cardNumber);
  return digits.slice(-4).padStart(digits.length, "•");
}

export const MAX_INSTALLMENTS = 12;
/** Abaixo deste valor por parcela, a opção não é oferecida. */
export const MIN_INSTALLMENT_CENTS = 2000;

export type InstallmentOption = {
  count: number;
  installmentCents: number;
  totalCents: number;
  label: string;
};

/** Parcelamento sem juros, respeitando o valor mínimo por parcela. */
export function installmentOptions(totalCents: number): InstallmentOption[] {
  const options: InstallmentOption[] = [];
  for (let count = 1; count <= MAX_INSTALLMENTS; count++) {
    const installmentCents = Math.floor(totalCents / count);
    if (count > 1 && installmentCents < MIN_INSTALLMENT_CENTS) break;
    options.push({
      count,
      installmentCents,
      totalCents,
      label:
        count === 1
          ? "à vista"
          : `${count}x de ${(installmentCents / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })} sem juros`,
    });
  }
  return options;
}
