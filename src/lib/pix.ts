import QRCode from "qrcode";

/**
 * Geração do "PIX Copia e Cola" (BR Code) conforme o padrão EMV®QRCPS adotado
 * pelo Banco Central, incluindo o CRC16-CCITT do final do payload. O mesmo
 * texto é codificado como imagem de QR Code.
 */

type PixInput = {
  /** Chave PIX do recebedor (aqui, uma chave aleatória / EVP). */
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  /** Identificador da cobrança: até 25 caracteres alfanuméricos. */
  txid: string;
  description?: string;
};

/** Remove acentos e caracteres não suportados pelo padrão. */
function sanitize(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16/CCITT-FALSE — polinômio 0x1021, valor inicial 0xFFFF. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function normalizeTxid(value: string): string {
  const cleaned = (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (cleaned || "COMPIA").slice(0, 25);
}

export function buildPixPayload(input: PixInput): string {
  const txid = normalizeTxid(input.txid);
  const amount = (input.amountCents / 100).toFixed(2);

  const merchantAccount =
    field("00", "br.gov.bcb.pix") +
    field("01", input.key) +
    (input.description ? field("02", sanitize(input.description, 40)) : "");

  const payload =
    field("00", "01") + // Payload Format Indicator
    field("01", "12") + // Point of Initiation: cobrança de uso único
    field("26", merchantAccount) + // Merchant Account Information — PIX
    field("52", "0000") + // Merchant Category Code
    field("53", "986") + // Moeda: BRL
    field("54", amount) +
    field("58", "BR") +
    field("59", sanitize(input.merchantName, 25)) +
    field("60", sanitize(input.merchantCity, 15)) +
    field("62", field("05", txid)) +
    "6304"; // Campo do CRC, com tamanho fixo, entra no cálculo

  return payload + crc16(payload);
}

/** Imagem do QR Code em data URL, pronta para uso em <img src>. */
export async function pixQrCodeDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
