"use client";

import { useState } from "react";

import { formatCents } from "@/lib/money";
import { formatEta } from "@/lib/format";

import { TruckIcon } from "./icons";

type Quote = {
  method: string;
  label: string;
  carrier: string;
  cents: number;
  etaDays: number;
  description: string;
};

/** Consulta de frete por CEP exibida na página do produto. */
export function ShippingCalculator({
  weightGrams,
  subtotalCents,
}: {
  weightGrams: number;
  subtotalCents: number;
}) {
  const [cep, setCep] = useState("");
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setQuotes(null);

    try {
      const response = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, weightGrams, subtotalCents }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível calcular o frete.");
        return;
      }
      setQuotes(data.quotes as Quote[]);
    } catch {
      setError("Falha de conexão ao calcular o frete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-800">
        <TruckIcon className="size-4.5 text-brand-600" />
        Calcular frete e prazo
      </p>

      <form onSubmit={calculate} className="mt-3 flex gap-2">
        <label htmlFor="cep-produto" className="sr-only">
          CEP de entrega
        </label>
        <input
          id="cep-produto"
          className="field-input"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          value={cep}
          onChange={(event) => setCep(event.target.value)}
        />
        <button type="submit" className="btn btn-dark btn-sm" disabled={loading}>
          {loading ? "Calculando…" : "Calcular"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-[12.5px] text-red-600" role="alert">
          {error}
        </p>
      )}

      {quotes && quotes.length > 0 && (
        <ul className="mt-3 divide-y divide-ink-200 text-[13px]">
          {quotes.map((quote) => (
            <li
              key={quote.method}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span>
                <span className="font-medium text-ink-800">{quote.label}</span>
                <span className="block text-[12px] text-ink-500">
                  {formatEta(quote.etaDays)}
                </span>
              </span>
              <span className="font-semibold text-ink-900">
                {quote.cents === 0 ? "Grátis" : formatCents(quote.cents)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
        Valores calculados a partir do peso do item e da região de destino, com
        origem em Campina Grande/PB.
      </p>
    </div>
  );
}
