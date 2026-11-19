import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Pencil, Phone, ReceiptText, Store, Truck, UserRound, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCustomer } from "@/features/customers/queries";
import type { OrderPayment } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { messageForError, messages } from "@/i18n/messages";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderProductImage } from "../components/OrderProductImage";
import { CancelOrderDialog, ConfirmOrderDialog, RecordPaymentDialog, VoidPaymentDialog } from "../components/OrderDialogs";
import { OrderPaymentBadge, OrderStatusBadge } from "../components/OrderStatusBadge";
import { useDeliverOrder, useOrder } from "../queries";

const t = messages.orders;

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function PaymentHistoryItem({ payment, onVoid }: { payment: OrderPayment; onVoid: (paymentId: string) => void }) {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-0">
      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${payment.type === "REFUND" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
        <Wallet aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{payment.type === "REFUND" ? "Devolução" : t.paymentMethod[payment.method]}</p>
          {payment.voidedAt && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Anulado</span>}
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(payment.paidOn)}{payment.notes ? ` · ${payment.notes}` : ""}</p>
      </div>
      <span className={`whitespace-nowrap text-sm font-bold ${payment.type === "REFUND" ? "text-rose-700" : ""}`}>
        {payment.type === "REFUND" ? "−" : ""}{formatMoney(payment.amount)}
      </span>
      {payment.type === "PAYMENT" && !payment.voidedAt && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onVoid(payment.id)}>{t.detail.voidPayment}</Button>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useOrder(id);
  const customer = useCustomer(order.data?.customer.id);
  const deliver = useDeliverOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [voidPaymentId, setVoidPaymentId] = useState<string | null>(null);

  if (order.isPending) return <div role="status" aria-label={messages.loading} className="h-[520px] animate-pulse rounded-2xl bg-card" />;
  if (order.isError || !order.data) {
    return (
      <div role="alert" className="rounded-xl border bg-card p-6">
        <p className="text-sm text-destructive">{messageForError(order.error) || t.detail.loadError}</p>
        <Button variant="outline" className="mt-3" onClick={() => void order.refetch()}>{t.detail.retry}</Button>
        <Link to="/orders" className="ml-3 text-sm font-semibold text-primary">{t.detail.back}</Link>
      </div>
    );
  }

  const value = order.data;
  const canCancel = value.status === "PENDING" || value.status === "CONFIRMED";
  const canRegisterPayment = value.status !== "CANCELLED" && (value.balance ?? 0) > 0;
  const createdAt = formatDateTime(value.createdAt);
  const confirmedAt = formatDateTime(value.confirmedAt);
  const deliveredAt = formatDateTime(value.deliveredAt);
  const cancelledAt = formatDateTime(value.cancelledAt);

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5 pb-28 lg:pb-0">
      <header className="hidden flex-col gap-2 lg:flex">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px]">
          <Link to="/orders" className="font-bold text-muted-foreground">{t.detail.back}</Link>
          <span aria-hidden className="text-[#dac0c3]">/</span>
          <span className="font-bold text-primary">#{value.orderNumber}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{t.detail.title}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Pedido #{value.orderNumber}</h1>
          </div>
          <div className="flex items-center gap-2"><OrderStatusBadge status={value.status} /><OrderPaymentBadge status={value.paymentStatus} /></div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.detail.title}</p>
          <h1 className="font-display text-2xl font-bold">Pedido #{value.orderNumber}</h1>
        </div>
        <OrderStatusBadge status={value.status} />
      </div>

      {deliver.isError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-destructive">{messageForError(deliver.error)}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f9d8d2] text-primary"><UserRound aria-hidden className="size-5" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.detail.customer}</p>
                  <h2 className="font-display text-lg font-bold">{value.customer.name}</h2>
                  {value.customer.storeName && <p className="text-sm text-muted-foreground">{value.customer.storeName}</p>}
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-[#f5f3f0] px-2.5 py-1 text-xs font-semibold">
                {value.customer.type === "WHOLESALE" ? <Store aria-hidden className="size-3.5" /> : <UserRound aria-hidden className="size-3.5" />}
                {value.customer.type === "WHOLESALE" ? "Lojista" : "Varejo"}
              </span>
            </div>
            <div className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
              {customer.isError ? (
                <p role="alert" className="text-xs text-destructive">{messageForError(customer.error)}</p>
              ) : customer.data?.phone ? (
                <p className="flex items-center gap-2 text-muted-foreground"><Phone aria-hidden className="size-4 shrink-0" />{customer.data.phone}</p>
              ) : null}
              <p className="flex items-center gap-2 text-muted-foreground"><Truck aria-hidden className="size-4 shrink-0" />{t.fulfillment[value.fulfillmentType]}</p>
              {value.fulfillmentType === "DELIVERY" && (
                <p className="flex items-start gap-2 text-muted-foreground sm:col-span-2"><MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />{value.deliveryAddress || t.detail.noAddress}</p>
              )}
              <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden className="size-4 shrink-0" />{value.deliveryDate ? formatDate(value.deliveryDate) : "—"}</p>
              {value.priceChannel && <p className="flex items-center gap-2 text-muted-foreground"><ReceiptText aria-hidden className="size-4 shrink-0" />{t.detail.priceChannel}: {value.priceChannel === "WHOLESALE" ? "Lojista" : "Varejo"}</p>}
            </div>
            {value.notes && <div className="rounded-lg bg-[#fbf8f6] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.detail.notes}</p><p className="mt-1 whitespace-pre-wrap text-sm">{value.notes}</p></div>}
          </Card>

          <Card className="rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t.detail.orderItems}</h2>
              <span className="text-xs text-muted-foreground">{t.items(value.items.length)}</span>
            </div>
            <div className="divide-y">
              {value.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <OrderProductImage name={item.productName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} × {item.unitPrice === null ? "—" : formatMoney(item.unitPrice)}</p>
                    {item.issue && <p className="text-xs text-destructive">{t.form.priceIssue}</p>}
                  </div>
                  <span className="text-sm font-semibold">{item.subtotal === null ? "—" : formatMoney(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold">{t.detail.paymentHistory}</h2>
            {value.payments.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">{t.detail.noPayments}</p>
            ) : (
              <div className="mt-1">
                {value.payments.map((payment) => (
                  <PaymentHistoryItem key={payment.id} payment={payment} onVoid={setVoidPaymentId} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold">{t.detail.summary}</h2>
            <SummaryRow label={t.detail.total} value={value.totalAmount === null ? "—" : formatMoney(value.totalAmount)} />
            <SummaryRow label={t.detail.paid} value={formatMoney(value.paidAmount ?? 0)} />
            <div className="border-t pt-3">
              <SummaryRow label={t.detail.balance} value={formatMoney(value.balance ?? 0)} strong />
            </div>
          </Card>

          <Card className="flex flex-col gap-3 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold">{t.detail.actions}</h2>
            {value.status === "PENDING" && (
              <>
                <Button variant="outline" onClick={() => navigate(`/orders/${value.id}/edit`)}><Pencil aria-hidden className="size-4" />{t.form.editTitle}</Button>
                <Button onClick={() => setConfirmOpen(true)}><CheckCircle2 aria-hidden className="size-4" />{t.detail.confirm}</Button>
              </>
            )}
            {value.status === "CONFIRMED" && (
              <Button onClick={() => deliver.mutate(value.id)} disabled={deliver.isPending}>
                <CheckCircle2 aria-hidden className="size-4" />{deliver.isPending ? messages.loading : t.detail.deliver}
              </Button>
            )}
            {canRegisterPayment && <Button variant={value.status === "PENDING" ? "outline" : "default"} onClick={() => setPaymentOpen(true)}><Wallet aria-hidden className="size-4" />{t.detail.registerPayment}</Button>}
            {canCancel && <Button variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>{t.detail.cancel}</Button>}
          </Card>

          <Card className="flex flex-col gap-2 rounded-2xl border-0 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold">Histórico</h2>
            <Timeline icon={Clock3} label={t.detail.created} value={createdAt} />
            {confirmedAt && <Timeline icon={CheckCircle2} label={t.detail.confirmed} value={confirmedAt} />}
            {deliveredAt && <Timeline icon={Truck} label={t.detail.delivered} value={deliveredAt} />}
            {cancelledAt && <Timeline icon={Clock3} label={t.detail.cancelled} value={cancelledAt} />}
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card p-3 lg:hidden">
        <Button variant="outline" className="flex-1" onClick={() => navigate("/orders")}><ArrowLeft aria-hidden className="size-4" />{t.detail.back}</Button>
        {value.status === "PENDING" && <Button className="flex-1" onClick={() => setConfirmOpen(true)}>{t.detail.confirm}</Button>}
        {canRegisterPayment && <Button className="flex-1" onClick={() => setPaymentOpen(true)}>{t.detail.registerPayment}</Button>}
      </div>

      <ConfirmOrderDialog order={value} open={confirmOpen} onOpenChange={setConfirmOpen} />
      <RecordPaymentDialog order={value} open={paymentOpen} onOpenChange={setPaymentOpen} />
      <CancelOrderDialog order={value} open={cancelOpen} onOpenChange={setCancelOpen} />
      {voidPaymentId && <VoidPaymentDialog order={value} paymentId={voidPaymentId} open onOpenChange={(open) => { if (!open) setVoidPaymentId(null); }} />}
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className={strong ? "font-bold text-primary" : "font-semibold"}>{value}</span></div>;
}

function Timeline({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string | null }) {
  if (!value) return null;
  return <p className="flex items-center gap-2 py-1 text-xs text-muted-foreground"><Icon aria-hidden className="size-4 shrink-0" /><span className="font-medium text-foreground">{label}:</span>{value}</p>;
}
