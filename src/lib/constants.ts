// Valores de domínio usados no lugar de enums (o SQLite não suporta enums no
// Prisma). Cada lista traz também o rótulo exibido na interface.

export const ROLES = ["ADMIN", "EDITOR", "VENDEDOR", "CLIENTE"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  VENDEDOR: "Vendedor",
  CLIENTE: "Cliente",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  ADMIN: "Acesso total, incluindo usuários, configurações e logs.",
  EDITOR: "Gerencia catálogo (produtos, categorias e tags).",
  VENDEDOR: "Gerencia pedidos, clientes e envios.",
  CLIENTE: "Compra na loja e acessa a própria área.",
};

/** Perfis com acesso ao painel administrativo. */
export const STAFF_ROLES: Role[] = ["ADMIN", "EDITOR", "VENDEDOR"];

export const PRODUCT_TYPES = ["FISICO", "DIGITAL", "KIT"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  FISICO: "Livro físico",
  DIGITAL: "E-book",
  KIT: "Kit",
};

export const ORDER_STATUSES = [
  "PENDENTE_PAGAMENTO",
  "PAGO",
  "EM_SEPARACAO",
  "ENVIADO",
  "PRONTO_RETIRADA",
  "ENTREGUE",
  "CANCELADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_SEPARACAO: "Em separação",
  ENVIADO: "Enviado",
  PRONTO_RETIRADA: "Pronto para retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const SHIPPING_METHODS = [
  "PAC",
  "SEDEX",
  "TRANSPORTADORA",
  "RETIRADA_LOCAL",
  "DIGITAL",
] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_METHOD_LABEL: Record<ShippingMethod, string> = {
  PAC: "Correios PAC",
  SEDEX: "Correios SEDEX",
  TRANSPORTADORA: "Transportadora",
  RETIRADA_LOCAL: "Retirada no local",
  DIGITAL: "Entrega digital",
};

export const PAYMENT_METHODS = ["PIX", "CARTAO_CREDITO"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
};

export const PAYMENT_STATUSES = [
  "AGUARDANDO",
  "APROVADO",
  "RECUSADO",
  "ESTORNADO",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  AGUARDANDO: "Aguardando",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  ESTORNADO: "Estornado",
};

export const UF_LIST = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;
