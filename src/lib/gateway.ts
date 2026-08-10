/**
 * Gateway de pagamento simulado (sandbox).
 *
 * A interface abaixo isola a loja do provedor: para integrar PagSeguro, Mercado
 * Pago ou Stripe de verdade basta implementar `PaymentGateway` com as chamadas
 * HTTP do provedor — nenhuma tela ou Server Action precisa mudar.
 *
 * REGRAS DA SANDBOX (para demonstração e testes), no mesmo estilo dos cartões
 * de teste publicados pelos gateways reais:
 *   • Cartões da lista DECLINED_TEST_CARDS → RECUSADO, com o motivo indicado.
 *   • Demais cartões válidos pelo algoritmo de Luhn → APROVADO na hora.
 *   • PIX → fica AGUARDANDO até a confirmação do banco (na loja, simulada pelo
 *     botão da página do pedido).
 */

import { randomToken } from "./crypto";
import type { CardBrand } from "./cards";
import {
  detectBrand,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
  onlyDigits,
} from "./cards";

export type CardAuthorizationRequest = {
  amountCents: number;
  cardNumber: string;
  holder: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  installments: number;
  orderNumber: string;
};

export type CardAuthorizationResult =
  | {
      approved: true;
      providerRef: string;
      brand: CardBrand;
      last4: string;
    }
  | { approved: false; reason: string };

export interface PaymentGateway {
  readonly name: string;
  authorizeCard(
    request: CardAuthorizationRequest
  ): Promise<CardAuthorizationResult>;
}

/**
 * Cartões de teste que sempre resultam em recusa — permitem demonstrar o
 * tratamento de erro do checkout. Todos passam pelo algoritmo de Luhn, como
 * cartões reais.
 */
export const DECLINED_TEST_CARDS: Record<string, string> = {
  "4000000000000002":
    "Transação não autorizada pelo emissor. Tente outro cartão ou pague com PIX.",
  "5555555555550004":
    "Transação não autorizada: saldo ou limite insuficiente. Tente outro cartão ou pague com PIX.",
};

export const sandboxGateway: PaymentGateway = {
  name: "compia-gateway-sandbox",

  async authorizeCard(request) {
    const digits = onlyDigits(request.cardNumber);
    const brand = detectBrand(digits);

    if (!brand) {
      return { approved: false, reason: "Bandeira do cartão não reconhecida." };
    }
    if (!isValidCardNumber(digits)) {
      return { approved: false, reason: "Número do cartão inválido." };
    }
    if (!isValidExpiry(request.expiryMonth, request.expiryYear)) {
      return { approved: false, reason: "Validade do cartão expirada ou inválida." };
    }
    if (!isValidCvv(request.cvv, brand)) {
      return { approved: false, reason: "Código de segurança (CVV) inválido." };
    }
    if (request.holder.trim().length < 3) {
      return { approved: false, reason: "Informe o nome impresso no cartão." };
    }

    // Latência artificial, para o comportamento parecer o de um gateway real.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const declineReason = DECLINED_TEST_CARDS[digits];
    if (declineReason) {
      return { approved: false, reason: declineReason };
    }

    return {
      approved: true,
      providerRef: `AUTH-${randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      brand,
      last4: digits.slice(-4),
    };
  },
};
