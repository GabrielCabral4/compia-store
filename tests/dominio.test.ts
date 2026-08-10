import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBasisPoints,
  formatCents,
  parseCurrencyToCents,
} from "../src/lib/money";
import { isValidCpf, slugify } from "../src/lib/validation";
import { generateOrderNumber } from "../src/lib/order-number";
import { hashPassword, readSignedPayload, signPayload, verifyPassword } from "../src/lib/crypto";
import { buildCoverSvg, wrapText } from "../src/lib/cover";

process.env.APP_SECRET ??= "segredo-de-teste";

test("converte texto em centavos aceitando os formatos usados no Brasil", () => {
  assert.equal(parseCurrencyToCents("129,90"), 12990);
  assert.equal(parseCurrencyToCents("R$ 1.234,50"), 123450);
  assert.equal(parseCurrencyToCents("1234.50"), 123450);
  assert.equal(parseCurrencyToCents("0"), 0);
  assert.equal(parseCurrencyToCents("abc"), null);
  assert.equal(parseCurrencyToCents("-5"), null);
});

test("formata valores em reais", () => {
  assert.match(formatCents(12990), /129,90/);
});

test("aplica alíquota em pontos base", () => {
  assert.equal(applyBasisPoints(10000, 900), 900); // 9%
  assert.equal(applyBasisPoints(12990, 0), 0);
});

test("valida CPF pelos dígitos verificadores", () => {
  assert.equal(isValidCpf("123.456.789-09"), true);
  assert.equal(isValidCpf("123.456.789-00"), false);
  assert.equal(isValidCpf("111.111.111-11"), false);
});

test("gera slug a partir de texto com acentos", () => {
  assert.equal(
    slugify("Introdução à Inteligência Artificial!"),
    "introducao-a-inteligencia-artificial"
  );
});

test("número do pedido segue o padrão COMPIA-AAAAMM-XXXX", () => {
  const number = generateOrderNumber(new Date(2026, 1, 15));
  assert.match(number, /^COMPIA-202602-[0-9A-Z]{4}$/);
});

test("senha é armazenada com hash e verificada corretamente", () => {
  const hash = hashPassword("compia123");
  assert.notEqual(hash, "compia123");
  assert.equal(verifyPassword("compia123", hash), true);
  assert.equal(verifyPassword("outra-senha", hash), false);
});

test("carrinho assinado rejeita adulteração", () => {
  const signed = signPayload({ items: [{ productId: "abc", quantity: 2 }] });
  assert.deepEqual(readSignedPayload(signed), {
    items: [{ productId: "abc", quantity: 2 }],
  });

  const tampered = signed.replace(/^./, (char) => (char === "a" ? "b" : "a"));
  assert.equal(readSignedPayload(tampered), null);
  assert.equal(readSignedPayload(undefined), null);
});

test("capa gerada é um SVG com o título do livro", () => {
  const svg = buildCoverSvg({
    title: "Fundamentos de IA",
    category: "Inteligência Artificial",
    accent: ["#000000", "#ffffff"],
  });
  assert.match(svg, /^<svg/);
  assert.match(svg, /Fundamentos de IA/);
});

test("quebra de texto respeita o limite de caracteres", () => {
  const lines = wrapText("um dois tres quatro cinco seis", 10);
  assert.equal(
    lines.every((line) => line.length <= 10),
    true
  );
  assert.equal(lines.join(" "), "um dois tres quatro cinco seis");
});
