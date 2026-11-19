import { useState } from "react";
import type { Order, OrderPaymentMethod } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { messageForError, messages } from "@/i18n/messages";
import { parseDecimal } from "@/lib/decimal";
import { formatMoney, toIsoDate } from "@/lib/format";
import { useCancelOrder, useConfirmOrder, useRegisterOrderPayment, useVoidOrderPayment } from "../queries";

const t = messages.orders;
const methods: OrderPaymentMethod[] = ["PIX", "CASH", "CARD"];

function PaymentMethodSelect({ value, onChange, label }: { value: OrderPaymentMethod; onChange: (value: OrderPaymentMethod) => void; label: string }) {
  return (
    <Select aria-label={label} value={value} onChange={(event) => {
      const method = methods.find((option) => option === event.currentTarget.value);
      if (method) onChange(method);
    }}>
      {methods.map((method) => <option key={method} value={method}>{t.paymentMethod[method]}</option>)}
    </Select>
  );
}

export function ConfirmOrderDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useConfirmOrder();
  const [includePayment, setIncludePayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<OrderPaymentMethod>("PIX");
  const [paidOn, setPaidOn] = useState(toIsoDate(new Date()));
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = () => {
    setValidationError(null);
    let initialPayment;
    if (includePayment) {
      const parsed = parseDecimal(amount);
      if (parsed === null || parsed <= 0 || parsed > (order.balance ?? order.totalAmount ?? 0)) {
        setValidationError(t.payment.invalidAmount);
        return;
      }
      initialPayment = {
        amount: parsed,
        method,
        ...(paidOn ? { paidOn } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
    }

    mutation.mutate(
      { id: order.id, body: initialPayment ? { initialPayment } : {} },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle>{t.confirm.title}</DialogTitle>
          <DialogDescription className="mt-1">{t.confirm.description}</DialogDescription>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={includePayment} onChange={(event) => setIncludePayment(event.currentTarget.checked)} className="size-4 accent-primary" />
          {t.confirm.initialPayment}
        </label>
        {includePayment && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              {t.confirm.amount}
              <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.currentTarget.value)} />
            </label>
            <label className="grid gap-1.5 text-sm">
              {t.confirm.method}
              <PaymentMethodSelect label={t.confirm.method} value={method} onChange={setMethod} />
            </label>
            <label className="grid gap-1.5 text-sm">
              {t.confirm.paidOn}
              <Input type="date" value={paidOn} onChange={(event) => setPaidOn(event.currentTarget.value)} />
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              {t.confirm.notes}
              <Input value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
            </label>
          </div>
        )}
        {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{messageForError(mutation.error)}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t.confirm.cancel}</Button></DialogClose>
          <Button onClick={submit} disabled={mutation.isPending}>{mutation.isPending ? t.confirm.confirming : t.confirm.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordPaymentDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useRegisterOrderPayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<OrderPaymentMethod>("PIX");
  const [paidOn, setPaidOn] = useState(toIsoDate(new Date()));
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const balance = order.balance ?? 0;

  const submit = () => {
    const parsed = parseDecimal(amount);
    if (parsed === null || parsed <= 0 || parsed > balance) {
      setValidationError(t.payment.invalidAmount);
      return;
    }
    setValidationError(null);
    mutation.mutate(
      {
        id: order.id,
        body: { amount: parsed, method, ...(paidOn ? { paidOn } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}) },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle>{t.payment.title}</DialogTitle>
          <DialogDescription className="mt-1">{t.payment.description}</DialogDescription>
        </div>
        <p className="rounded-lg bg-[#fbf8f6] p-3 text-sm text-muted-foreground">{t.payment.remaining(formatMoney(balance))}</p>
        <label className="grid gap-1.5 text-sm">
          {t.payment.amount}
          <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.currentTarget.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            {t.payment.method}
            <PaymentMethodSelect label={t.payment.method} value={method} onChange={setMethod} />
          </label>
          <label className="grid gap-1.5 text-sm">
            {t.payment.paidOn}
            <Input type="date" value={paidOn} onChange={(event) => setPaidOn(event.currentTarget.value)} />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          {t.payment.notes}
          <Input value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
        </label>
        {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{messageForError(mutation.error)}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t.payment.cancel}</Button></DialogClose>
          <Button onClick={submit} disabled={mutation.isPending || balance <= 0}>{mutation.isPending ? t.payment.submitting : t.payment.submit}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelOrderDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useCancelOrder();
  const [refundMethod, setRefundMethod] = useState<OrderPaymentMethod>("PIX");
  const paidAmount = order.paidAmount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div>
          <DialogTitle>{t.cancelOrder.title}</DialogTitle>
          <DialogDescription className="mt-1">{t.cancelOrder.description}</DialogDescription>
        </div>
        {paidAmount > 0 && (
          <>
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t.cancelOrder.refund(formatMoney(paidAmount))}</p>
            <label className="grid gap-1.5 text-sm">
              {t.cancelOrder.refundMethod}
              <PaymentMethodSelect label={t.cancelOrder.refundMethod} value={refundMethod} onChange={setRefundMethod} />
            </label>
          </>
        )}
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{messageForError(mutation.error)}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t.cancelOrder.close}</Button></DialogClose>
          <Button variant="outline" className="text-destructive" onClick={() => mutation.mutate(
            { id: order.id, body: paidAmount > 0 ? { refundMethod } : {} },
            { onSuccess: () => onOpenChange(false) },
          )} disabled={mutation.isPending}>
            {mutation.isPending ? t.cancelOrder.cancelling : t.cancelOrder.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VoidPaymentDialog({ order, paymentId, open, onOpenChange }: { order: Order; paymentId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useVoidOrderPayment();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <DialogTitle>{t.detail.voidPaymentTitle}</DialogTitle>
          <DialogDescription className="mt-1">{t.detail.voidPaymentDescription}</DialogDescription>
        </div>
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{messageForError(mutation.error)}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t.payment.cancel}</Button></DialogClose>
          <Button variant="outline" className="text-destructive" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: order.id, paymentId }, { onSuccess: () => onOpenChange(false) })}>
            {mutation.isPending ? t.confirm.confirming : t.detail.confirmVoid}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
