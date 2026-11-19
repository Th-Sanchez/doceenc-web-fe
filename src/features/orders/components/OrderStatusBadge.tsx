import type { OrderPaymentStatus, OrderStatus } from "@/api/types";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const paymentStyles: Record<OrderPaymentStatus, string> = {
  UNPAID: "bg-rose-50 text-rose-700",
  PARTIAL: "bg-amber-50 text-amber-800",
  PAID: "bg-emerald-50 text-emerald-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>{messages.orders.status[status]}</span>;
}

export function OrderPaymentBadge({ status }: { status: OrderPaymentStatus | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>;
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", paymentStyles[status])}>{messages.orders.paymentStatus[status]}</span>;
}
