"use client";

import { useState } from "react";

import { saveAddressAction } from "@/actions/auth";
import { useActionForm } from "./use-action-form";
import { UF_LIST } from "@/lib/constants";
import { onlyDigits } from "@/lib/cards";

import { SubmitButton } from "./submit-button";
import { Alert, Field } from "./ui";

type Address = {
  id: string;
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
};

export function AddressForm({ address }: { address?: Address }) {
  const { state, pending, onSubmit, action } = useActionForm(saveAddressAction);

  const [cep, setCep] = useState(address?.cep ?? "");
  const [street, setStreet] = useState(address?.street ?? "");
  const [district, setDistrict] = useState(address?.district ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [uf, setUf] = useState(address?.state ?? "");

  const errors = state?.errors ?? {};

  async function lookupCep(value: string) {
    const digits = onlyDigits(value);
    if (digits.length !== 8) return;
    try {
      const response = await fetch(`/api/cep/${digits}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.street) setStreet(data.street);
      if (data.district) setDistrict(data.district);
      if (data.city) setCity(data.city);
      if (data.state) setUf(data.state);
    } catch {
      // Sem conexão: o usuário preenche manualmente.
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {address && <input type="hidden" name="id" value={address.id} />}

      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Apelido" name="label" error={errors.label}>
          <input
            id="label"
            name="label"
            className="field-input"
            defaultValue={address?.label ?? "Casa"}
          />
        </Field>
        <Field label="Destinatário" name="recipient" error={errors.recipient}>
          <input
            id="recipient"
            name="recipient"
            className="field-input"
            defaultValue={address?.recipient ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="CEP" name="cep" error={errors.cep}>
          <input
            id="cep"
            name="cep"
            className="field-input"
            inputMode="numeric"
            maxLength={9}
            value={cep}
            onChange={(event) => {
              setCep(event.target.value);
              void lookupCep(event.target.value);
            }}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Logradouro" name="street" error={errors.street}>
            <input
              id="street"
              name="street"
              className="field-input"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Número" name="number" error={errors.number}>
          <input
            id="number"
            name="number"
            className="field-input"
            defaultValue={address?.number ?? ""}
          />
        </Field>
        <Field label="Complemento" name="complement">
          <input
            id="complement"
            name="complement"
            className="field-input"
            defaultValue={address?.complement ?? ""}
          />
        </Field>
        <Field label="Bairro" name="district" error={errors.district}>
          <input
            id="district"
            name="district"
            className="field-input"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Cidade" name="city" error={errors.city}>
            <input
              id="city"
              name="city"
              className="field-input"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </Field>
        </div>
        <Field label="UF" name="state" error={errors.state}>
          <select
            id="state"
            name="state"
            className="field-input"
            value={uf}
            onChange={(event) => setUf(event.target.value)}
          >
            <option value="">--</option>
            {UF_LIST.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <SubmitButton pending={pending} className="btn btn-primary" pendingLabel="Salvando…">
        {address ? "Salvar alterações" : "Adicionar endereço"}
      </SubmitButton>
    </form>
  );
}
