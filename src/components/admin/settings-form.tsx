"use client";

import { saveSettingsAction } from "@/actions/admin";
import { useActionForm } from "../use-action-form";
import type { StoreSettings } from "@/lib/settings-defaults";

import { SubmitButton } from "../submit-button";
import { Alert, Field } from "../ui";

function decimal(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const { state, pending, onSubmit, action } = useActionForm(saveSettingsAction);
  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-6">
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Identificação da loja
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da loja" name="storeName">
            <input
              id="storeName"
              name="storeName"
              className="field-input"
              defaultValue={settings.storeName}
            />
          </Field>
          <Field label="E-mail de contato" name="storeEmail">
            <input
              id="storeEmail"
              name="storeEmail"
              type="email"
              className="field-input"
              defaultValue={settings.storeEmail}
            />
          </Field>
          <Field label="Telefone" name="storePhone">
            <input
              id="storePhone"
              name="storePhone"
              className="field-input"
              defaultValue={settings.storePhone}
            />
          </Field>
          <Field label="CNPJ" name="storeCnpj">
            <input
              id="storeCnpj"
              name="storeCnpj"
              className="field-input"
              defaultValue={settings.storeCnpj}
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-[15px] font-bold text-ink-900">
          Pagamento por PIX
        </h2>
        <p className="mb-4 text-[13px] text-ink-500">
          A chave e os dados do recebedor entram no QR Code gerado no padrão do
          Banco Central.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Chave PIX (aleatória)"
              name="pixKey"
              hint="Formato UUID, como fornecido pelo banco."
            >
              <input
                id="pixKey"
                name="pixKey"
                className="field-input font-mono"
                defaultValue={settings.pixKey}
              />
            </Field>
          </div>
          <Field
            label="Nome do recebedor"
            name="pixMerchantName"
            hint="Máximo de 25 caracteres, sem acentos."
          >
            <input
              id="pixMerchantName"
              name="pixMerchantName"
              className="field-input"
              maxLength={25}
              defaultValue={settings.pixMerchantName}
            />
          </Field>
          <Field
            label="Cidade do recebedor"
            name="pixMerchantCity"
            hint="Máximo de 15 caracteres."
          >
            <input
              id="pixMerchantCity"
              name="pixMerchantCity"
              className="field-input"
              maxLength={15}
              defaultValue={settings.pixMerchantCity}
            />
          </Field>
          <Field label="Validade do QR Code (minutos)" name="pixExpiryMinutes">
            <input
              id="pixExpiryMinutes"
              name="pixExpiryMinutes"
              type="number"
              min={5}
              className="field-input"
              defaultValue={settings.pixExpiryMinutes}
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Frete, impostos e retirada
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Alíquota padrão de imposto (%)"
            name="defaultTaxPercent"
            error={errors.defaultTaxPercent}
          >
            <input
              id="defaultTaxPercent"
              name="defaultTaxPercent"
              className="field-input"
              inputMode="decimal"
              defaultValue={String(settings.defaultTaxBasisPoints / 100).replace(
                ".",
                ","
              )}
            />
          </Field>
          <Field
            label="Frete grátis a partir de (R$)"
            name="freeShippingAbove"
            hint="Use 0 para desativar."
          >
            <input
              id="freeShippingAbove"
              name="freeShippingAbove"
              className="field-input"
              inputMode="decimal"
              defaultValue={decimal(settings.freeShippingAboveCents)}
            />
          </Field>
          <Field label="Taxa base do frete (R$)" name="shippingBase">
            <input
              id="shippingBase"
              name="shippingBase"
              className="field-input"
              inputMode="decimal"
              defaultValue={decimal(settings.shippingBaseCents)}
            />
          </Field>
          <Field label="Valor por quilo (R$)" name="shippingPerKg">
            <input
              id="shippingPerKg"
              name="shippingPerKg"
              className="field-input"
              inputMode="decimal"
              defaultValue={decimal(settings.shippingPerKgCents)}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2 text-[14px] text-ink-700">
              <input
                type="checkbox"
                name="pickupEnabled"
                defaultChecked={settings.pickupEnabled}
                className="size-4 accent-brand-600"
              />
              Oferecer retirada no local
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Endereço de retirada" name="pickupAddress">
              <input
                id="pickupAddress"
                name="pickupAddress"
                className="field-input"
                defaultValue={settings.pickupAddress}
              />
            </Field>
          </div>
          <Field label="Horário de retirada" name="pickupHours">
            <input
              id="pickupHours"
              name="pickupHours"
              className="field-input"
              defaultValue={settings.pickupHours}
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink-900">
          Entrega de e-books
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Downloads permitidos por título" name="downloadMaxPerItem">
            <input
              id="downloadMaxPerItem"
              name="downloadMaxPerItem"
              type="number"
              min={1}
              className="field-input"
              defaultValue={settings.downloadMaxPerItem}
            />
          </Field>
          <Field label="Validade do link (dias)" name="downloadExpiryDays">
            <input
              id="downloadExpiryDays"
              name="downloadExpiryDays"
              type="number"
              min={1}
              className="field-input"
              defaultValue={settings.downloadExpiryDays}
            />
          </Field>
        </div>
      </section>

      <SubmitButton pending={pending} className="btn btn-primary" pendingLabel="Salvando…">
        Salvar configurações
      </SubmitButton>
    </form>
  );
}
