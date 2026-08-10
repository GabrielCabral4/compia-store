/**
 * Tipo e valores padrão das configurações da loja.
 *
 * Fica separado de `settings.ts` (que só roda no servidor) para poder ser
 * importado também pelo seed do banco.
 */
export type StoreSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeCnpj: string;

  /** Chave PIX aleatória (EVP) usada para gerar o QR Code. */
  pixKey: string;
  pixMerchantName: string;
  pixMerchantCity: string;
  /** Minutos de validade do QR Code PIX. */
  pixExpiryMinutes: number;

  /** Alíquota padrão de imposto, em pontos base (900 = 9,00%). */
  defaultTaxBasisPoints: number;
  /** Valor de subtotal a partir do qual o frete é grátis (centavos). */
  freeShippingAboveCents: number;

  /** Parâmetros do cálculo de frete. */
  shippingBaseCents: number;
  shippingPerKgCents: number;

  pickupEnabled: boolean;
  pickupAddress: string;
  pickupHours: string;

  /** Regras de entrega de e-books. */
  downloadMaxPerItem: number;
  downloadExpiryDays: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "COMPIA Editora",
  storeEmail: "contato@compia.com.br",
  storePhone: "(83) 3333-0000",
  storeCnpj: "12.345.678/0001-90",

  pixKey: "4f2c1b9a-7d3e-4a10-9f55-2c8e6b1d0a37",
  pixMerchantName: "COMPIA EDITORA",
  pixMerchantCity: "CAMPINA GRANDE",
  pixExpiryMinutes: 30,

  defaultTaxBasisPoints: 900,
  freeShippingAboveCents: 25000,

  shippingBaseCents: 1890,
  shippingPerKgCents: 780,

  pickupEnabled: true,
  pickupAddress:
    "Rua Aprígio Veloso, 882 — Bloco CO, Bodocongó, Campina Grande/PB",
  pickupHours: "Segunda a sexta, 8h às 17h",

  downloadMaxPerItem: 5,
  downloadExpiryDays: 365,
};
