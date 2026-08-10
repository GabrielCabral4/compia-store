import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logs";

/**
 * Entrega do e-book por link com token.
 *
 * O token é criado quando o pagamento é aprovado e vale por um período e um
 * número limitado de downloads (configuráveis no painel). O arquivo fica fora
 * de /public, logo só pode ser obtido por esta rota.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/download/[token]">
) {
  const { token } = await context.params;

  const grant = await prisma.downloadGrant.findUnique({
    where: { token },
    include: { product: true, order: true },
  });

  if (!grant) {
    return NextResponse.json(
      { error: "Link de download inválido." },
      { status: 404 }
    );
  }

  if (grant.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Este link de download expirou. Fale com a editora." },
      { status: 410 }
    );
  }

  if (grant.downloadCount >= grant.maxDownloads) {
    return NextResponse.json(
      {
        error: `Limite de ${grant.maxDownloads} downloads atingido para este item.`,
      },
      { status: 429 }
    );
  }

  const source = grant.product.digitalFileUrl;
  if (!source) {
    return NextResponse.json(
      { error: "Arquivo não disponível. Fale com a editora." },
      { status: 404 }
    );
  }

  await prisma.downloadGrant.update({
    where: { id: grant.id },
    data: { downloadCount: { increment: 1 } },
  });

  await logActivity({
    action: "DOWNLOAD",
    entity: "DownloadGrant",
    entityId: grant.id,
    detail: `${grant.product.title} / pedido ${grant.order.number} (${
      grant.downloadCount + 1
    }/${grant.maxDownloads})`,
    userId: grant.userId,
    actorEmail: grant.order.customerEmail,
  });

  // Em produção o arquivo tende a ficar em armazenamento externo; nesse caso
  // basta redirecionar para a URL assinada do provedor.
  if (/^https?:\/\//i.test(source)) {
    return NextResponse.redirect(source);
  }

  try {
    const filePath = path.join(process.cwd(), source);
    const file = await readFile(filePath);
    const fileName =
      grant.product.digitalFileName ?? `${grant.product.slug}.pdf`;

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo do e-book." },
      { status: 500 }
    );
  }
}
