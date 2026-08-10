import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

function secret(): string {
  const value = process.env.APP_SECRET;
  if (!value) {
    throw new Error(
      "APP_SECRET não definido. Copie o arquivo .env.example para .env."
    );
  }
  return value;
}

// Senhas

/** Gera o hash de uma senha no formato `scrypt$<salt>$<hash>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// Tokens

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Chave PIX aleatória (formato EVP: UUID v4). */
export function randomPixKey(): string {
  return randomUUID();
}

// Payloads assinados (carrinho em cookie)

export function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

/** Serializa um objeto em `<payload>.<assinatura>`. */
export function signPayload(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Lê um payload assinado; retorna null se ausente ou adulterado. */
export function readSignedPayload<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  const index = raw.lastIndexOf(".");
  if (index <= 0) return null;

  const payload = raw.slice(0, index);
  const signature = raw.slice(index + 1);
  const expected = sign(payload);

  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
