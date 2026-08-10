import { z } from "zod";

/** Converte os erros do Zod no formato { campo: mensagem } usado nos formulários. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 0 || isValidCpf(value), {
    message: "CPF inválido.",
  });

/** Validação de CPF pelos dois dígitos verificadores. */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

export const nameSchema = z
  .string()
  .trim()
  .min(3, "Informe o nome completo.")
  .max(120, "Nome muito longo.");

export const cepSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8, { message: "CEP inválido." });

/** Gera um slug a partir de um texto livre (usado no cadastro de produtos). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
