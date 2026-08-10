import { NextResponse } from "next/server";

import { isValidCep, normalizeCep } from "@/lib/shipping";

/**
 * Consulta de endereço por CEP (ViaCEP), usada para preencher o formulário de
 * entrega automaticamente. Se o serviço estiver fora do ar (por exemplo, numa
 * máquina sem internet), a loja continua funcionando com preenchimento manual.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/cep/[cep]">
) {
  const { cep } = await context.params;
  const normalized = normalizeCep(cep);

  if (!isValidCep(normalized)) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 422 });
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${normalized}/json/`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" }
    );

    if (!response.ok) throw new Error("Serviço indisponível");

    const data = (await response.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      cep: normalized,
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o CEP agora. Preencha manualmente." },
      { status: 503 }
    );
  }
}
