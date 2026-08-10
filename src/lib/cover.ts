/**
 * Gerador de capas em SVG.
 *
 * Usado pelo seed e pelo painel administrativo: ao cadastrar um título sem
 * informar imagem, a loja cria uma capa a partir do próprio texto e a guarda
 * como data URI. Assim o cadastro funciona sem upload de arquivos e sem
 * depender de imagens externas.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quebra o texto em linhas de no máximo `maxChars` caracteres. */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const PALETTE: Array<[string, string]> = [
  ["#312e81", "#0ea5e9"],
  ["#0f766e", "#84cc16"],
  ["#7c2d12", "#f59e0b"],
  ["#1e1b4b", "#a78bfa"],
  ["#7f1d1d", "#f43f5e"],
  ["#164e63", "#22d3ee"],
  ["#3f3f46", "#94a3b8"],
];

/** Cores estáveis a partir de um texto (mesma categoria, mesma cor). */
export function accentFor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return PALETTE[hash % PALETTE.length];
}

export type CoverInput = {
  title: string;
  subtitle?: string;
  author?: string;
  category: string;
  accent: [string, string];
  badge?: string;
};

export function buildCoverSvg(input: CoverInput): string {
  const [from, to] = input.accent;
  const titleLines = wrapText(input.title, 20).slice(0, 4);
  const subtitleLines = input.subtitle
    ? wrapText(input.subtitle, 34).slice(0, 3)
    : [];

  const titleStartY = 330;
  const lineHeight = 52;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="${escapeXml(
    input.title
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="600" height="800" fill="url(#bg)"/>
  <rect width="600" height="800" fill="url(#grid)"/>
  <circle cx="500" cy="120" r="170" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="90" cy="700" r="130" fill="#000000" fill-opacity="0.10"/>
  <rect x="0" y="0" width="14" height="800" fill="#000000" fill-opacity="0.22"/>

  <g font-family="Helvetica, Arial, sans-serif">
    <text x="60" y="96" fill="#ffffff" fill-opacity="0.95" font-size="26" font-weight="bold" letter-spacing="6">COMPIA</text>
    <text x="60" y="126" fill="#ffffff" fill-opacity="0.65" font-size="15" letter-spacing="1.5">EDITORA</text>
    <text x="60" y="200" fill="#ffffff" fill-opacity="0.75" font-size="17" letter-spacing="1">${escapeXml(
      input.category.toUpperCase()
    )}</text>
    <line x1="60" y1="222" x2="200" y2="222" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>

    ${titleLines
      .map(
        (line, index) =>
          `<text x="60" y="${
            titleStartY + index * lineHeight
          }" fill="#ffffff" font-size="44" font-weight="bold">${escapeXml(line)}</text>`
      )
      .join("\n    ")}

    ${subtitleLines
      .map(
        (line, index) =>
          `<text x="60" y="${
            titleStartY + titleLines.length * lineHeight + 24 + index * 30
          }" fill="#ffffff" fill-opacity="0.8" font-size="22">${escapeXml(line)}</text>`
      )
      .join("\n    ")}

    ${
      input.author
        ? `<text x="60" y="720" fill="#ffffff" fill-opacity="0.9" font-size="22" font-weight="bold">${escapeXml(
            input.author
          )}</text>`
        : ""
    }
    ${
      input.badge
        ? `<g><rect x="60" y="744" width="${
            input.badge.length * 11 + 28
          }" height="34" rx="17" fill="#ffffff" fill-opacity="0.9"/><text x="74" y="767" fill="${from}" font-size="15" font-weight="bold" letter-spacing="1">${escapeXml(
            input.badge.toUpperCase()
          )}</text></g>`
        : ""
    }
  </g>
</svg>
`;
}

/** Capa embutida como data URI, pronta para o atributo src de uma imagem. */
export function coverDataUri(input: CoverInput): string {
  const svg = buildCoverSvg(input);
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
