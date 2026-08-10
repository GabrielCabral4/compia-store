/**
 * Número do pedido visível ao cliente: COMPIA-AAAAMM-XXXX.
 * O sufixo aleatório evita que um cliente consiga adivinhar o pedido de outro.
 */
export function generateOrderNumber(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `COMPIA-${year}${month}-${suffix}`;
}
