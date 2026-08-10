import type { ShippingMethod } from "./constants";
import { SHIPPING_METHOD_LABEL } from "./constants";
import type { StoreSettings } from "./settings";

/**
 * Cálculo de frete.
 *
 * A origem é Campina Grande/PB (faixa de CEP 58xxx-xxx). O custo combina uma
 * taxa base, o peso do pedido e um multiplicador por região de destino,
 * derivado do primeiro dígito do CEP, que é como os Correios organizam o
 * território nacional. Os parâmetros base/por-quilo e o piso de frete grátis
 * vêm das configurações da loja, portanto podem ser ajustados pelo painel sem
 * alterar o código.
 */

export type ShippingQuote = {
  method: ShippingMethod;
  label: string;
  carrier: string;
  cents: number;
  etaDays: number;
  description: string;
};

type Zone = {
  name: string;
  multiplier: number;
  extraDays: number;
};

/** Região de destino por primeiro dígito do CEP, relativa à origem (PB). */
const ZONES: Record<string, Zone> = {
  "0": { name: "São Paulo (capital e região)", multiplier: 1.7, extraDays: 3 },
  "1": { name: "Interior de São Paulo", multiplier: 1.7, extraDays: 3 },
  "2": { name: "Rio de Janeiro e Espírito Santo", multiplier: 1.6, extraDays: 3 },
  "3": { name: "Minas Gerais", multiplier: 1.6, extraDays: 3 },
  "4": { name: "Bahia e Sergipe", multiplier: 1.15, extraDays: 1 },
  "5": { name: "Pernambuco, Alagoas, Paraíba e Rio Grande do Norte", multiplier: 1, extraDays: 0 },
  "6": { name: "Ceará, Piauí, Maranhão e Região Norte", multiplier: 1.35, extraDays: 2 },
  "7": { name: "Distrito Federal e Centro-Oeste", multiplier: 1.85, extraDays: 4 },
  "8": { name: "Paraná e Santa Catarina", multiplier: 2, extraDays: 5 },
  "9": { name: "Rio Grande do Sul", multiplier: 2.15, extraDays: 6 },
};

export function normalizeCep(cep: string): string {
  return (cep ?? "").replace(/\D/g, "").slice(0, 8);
}

export function isValidCep(cep: string): boolean {
  return normalizeCep(cep).length === 8;
}

export function formatCep(cep: string): string {
  const digits = normalizeCep(cep);
  if (digits.length !== 8) return cep;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function zoneForCep(cep: string): Zone | null {
  const digits = normalizeCep(cep);
  if (digits.length !== 8) return null;
  return ZONES[digits[0]] ?? null;
}

export type ShippingInput = {
  cep: string;
  /** Peso total dos itens físicos, em gramas. */
  weightGrams: number;
  subtotalCents: number;
  hasPhysicalItems: boolean;
  settings: StoreSettings;
};

/** Opção usada quando o pedido só contém e-books. */
export function digitalOnlyQuote(): ShippingQuote {
  return {
    method: "DIGITAL",
    label: SHIPPING_METHOD_LABEL.DIGITAL,
    carrier: "COMPIA",
    cents: 0,
    etaDays: 0,
    description:
      "Pedido 100% digital: o link de download é liberado assim que o pagamento é aprovado.",
  };
}

export function pickupQuote(settings: StoreSettings): ShippingQuote {
  return {
    method: "RETIRADA_LOCAL",
    label: SHIPPING_METHOD_LABEL.RETIRADA_LOCAL,
    carrier: "COMPIA",
    cents: 0,
    etaDays: 1,
    description: `${settings.pickupAddress} — ${settings.pickupHours}`,
  };
}

export function quoteShipping(input: ShippingInput): ShippingQuote[] {
  const { settings, hasPhysicalItems } = input;

  if (!hasPhysicalItems) return [digitalOnlyQuote()];

  const quotes: ShippingQuote[] = [];
  const zone = zoneForCep(input.cep);

  if (zone) {
    const billableKg = Math.max(1, Math.ceil(input.weightGrams / 1000));
    const raw =
      settings.shippingBaseCents + settings.shippingPerKgCents * billableKg;
    const pacCents = Math.round(raw * zone.multiplier);

    const freeShipping =
      settings.freeShippingAboveCents > 0 &&
      input.subtotalCents >= settings.freeShippingAboveCents;

    quotes.push({
      method: "PAC",
      label: SHIPPING_METHOD_LABEL.PAC,
      carrier: "Correios",
      cents: freeShipping ? 0 : pacCents,
      etaDays: 5 + zone.extraDays,
      description: freeShipping
        ? `Frete grátis para ${zone.name}, entrega econômica.`
        : `Entrega econômica para ${zone.name}.`,
    });

    quotes.push({
      method: "SEDEX",
      label: SHIPPING_METHOD_LABEL.SEDEX,
      carrier: "Correios",
      cents: Math.round(pacCents * 1.8),
      etaDays: 2 + Math.ceil(zone.extraDays / 2),
      description: `Entrega expressa para ${zone.name}.`,
    });

    // Transportadora compensa em pedidos mais pesados.
    if (billableKg >= 3) {
      quotes.push({
        method: "TRANSPORTADORA",
        label: SHIPPING_METHOD_LABEL.TRANSPORTADORA,
        carrier: "Braspress",
        cents: Math.round(
          (settings.shippingBaseCents * 0.8 +
            settings.shippingPerKgCents * 0.6 * billableKg) *
            zone.multiplier
        ),
        etaDays: 8 + zone.extraDays,
        description: `Indicada para pedidos acima de 3 kg, ${zone.name}.`,
      });
    }
  }

  if (input.settings.pickupEnabled) quotes.push(pickupQuote(settings));

  return quotes;
}

export function findQuote(
  quotes: ShippingQuote[],
  method: string | null | undefined
): ShippingQuote | undefined {
  return quotes.find((quote) => quote.method === method);
}
