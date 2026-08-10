/**
 * Arquivos de demonstração gerados pelo seed.
 *
 * As capas usam o mesmo gerador do painel administrativo (src/lib/cover.ts);
 * aqui fica apenas a montagem dos PDFs dos e-books, para que o fluxo de
 * download por token possa ser testado de ponta a ponta.
 */
import { wrapText } from "../src/lib/cover";

export { buildCoverSvg, wrapText } from "../src/lib/cover";

/** Converte para ASCII e escapa os caracteres reservados de string PDF. */
function pdfText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\()]/g, (match) => `\\${match}`)
    .replace(/[^\x20-\x7E]/g, "");
}

/**
 * Monta um PDF de uma página, com tabela de referência cruzada correta.
 * Suficiente para abrir em qualquer leitor.
 */
export function buildSimplePdf(title: string, paragraphs: string[]): Buffer {
  const body: string[] = [
    "BT",
    "/F2 22 Tf",
    "60 770 Td",
    "16 TL",
    `(${pdfText(title)}) Tj`,
    "/F1 11 Tf",
  ];

  body.push("T*", "T*");
  for (const paragraph of paragraphs) {
    for (const line of wrapText(paragraph, 88)) {
      body.push("T*", `(${pdfText(line)}) Tj`);
    }
    body.push("T*");
  }
  body.push("ET");

  const content = body.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}
