"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { placeOrderAction, quoteShippingAction } from "@/actions/checkout";
import { useActionForm } from "./use-action-form";
import type { LoadedCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { formatEta } from "@/lib/format";
import { UF_LIST } from "@/lib/constants";
import {
  CARD_BRAND_LABEL,
  detectBrand,
  installmentOptions,
  onlyDigits,
} from "@/lib/cards";
import type { ShippingQuote } from "@/lib/shipping";

import { SubmitButton } from "./submit-button";
import { Alert, Field } from "./ui";
import { CardIcon, PixIcon, StoreIcon, TruckIcon } from "./icons";

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
  isDefault: boolean;
};

type Props = {
  cart: LoadedCart;
  customer: { name: string; email: string; cpf: string; phone: string } | null;
  addresses: Address[];
  pickupLabel: string;
};

const CARRIER_METHODS = ["PAC", "SEDEX", "TRANSPORTADORA"];

export function CheckoutForm({ cart, customer, addresses, pickupLabel }: Props) {
  const { state, pending, onSubmit, action } = useActionForm(placeOrderAction);

  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];

  const [cep, setCep] = useState(defaultAddress?.cep ?? "");
  const [street, setStreet] = useState(defaultAddress?.street ?? "");
  const [district, setDistrict] = useState(defaultAddress?.district ?? "");
  const [city, setCity] = useState(defaultAddress?.city ?? "");
  const [uf, setUf] = useState(defaultAddress?.state ?? "");
  const [number, setNumber] = useState(defaultAddress?.number ?? "");
  const [complement, setComplement] = useState(defaultAddress?.complement ?? "");

  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [shippingMethod, setShippingMethod] = useState<string>(
    cart.hasPhysicalItems ? "" : "DIGITAL"
  );
  const [quoting, setQuoting] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARTAO_CREDITO">(
    "PIX"
  );
  const [cardNumber, setCardNumber] = useState("");
  const [installments, setInstallments] = useState(1);

  const brand = detectBrand(cardNumber);

  const initialCep = defaultAddress?.cep ?? "";

  // Cotação inicial. Com endereço salvo, o frete já aparece calculado; sem CEP,
  // restam apenas retirada no local ou entrega digital.
  useEffect(() => {
    let active = true;
    quoteShippingAction(initialCep).then((result) => {
      if (!active) return;
      setQuotes(result.quotes);

      // Só pré-seleciona quando há uma escolha significativa: pedido digital
      // ou frete efetivamente calculado para um CEP conhecido.
      const preselect =
        !cart.hasPhysicalItems || onlyDigits(initialCep).length === 8;
      if (preselect && result.quotes[0]) {
        setShippingMethod(result.quotes[0].method);
      }
    });
    return () => {
      active = false;
    };
  }, [initialCep, cart.hasPhysicalItems]);

  /**
   * Assim que o CEP fica completo, busca o endereço e recalcula o frete. É
   * disparado pelo próprio evento de digitação, não por efeito colateral.
   */
  async function handleCepChange(value: string) {
    setCep(value);

    const digits = onlyDigits(value);
    if (!cart.hasPhysicalItems || digits.length !== 8) return;

    setQuoting(true);
    setCepMessage(null);

    try {
      const response = await fetch(`/api/cep/${digits}`);
      if (response.ok) {
        const data = await response.json();
        if (data.street) setStreet((current) => current || data.street);
        if (data.district) setDistrict((current) => current || data.district);
        if (data.city) setCity(data.city);
        if (data.state) setUf(data.state);
      } else {
        const data = await response.json().catch(() => ({}));
        setCepMessage(data.error ?? "Preencha o endereço manualmente.");
      }
    } catch {
      setCepMessage("Preencha o endereço manualmente.");
    }

    const result = await quoteShippingAction(digits);
    setQuotes(result.quotes);
    setQuoting(false);
    setShippingMethod((current) =>
      result.quotes.some((quote) => quote.method === current)
        ? current
        : (result.quotes[0]?.method ?? "")
    );
  }

  const selectedQuote = quotes.find((quote) => quote.method === shippingMethod);
  const shippingCents = selectedQuote?.cents ?? 0;
  const totalCents = cart.subtotalCents + cart.taxCents + shippingCents;
  const needsAddress = CARRIER_METHODS.includes(shippingMethod);

  const options = useMemo(() => installmentOptions(totalCents), [totalCents]);
  // O número de parcelas disponíveis muda com o total; o valor exibido é
  // derivado, evitando um estado que possa ficar fora da faixa válida.
  const selectedInstallments = Math.min(
    installments,
    Math.max(1, options.length)
  );

  const errors = state?.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {state && !state.ok && <Alert tone="error">{state.message}</Alert>}

        {/* Cliente */}
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">1. Seus dados</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" name="customerName" error={errors.customerName}>
              <input
                id="customerName"
                name="customerName"
                className="field-input"
                defaultValue={customer?.name ?? ""}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="E-mail" name="customerEmail" error={errors.customerEmail}>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                className="field-input"
                defaultValue={customer?.email ?? ""}
                autoComplete="email"
                required
              />
            </Field>
            <Field
              label="CPF"
              name="customerCpf"
              error={errors.customerCpf}
              hint="Necessário para emissão da nota fiscal."
            >
              <input
                id="customerCpf"
                name="customerCpf"
                className="field-input"
                defaultValue={customer?.cpf ?? ""}
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
            </Field>
            <Field label="Telefone" name="customerPhone" error={errors.customerPhone}>
              <input
                id="customerPhone"
                name="customerPhone"
                className="field-input"
                defaultValue={customer?.phone ?? ""}
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </Field>
          </div>

          {!customer && (
            <p className="mt-3 text-[13px] text-ink-500">
              Já tem conta?{" "}
              <Link
                href="/conta/login?next=/checkout"
                className="font-medium text-brand-700 hover:underline"
              >
                Entre para agilizar o preenchimento
              </Link>
              .
            </p>
          )}
        </section>

        {/* Entrega */}
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">2. Entrega</h2>

          {!cart.hasPhysicalItems ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-[13.5px] text-brand-900">
              Seu pedido contém apenas itens digitais. O link de download é
              liberado automaticamente após a aprovação do pagamento. Não há
              frete.
              <input type="hidden" name="shippingMethod" value="DIGITAL" />
            </div>
          ) : (
            <>
              {addresses.length > 0 && (
                <div className="mt-4">
                  <label className="field-label" htmlFor="endereco-salvo">
                    Usar um endereço salvo
                  </label>
                  <select
                    id="endereco-salvo"
                    className="field-input"
                    defaultValue={defaultAddress?.id ?? ""}
                    onChange={(event) => {
                      const found = addresses.find(
                        (item) => item.id === event.target.value
                      );
                      if (!found) return;
                      setStreet(found.street);
                      setDistrict(found.district);
                      setCity(found.city);
                      setUf(found.state);
                      setNumber(found.number);
                      setComplement(found.complement ?? "");
                      setCep(found.cep);
                    }}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} — {address.street}, {address.number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="CEP" name="shipCep" error={errors.shipCep}>
                  <input
                    id="shipCep"
                    name="shipCep"
                    className="field-input"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="00000-000"
                    value={cep}
                    onChange={(event) => void handleCepChange(event.target.value)}
                    autoComplete="postal-code"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Logradouro" name="shipStreet" error={errors.shipStreet}>
                    <input
                      id="shipStreet"
                      name="shipStreet"
                      className="field-input"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      autoComplete="address-line1"
                    />
                  </Field>
                </div>
                <Field label="Número" name="shipNumber" error={errors.shipNumber}>
                  <input
                    id="shipNumber"
                    name="shipNumber"
                    className="field-input"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                  />
                </Field>
                <Field label="Complemento" name="shipComplement">
                  <input
                    id="shipComplement"
                    name="shipComplement"
                    className="field-input"
                    value={complement}
                    onChange={(event) => setComplement(event.target.value)}
                  />
                </Field>
                <Field label="Bairro" name="shipDistrict" error={errors.shipDistrict}>
                  <input
                    id="shipDistrict"
                    name="shipDistrict"
                    className="field-input"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Cidade" name="shipCity" error={errors.shipCity}>
                    <input
                      id="shipCity"
                      name="shipCity"
                      className="field-input"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                    />
                  </Field>
                </div>
                <Field label="UF" name="shipState" error={errors.shipState}>
                  <select
                    id="shipState"
                    name="shipState"
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

              {cepMessage && (
                <p className="mt-2 text-[12.5px] text-amber-700">{cepMessage}</p>
              )}

              <fieldset className="mt-6">
                <legend className="field-label">Forma de entrega</legend>

                {quoting && (
                  <p className="text-[13px] text-ink-500">Calculando frete…</p>
                )}

                {!quoting && quotes.length === 0 && (
                  <p className="text-[13px] text-ink-500">
                    Informe o CEP para ver as opções de entrega.
                  </p>
                )}

                <div className="space-y-2">
                  {quotes.map((quote) => (
                    <label
                      key={quote.method}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                        shippingMethod === quote.method
                          ? "border-brand-500 bg-brand-50"
                          : "border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={quote.method}
                        checked={shippingMethod === quote.method}
                        onChange={() => setShippingMethod(quote.method)}
                        className="mt-1 size-4 accent-brand-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                          {quote.method === "RETIRADA_LOCAL" ? (
                            <StoreIcon className="size-4.5 text-brand-600" />
                          ) : (
                            <TruckIcon className="size-4.5 text-brand-600" />
                          )}
                          {quote.label}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-500">
                          {quote.method === "RETIRADA_LOCAL"
                            ? pickupLabel
                            : `${quote.description} · ${formatEta(quote.etaDays)}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-[14px] font-bold text-ink-900">
                        {quote.cents === 0 ? "Grátis" : formatCents(quote.cents)}
                      </span>
                    </label>
                  ))}
                </div>

                {errors.shippingMethod && (
                  <p className="field-error">{errors.shippingMethod}</p>
                )}
              </fieldset>
            </>
          )}
        </section>

        {/* Pagamento */}
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">3. Pagamento</h2>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  value: "PIX",
                  label: "PIX",
                  description: "QR Code e código copia e cola",
                  icon: <PixIcon className="size-5" />,
                },
                {
                  value: "CARTAO_CREDITO",
                  label: "Cartão de crédito",
                  description: "Visa, MasterCard, Elo, Hipercard, Amex, Diners",
                  icon: <CardIcon className="size-5" />,
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  paymentMethod === option.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mt-1 size-4 accent-brand-600"
                />
                <span>
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                    <span className="text-brand-600">{option.icon}</span>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-500">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {paymentMethod === "PIX" ? (
            <p className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-4 text-[13.5px] leading-relaxed text-ink-600">
              Ao confirmar o pedido, você verá o QR Code e o código copia e cola
              para pagar por PIX. O pedido fica reservado enquanto o pagamento não
              é confirmado.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Número do cartão"
                  name="cardNumber"
                  error={errors.cardNumber}
                  hint={
                    brand
                      ? `Bandeira identificada: ${CARD_BRAND_LABEL[brand]}`
                      : "Aceitamos Visa, MasterCard, Elo, Hipercard, Amex e Diners."
                  }
                >
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    className="field-input font-mono"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(event) => {
                      const digits = onlyDigits(event.target.value).slice(0, 19);
                      setCardNumber(
                        digits.replace(/(.{4})/g, "$1 ").trim()
                      );
                    }}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Nome impresso no cartão" name="cardHolder" error={errors.cardHolder}>
                  <input
                    id="cardHolder"
                    name="cardHolder"
                    className="field-input uppercase"
                    autoComplete="cc-name"
                  />
                </Field>
              </div>

              <Field label="Validade (MM/AA)" name="cardExpiry" error={errors.cardExpiry}>
                <input
                  id="cardExpiry"
                  name="cardExpiry"
                  className="field-input"
                  placeholder="12/30"
                  autoComplete="cc-exp"
                  maxLength={7}
                />
              </Field>

              <Field label="CVV" name="cardCvv" error={errors.cardCvv}>
                <input
                  id="cardCvv"
                  name="cardCvv"
                  className="field-input"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  placeholder="123"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Parcelamento" name="installments">
                  <select
                    id="installments"
                    name="installments"
                    className="field-input"
                    value={selectedInstallments}
                    onChange={(event) => setInstallments(Number(event.target.value))}
                  >
                    {options.map((option) => (
                      <option key={option.count} value={option.count}>
                        {option.count === 1
                          ? `1x de ${formatCents(option.totalCents)} à vista`
                          : option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-lg bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-600 sm:col-span-2">
                <p className="font-semibold text-ink-800">
                  Cartões de teste (ambiente sandbox)
                </p>
                <p className="mt-1">
                  Aprovado: <code>4111 1111 1111 1111</code> ·{" "}
                  <code>6362 9700 0045 7013</code> (Elo)
                  <br />
                  Recusado: <code>4000 0000 0000 0002</code> ·{" "}
                  <code>5555 5555 5555 0004</code>
                  <br />
                  Use qualquer validade futura e CVV de 3 dígitos.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5">
            <Field label="Observações do pedido (opcional)" name="notes">
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="field-input"
                placeholder="Ponto de referência, dados para nota fiscal, etc."
              />
            </Field>
          </div>
        </section>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-ink-900">Resumo</h2>

          <ul className="mt-3 divide-y divide-ink-100">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex gap-3 py-3">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-10.5 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink-900">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-ink-500">
                    {item.availableQuantity} × {formatCents(item.unitCents)}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-ink-900">
                  {formatCents(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2 border-t border-ink-100 pt-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd>{formatCents(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Impostos</dt>
              <dd>{formatCents(cart.taxCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Frete</dt>
              <dd>
                {selectedQuote
                  ? shippingCents === 0
                    ? "Grátis"
                    : formatCents(shippingCents)
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="text-2xl font-bold text-ink-900">
              {formatCents(totalCents)}
            </span>
          </div>

          {paymentMethod === "CARTAO_CREDITO" && selectedInstallments > 1 && (
            <p className="mt-1 text-right text-[12.5px] text-ink-500">
              {selectedInstallments}x de{" "}
              {formatCents(Math.floor(totalCents / selectedInstallments))} sem juros
            </p>
          )}

          <SubmitButton
        pending={pending}
            className="btn btn-primary mt-5 w-full"
            pendingLabel="Processando pagamento…"
            disabled={
              cart.itemCount === 0 ||
              (cart.hasPhysicalItems && !shippingMethod) ||
              (needsAddress && onlyDigits(cep).length !== 8)
            }
          >
            {paymentMethod === "PIX" ? "Gerar PIX e finalizar" : "Pagar e finalizar"}
          </SubmitButton>

          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-ink-500">
            Ao finalizar, você concorda com as condições de venda da COMPIA
            Editora. Transação processada em ambiente de testes.
          </p>
        </div>
      </aside>
    </form>
  );
}
