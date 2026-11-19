import { CalendarDays, LoaderCircle, MapPin, Minus, Plus, Save, ShoppingBag, Store, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { FormEvent } from "react";
import type { OrderFulfillmentType } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/queries";
import { useProducts } from "@/features/products/queries";
import { messageForError, messages } from "@/i18n/messages";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OrderProductImage } from "../components/OrderProductImage";
import { useCreateOrder, useOrder, useOrderSimulation, useUpdateOrder } from "../queries";
import { emptyOrderDraft, type OrderDraft } from "../schemas";
import { toOrderInput, validateOrderDraft } from "../payload";

const t = messages.orders;

export function OrderFormPage() {
  const { id } = useParams();
  const isEditing = id !== undefined;
  const navigate = useNavigate();
  const order = useOrder(id);
  const customers = useCustomers();
  const products = useProducts();
  const create = useCreateOrder();
  const update = useUpdateOrder();
  const initialDraft = useMemo<OrderDraft>(() => order.data ? {
    customerId: order.data.customer.id,
    fulfillmentType: order.data.fulfillmentType,
    deliveryAddress: order.data.deliveryAddress ?? "",
    deliveryDate: order.data.deliveryDate ?? "",
    notes: order.data.notes ?? "",
    items: order.data.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  } : emptyOrderDraft, [order.data]);
  const [draftOverride, setDraftOverride] = useState<OrderDraft | null>(null);
  const draft = draftOverride ?? initialDraft;
  const [selectedProductId, setSelectedProductId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const setDraft = (next: OrderDraft | ((current: OrderDraft) => OrderDraft)) =>
    setDraftOverride((current) => typeof next === "function" ? next(current ?? initialDraft) : next);

  const activeCustomers = customers.data?.filter((customer) => customer.active) ?? [];
  const availableProducts = products.data?.filter((product) => product.active) ?? [];
  const selectedCustomer = customers.data?.find((customer) => customer.id === draft.customerId);
  const simulationInput = useMemo(() => {
    if (!draft.customerId || draft.items.length === 0 || draft.items.some((item) => item.quantity < 1)) return null;
    return { customerId: draft.customerId, items: draft.items.map(({ productId, quantity }) => ({ productId, quantity })) };
  }, [draft.customerId, draft.items]);
  const simulation = useOrderSimulation(simulationInput);

  const updateDraft = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setFormError(null);
  };

  const addProduct = () => {
    if (!selectedProductId) return;
    setDraft((current) => {
      const existing = current.items.find((item) => item.productId === selectedProductId);
      return {
        ...current,
        items: existing
          ? current.items.map((item) => item.productId === selectedProductId ? { ...item, quantity: item.quantity + 1 } : item)
          : [...current.items, { productId: selectedProductId, quantity: 1 }],
      };
    });
    setSelectedProductId("");
    setFormError(null);
    setFieldErrors((current) => ({ ...current, items: "" }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const result = validateOrderDraft(draft);
    if (!result.success) {
      const errors = Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0] ?? "items"), issue.message]));
      setFieldErrors(errors);
      return;
    }

    const body = toOrderInput(result.data);
    const callbacks = {
      onSuccess: (saved: { id: string }) => navigate(`/orders/${saved.id}`),
      onError: (error: unknown) => setFormError(messageForError(error)),
    };
    if (id) update.mutate({ id, ...body }, callbacks);
    else create.mutate(body, callbacks);
  };

  const saving = create.isPending || update.isPending;
  const pageError = customers.isError ? customers.error : products.isError ? products.error : order.isError ? order.error : null;
  const showLoadError = Boolean(pageError);
  const editAllowed = !isEditing || order.data?.status === "PENDING";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 pb-24 lg:pb-0">
      <header className="hidden flex-col gap-1 lg:flex">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px]">
          <Link to="/orders" className="font-bold text-muted-foreground">{t.form.back}</Link>
          <span aria-hidden className="text-[#dac0c3]">/</span>
          <span className="font-bold text-primary">{isEditing ? t.form.editTitle : t.form.newTitle}</span>
        </nav>
        <h1 className="font-display text-3xl font-bold tracking-tight">{isEditing ? t.form.editTitle : t.form.newTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.form.subtitle}</p>
      </header>

      <div className="flex items-center gap-3 rounded-xl bg-[#f9d8d2] p-4 lg:hidden">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary"><ShoppingBag aria-hidden className="size-5" /></span>
        <p className="text-sm font-medium text-[#554245]">{t.form.subtitle}</p>
      </div>

      {isEditing && order.isPending && <div role="status" aria-label={messages.loading} className="h-52 animate-pulse rounded-2xl bg-card" />}
      {showLoadError && <p role="alert" className="rounded-xl border bg-card p-5 text-sm text-destructive">{messageForError(pageError)} <Link to="/orders" className="font-semibold underline">{t.form.back}</Link></p>}
      {isEditing && order.data && !editAllowed && (
        <div role="alert" className="rounded-xl border bg-card p-5 text-sm">
          <p className="font-semibold">{t.form.editUnavailable}</p>
          <Link to={`/orders/${id}`} className="mt-2 inline-flex text-primary underline">{t.form.back}</Link>
        </div>
      )}

      {!showLoadError && editAllowed && (
        <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-5 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
              <Field id="order-customer" label={t.form.customer} required error={fieldErrors.customerId}>
                <Select
                  id="order-customer"
                  value={draft.customerId}
                  onChange={(event) => updateDraft("customerId", event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.customerId)}
                  className="h-12 rounded-xl bg-[#f5f3f0]"
                >
                  <option value="">{t.form.chooseCustomer}</option>
                  {order.data && customers.data && !activeCustomers.some((customer) => customer.id === order.data?.customer.id) && (
                    <option value={order.data.customer.id}>{order.data.customer.name} · Arquivado</option>
                  )}
                  {activeCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}{customer.storeName ? ` · ${customer.storeName}` : ""}</option>
                  ))}
                </Select>
              </Field>

              {selectedCustomer && (
                <p className="flex items-center gap-2 rounded-lg bg-[#fbf8f6] px-3 py-2 text-sm text-muted-foreground">
                  {selectedCustomer.type === "WHOLESALE" ? <Store aria-hidden className="size-4" /> : <ShoppingBag aria-hidden className="size-4" />}
                  {selectedCustomer.storeName ?? selectedCustomer.name}
                </p>
              )}

              <fieldset>
                <legend className="mb-2 text-sm font-medium">{t.form.fulfillment}</legend>
                <div role="radiogroup" aria-label={t.form.fulfillment} className="grid grid-cols-2 gap-2 rounded-xl bg-[#f5f3f0] p-1">
                  {(["PICKUP", "DELIVERY"] as const).map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="fulfillment"
                        value={value}
                        checked={draft.fulfillmentType === value}
                        onChange={() => updateDraft("fulfillmentType", value satisfies OrderFulfillmentType)}
                        className="peer sr-only"
                      />
                      <span className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#715954] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring", draft.fulfillmentType === value && "bg-card text-primary shadow-sm")}>
                        {value === "PICKUP" ? <Store aria-hidden className="size-4" /> : <MapPin aria-hidden className="size-4" />}
                        {value === "PICKUP" ? t.form.pickup : t.form.delivery}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {draft.fulfillmentType === "DELIVERY" && (
                <Field id="order-address" label={t.form.deliveryAddress} required error={fieldErrors.deliveryAddress}>
                  <Input
                    id="order-address"
                    value={draft.deliveryAddress}
                    onChange={(event) => updateDraft("deliveryAddress", event.currentTarget.value)}
                    placeholder={t.form.addressPlaceholder}
                    aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                    className="h-12 rounded-xl border-0 bg-[#f5f3f0]"
                  />
                </Field>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="order-delivery-date" label={t.form.deliveryDate} error={fieldErrors.deliveryDate}>
                  <Input id="order-delivery-date" type="date" value={draft.deliveryDate} onChange={(event) => updateDraft("deliveryDate", event.currentTarget.value)} className="h-12 rounded-xl border-0 bg-[#f5f3f0]" />
                </Field>
                <div className="hidden items-end text-xs text-muted-foreground sm:flex"><CalendarDays aria-hidden className="mr-2 size-4" />{t.form.deliveryDate}</div>
              </div>

              <Field id="order-notes" label={t.form.notes} error={fieldErrors.notes}>
                <textarea
                  id="order-notes"
                  value={draft.notes}
                  onChange={(event) => updateDraft("notes", event.currentTarget.value)}
                  placeholder={t.form.notesPlaceholder}
                  rows={3}
                  className="w-full resize-y rounded-xl border-0 bg-[#f5f3f0] px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>
            </Card>

            <Card className="flex flex-col gap-4 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">{t.form.items}</h2>
                  <p className="text-xs text-muted-foreground">{t.items(draft.items.length)}</p>
                </div>
              </div>
              {draft.items.length === 0 && <p className="rounded-lg bg-[#fbf8f6] px-4 py-6 text-center text-sm text-muted-foreground">{t.form.noItems}</p>}
              <div className="flex flex-col divide-y">
                {draft.items.map((item) => {
                  const product = products.data?.find((entry) => entry.id === item.productId);
                  const simulatedItem = simulation.data?.items.find((entry) => entry.productId === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <OrderProductImage name={product?.name ?? simulatedItem?.productName ?? ""} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{product?.name ?? simulatedItem?.productName ?? "Produto"}</p>
                        <p className="text-xs text-muted-foreground">
                          {simulatedItem?.issue ? t.form.priceIssue : simulatedItem?.unitPrice === null || simulatedItem?.unitPrice === undefined ? "—" : formatMoney(simulatedItem.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="sm" className="size-9 px-0" aria-label={t.form.quantity} onClick={() => updateDraft("items", draft.items.map((entry) => entry.productId === item.productId ? { ...entry, quantity: Math.max(0, entry.quantity - 1) } : entry))}><Minus aria-hidden className="size-3.5" /></Button>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          aria-label={`${t.form.quantity}: ${product?.name ?? ""}`}
                          value={item.quantity || ""}
                          onChange={(event) => {
                            const quantity = Number.parseInt(event.currentTarget.value, 10) || 0;
                            updateDraft("items", draft.items.map((entry) => entry.productId === item.productId ? { ...entry, quantity } : entry));
                          }}
                          className="h-9 w-14 rounded-lg px-2 text-center"
                        />
                        <Button type="button" variant="outline" size="sm" className="size-9 px-0" aria-label={t.form.quantity} onClick={() => updateDraft("items", draft.items.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry))}><Plus aria-hidden className="size-3.5" /></Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="size-9 px-0" aria-label={t.form.removeItem} onClick={() => updateDraft("items", draft.items.filter((entry) => entry.productId !== item.productId))}><Trash2 aria-hidden className="size-4 text-muted-foreground" /></Button>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Select aria-label={t.form.chooseProduct} value={selectedProductId} onChange={(event) => setSelectedProductId(event.currentTarget.value)} className="rounded-xl bg-[#f5f3f0]">
                  <option value="">{t.form.chooseProduct}</option>
                  {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </Select>
                <Button type="button" variant="outline" onClick={addProduct} disabled={!selectedProductId}><Plus aria-hidden className="size-4" /><span className="hidden sm:inline">{t.form.addItem}</span></Button>
              </div>
              {fieldErrors.items && <p role="alert" className="text-sm text-destructive">{fieldErrors.items}</p>}
              {simulation.data?.items.some((item) => item.issue) && <p role="alert" className="text-sm text-destructive">{t.form.itemPriceError}</p>}
              {simulation.isError && <p role="alert" className="text-sm text-destructive">{messageForError(simulation.error)}</p>}
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="flex flex-col gap-4 rounded-2xl border-0 p-5 shadow-sm sm:p-6 lg:sticky lg:top-20">
              <h2 className="font-display text-lg font-bold">{t.form.total}</h2>
              {simulation.isFetching && <p role="status" className="text-sm text-muted-foreground">{messages.loading}</p>}
              <p className="font-display text-3xl font-bold text-primary">{simulation.data ? formatMoney(simulation.data.totalAmount) : "—"}</p>
              {simulation.data && (
                <p className="rounded-lg bg-[#fbf8f6] px-3 py-2 text-sm text-muted-foreground">
                  {t.form.priceChannel}: <span className="font-semibold text-foreground">{simulation.data.priceChannel === "WHOLESALE" ? "Lojista" : "Varejo"}</span>
                </p>
              )}
              {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" disabled={saving || showLoadError || !editAllowed} className="h-12 rounded-xl">
                {saving ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
                {saving ? t.form.saving : t.form.save}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/orders")} className="hidden lg:inline-flex">{t.form.back}</Button>
            </Card>
          </aside>
        </form>
      )}
    </div>
  );
}
