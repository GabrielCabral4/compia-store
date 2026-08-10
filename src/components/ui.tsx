import type { ReactNode } from "react";

import { AlertIcon, CheckIcon } from "./icons";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PRODUCT_TYPE_LABEL,
  type OrderStatus,
  type PaymentStatus,
  type ProductType,
} from "@/lib/constants";

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-brand-50 text-brand-800 border-brand-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[14px] ${tones[tone]}`}
    >
      <span className="mt-0.5 shrink-0">
        {tone === "success" ? (
          <CheckIcon className="size-4.5" />
        ) : (
          <AlertIcon className="size-4.5" />
        )}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {description && (
        <p className="max-w-md text-[14px] text-ink-500">{description}</p>
      )}
      {action}
    </div>
  );
}

const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  PENDENTE_PAGAMENTO: "bg-amber-100 text-amber-800",
  PAGO: "bg-emerald-100 text-emerald-800",
  EM_SEPARACAO: "bg-brand-100 text-brand-800",
  ENVIADO: "bg-sky-100 text-sky-800",
  PRONTO_RETIRADA: "bg-indigo-100 text-indigo-800",
  ENTREGUE: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status as OrderStatus;
  return (
    <span className={`badge ${ORDER_STATUS_TONE[key] ?? "bg-ink-100 text-ink-700"}`}>
      {ORDER_STATUS_LABEL[key] ?? status}
    </span>
  );
}

const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  AGUARDANDO: "bg-amber-100 text-amber-800",
  APROVADO: "bg-emerald-100 text-emerald-800",
  RECUSADO: "bg-red-100 text-red-800",
  ESTORNADO: "bg-ink-200 text-ink-700",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const key = status as PaymentStatus;
  return (
    <span
      className={`badge ${PAYMENT_STATUS_TONE[key] ?? "bg-ink-100 text-ink-700"}`}
    >
      {PAYMENT_STATUS_LABEL[key] ?? status}
    </span>
  );
}

const PRODUCT_TYPE_TONE: Record<ProductType, string> = {
  FISICO: "bg-ink-100 text-ink-700",
  DIGITAL: "bg-brand-100 text-brand-800",
  KIT: "bg-accent-400/25 text-amber-900",
};

export function ProductTypeBadge({ type }: { type: string }) {
  const key = type as ProductType;
  return (
    <span className={`badge ${PRODUCT_TYPE_TONE[key] ?? "bg-ink-100 text-ink-700"}`}>
      {PRODUCT_TYPE_LABEL[key] ?? type}
    </span>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[14px] text-ink-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
