import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";
import {
  formatCep,
  isValidCep,
  normalizeCep,
  quoteShipping,
  zoneForCep,
} from "../src/lib/shipping";

const settings = DEFAULT_SETTINGS;

test("normaliza e valida o CEP", () => {
  assert.equal(normalizeCep("58.429-900"), "58429900");
  assert.equal(isValidCep("58429-900"), true);
  assert.equal(isValidCep("5842"), false);
  assert.equal(formatCep("58429900"), "58429-900");
});

test("identifica a região de destino pelo CEP", () => {
  assert.equal(zoneForCep("58429900")?.multiplier, 1); // Paraíba (origem)
  assert.equal(zoneForCep("01310100")!.multiplier > 1, true); // São Paulo
  assert.equal(zoneForCep("123")?.multiplier, undefined);
});

test("pedido só com e-books não tem frete", () => {
  const quotes = quoteShipping({
    cep: "01310100",
    weightGrams: 0,
    subtotalCents: 8990,
    hasPhysicalItems: false,
    settings,
  });

  assert.equal(quotes.length, 1);
  assert.equal(quotes[0].method, "DIGITAL");
  assert.equal(quotes[0].cents, 0);
});

test("SEDEX é mais caro e mais rápido que o PAC", () => {
  const quotes = quoteShipping({
    cep: "01310100",
    weightGrams: 900,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings,
  });

  const pac = quotes.find((quote) => quote.method === "PAC")!;
  const sedex = quotes.find((quote) => quote.method === "SEDEX")!;

  assert.equal(sedex.cents > pac.cents, true);
  assert.equal(sedex.etaDays < pac.etaDays, true);
});

test("destino mais distante custa mais que destino regional", () => {
  const input = {
    weightGrams: 900,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings,
  };

  const local = quoteShipping({ ...input, cep: "58429900" }).find(
    (quote) => quote.method === "PAC"
  )!;
  const distante = quoteShipping({ ...input, cep: "90010000" }).find(
    (quote) => quote.method === "PAC"
  )!;

  assert.equal(distante.cents > local.cents, true);
});

test("frete grátis no PAC acima do valor configurado", () => {
  const quotes = quoteShipping({
    cep: "01310100",
    weightGrams: 900,
    subtotalCents: settings.freeShippingAboveCents,
    hasPhysicalItems: true,
    settings,
  });

  assert.equal(quotes.find((quote) => quote.method === "PAC")!.cents, 0);
  // A opção expressa continua sendo cobrada.
  assert.equal(quotes.find((quote) => quote.method === "SEDEX")!.cents > 0, true);
});

test("transportadora só aparece em pedidos pesados", () => {
  const leve = quoteShipping({
    cep: "01310100",
    weightGrams: 900,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings,
  });
  const pesado = quoteShipping({
    cep: "01310100",
    weightGrams: 4000,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings,
  });

  assert.equal(
    leve.some((quote) => quote.method === "TRANSPORTADORA"),
    false
  );
  assert.equal(
    pesado.some((quote) => quote.method === "TRANSPORTADORA"),
    true
  );
});

test("retirada no local é oferecida mesmo sem CEP e pode ser desligada", () => {
  const comRetirada = quoteShipping({
    cep: "",
    weightGrams: 900,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings,
  });
  assert.deepEqual(
    comRetirada.map((quote) => quote.method),
    ["RETIRADA_LOCAL"]
  );

  const semRetirada = quoteShipping({
    cep: "",
    weightGrams: 900,
    subtotalCents: 10000,
    hasPhysicalItems: true,
    settings: { ...settings, pickupEnabled: false },
  });
  assert.equal(semRetirada.length, 0);
});
