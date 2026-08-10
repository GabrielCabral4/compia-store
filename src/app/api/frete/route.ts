import { NextResponse } from "next/server";

import { getSettings } from "@/lib/settings";
import { isValidCep, normalizeCep, quoteShipping } from "@/lib/shipping";

/**
 * Simulação de cotação de frete (Correios/transportadora).
 *
 * Numa integração real, este é o ponto em que a loja chamaria a API dos
 * Correios ou da transportadora; a resposta tem o mesmo formato consumido pela
 * interface, então trocar a implementação não afeta as telas.
 */
export async function POST(request: Request) {
  let body: { cep?: string; weightGrams?: number; subtotalCents?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const cep = normalizeCep(String(body.cep ?? ""));
  if (!isValidCep(cep)) {
    return NextResponse.json(
      { error: "Informe um CEP válido, com 8 dígitos." },
      { status: 422 }
    );
  }

  const settings = await getSettings();
  const quotes = quoteShipping({
    cep,
    weightGrams: Math.max(0, Number(body.weightGrams) || 0),
    subtotalCents: Math.max(0, Number(body.subtotalCents) || 0),
    hasPhysicalItems: true,
    settings,
  });

  return NextResponse.json({ cep, quotes });
}
