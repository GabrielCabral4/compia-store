"use client";

import { updateOrderAction } from "@/actions/admin";
import { useActionForm } from "../use-action-form";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";

import { SubmitButton } from "../submit-button";
import { Alert, Field } from "../ui";

export function OrderStatusForm({
  orderId,
  status,
  trackingCode,
  shippingMethod,
}: {
  orderId: string;
  status: string;
  trackingCode: string | null;
  shippingMethod: string;
}) {
  const { state, pending, onSubmit, action } = useActionForm(updateOrderAction);

  const isDigital = shippingMethod === "DIGITAL";

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />

      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <Field label="Situação do pedido" name="status">
        <select
          id="status"
          name="status"
          className="field-input"
          defaultValue={status}
        >
          {ORDER_STATUSES.filter(
            (option) => !isDigital || !["EM_SEPARACAO", "ENVIADO", "PRONTO_RETIRADA"].includes(option)
          ).map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_LABEL[option as OrderStatus]}
            </option>
          ))}
        </select>
      </Field>

      {!isDigital && (
        <Field
          label="Código de rastreio"
          name="trackingCode"
          hint="Enviado ao cliente por e-mail quando o pedido é marcado como enviado."
        >
          <input
            id="trackingCode"
            name="trackingCode"
            className="field-input font-mono"
            defaultValue={trackingCode ?? ""}
            placeholder="BR123456789BR"
          />
        </Field>
      )}

      <SubmitButton pending={pending} className="btn btn-primary w-full" pendingLabel="Atualizando…">
        Atualizar e notificar cliente
      </SubmitButton>
    </form>
  );
}
