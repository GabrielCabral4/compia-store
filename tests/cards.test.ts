import assert from "node:assert/strict";
import test from "node:test";

import {
  detectBrand,
  installmentOptions,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
  MIN_INSTALLMENT_CENTS,
} from "../src/lib/cards";
import { sandboxGateway } from "../src/lib/gateway";

test("valida o número do cartão pelo algoritmo de Luhn", () => {
  assert.equal(isValidCardNumber("4111 1111 1111 1111"), true);
  assert.equal(isValidCardNumber("4111111111111112"), false);
  assert.equal(isValidCardNumber("123"), false);
});

test("identifica as principais bandeiras", () => {
  assert.equal(detectBrand("4111111111111111"), "VISA");
  assert.equal(detectBrand("5555555555554444"), "MASTERCARD");
  assert.equal(detectBrand("2223003122003222"), "MASTERCARD");
  assert.equal(detectBrand("6362970000457013"), "ELO");
  assert.equal(detectBrand("6062825624254001"), "HIPERCARD");
  assert.equal(detectBrand("378282246310005"), "AMEX");
  assert.equal(detectBrand("30569309025904"), "DINERS");
  assert.equal(detectBrand("9999999999999999"), null);
});

test("valida validade e CVV", () => {
  const nextYear = new Date().getFullYear() + 1;
  assert.equal(isValidExpiry(12, nextYear), true);
  assert.equal(isValidExpiry(1, 2020), false);
  assert.equal(isValidExpiry(13, nextYear), false);

  assert.equal(isValidCvv("123", "VISA"), true);
  assert.equal(isValidCvv("1234", "VISA"), false);
  assert.equal(isValidCvv("1234", "AMEX"), true);
});

test("parcelamento respeita o valor mínimo por parcela", () => {
  const options = installmentOptions(60000);
  assert.equal(options[0].count, 1);
  assert.equal(
    options.every((option) => option.installmentCents >= MIN_INSTALLMENT_CENTS),
    true
  );

  // Um pedido pequeno não deve oferecer parcelamento.
  assert.equal(installmentOptions(3000).length, 1);
});

test("gateway aprova cartão válido e recusa cartão de teste", async () => {
  const base = {
    amountCents: 10000,
    holder: "MARIA SOUZA",
    expiryMonth: 12,
    expiryYear: new Date().getFullYear() + 2,
    cvv: "123",
    installments: 1,
    orderNumber: "COMPIA-TESTE",
  };

  const approved = await sandboxGateway.authorizeCard({
    ...base,
    cardNumber: "4111111111111111",
  });
  assert.equal(approved.approved, true);
  if (approved.approved) {
    assert.equal(approved.brand, "VISA");
    assert.equal(approved.last4, "1111");
  }

  const declined = await sandboxGateway.authorizeCard({
    ...base,
    cardNumber: "4000000000000002",
  });
  assert.equal(declined.approved, false);

  const invalid = await sandboxGateway.authorizeCard({
    ...base,
    cardNumber: "4111111111111112",
  });
  assert.equal(invalid.approved, false);
});
