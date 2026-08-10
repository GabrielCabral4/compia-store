/**
 * O fuso é fixado no horário de Brasília de propósito: em produção o servidor
 * roda em UTC, e sem isso um pedido feito às 21h apareceria como sendo do dia
 * seguinte para o cliente e para a equipe da editora.
 */
const TIME_ZONE = "America/Sao_Paulo";

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const DATE_ONLY = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE_TIME.format(new Date(value));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE_ONLY.format(new Date(value));
}

/** "em 5 dias úteis", "no mesmo dia" etc. */
export function formatEta(days: number): string {
  if (days <= 0) return "entrega imediata";
  if (days === 1) return "em 1 dia útil";
  return `em até ${days} dias úteis`;
}

export function formatCpf(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length !== 11) return value ?? "—";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9)}`;
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
