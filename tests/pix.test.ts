import assert from "node:assert/strict";
import test from "node:test";

import { buildPixPayload, crc16, normalizeTxid } from "../src/lib/pix";

/** Lê a estrutura TLV do BR Code: id (2) + tamanho (2) + valor. */
function parseTlv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let cursor = 0;
  while (cursor < payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const length = Number(payload.slice(cursor + 2, cursor + 4));
    fields[id] = payload.slice(cursor + 4, cursor + 4 + length);
    cursor += 4 + length;
  }
  return fields;
}

test("CRC16/CCITT-FALSE bate com o valor de referência", () => {
  assert.equal(crc16("123456789"), "29B1");
});

test("txid é normalizado para no máximo 25 caracteres alfanuméricos", () => {
  assert.equal(normalizeTxid("COMPIA-202602-1A2B"), "COMPIA2026021A2B");
  assert.equal(normalizeTxid("").length > 0, true);
  assert.equal(normalizeTxid("x".repeat(40)).length, 25);
});

test("payload PIX tem a estrutura e o CRC corretos", () => {
  const payload = buildPixPayload({
    key: "4f2c1b9a-7d3e-4a10-9f55-2c8e6b1d0a37",
    merchantName: "COMPIA Editora",
    merchantCity: "Campina Grande",
    amountCents: 12990,
    txid: "COMPIA-202602-AB12",
    description: "Pedido COMPIA-202602-AB12",
  });

  // O CRC ocupa os últimos 4 caracteres e cobre todo o restante do texto.
  const body = payload.slice(0, -4);
  assert.equal(payload.slice(-4), crc16(body));

  const fields = parseTlv(body);
  assert.equal(fields["00"], "01", "Payload Format Indicator");
  assert.equal(fields["01"], "12", "cobrança de uso único");
  assert.equal(fields["52"], "0000", "Merchant Category Code");
  assert.equal(fields["53"], "986", "moeda BRL");
  assert.equal(fields["54"], "129.90", "valor com duas casas");
  assert.equal(fields["58"], "BR");
  assert.equal(fields["59"], "COMPIA EDITORA");
  assert.equal(fields["60"], "CAMPINA GRANDE");

  const merchantAccount = parseTlv(fields["26"]);
  assert.equal(merchantAccount["00"], "br.gov.bcb.pix");
  assert.equal(merchantAccount["01"], "4f2c1b9a-7d3e-4a10-9f55-2c8e6b1d0a37");

  const additional = parseTlv(fields["62"]);
  assert.equal(additional["05"], "COMPIA202602AB12");
});

test("nome do recebedor e cidade respeitam os limites do padrão", () => {
  const payload = buildPixPayload({
    key: "chave@compia.com.br",
    merchantName: "Editora Com Nome Extremamente Longo Para o Padrao",
    merchantCity: "Cidade Com Nome Muito Longo",
    amountCents: 100,
    txid: "TESTE1",
  });

  const fields = parseTlv(payload.slice(0, -4));
  assert.equal(fields["59"].length <= 25, true);
  assert.equal(fields["60"].length <= 15, true);
  // Acentos são removidos: o padrão aceita apenas caracteres ASCII.
  assert.match(fields["59"], /^[A-Z0-9 .-]+$/);
});
