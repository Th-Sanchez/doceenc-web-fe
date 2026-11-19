import { Banknote, CalendarDays, ChevronRight, ShoppingBag, Truck, Wallet, BellRing, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import type { Dashboard } from "@/api/types";
import { Card } from "@/components/ui/card";
import { orderListHref } from "@/features/orders/listFilters";
import { messages } from "@/i18n/messages";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { monthName, shortDate, weekdayAndDate } from "../dates";

const t = messages.dashboard;

type Tone = "neutral" | "alert" | "warning";

const tones: Record<Tone, string> = {
  neutral: "text-foreground",
  alert: "text-destructive",
  warning: "text-amber-700",
};

function CardShell({ className, to, children }: { className?: string; to?: string; children: React.ReactNode }) {
  const base = "rounded-xl border-0 p-4 shadow-sm";
  if (!to) return <Card className={cn(base, className)}>{children}</Card>;
  return (
    <Card className={cn(base, "transition-colors hover:bg-[#fdfaf8]", className)}>
      <Link to={to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {children}
      </Link>
    </Card>
  );
}

function StatCard({ className, icon: Icon, title, value, caption, tone = "neutral", to }: {
  className?: string; icon: LucideIcon; title: string; value: string; caption?: string; tone?: Tone; to?: string;
}) {
  return (
    <CardShell className={className} to={to}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f9d8d2] text-primary">
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <p className={cn("mt-1 font-display text-xl font-bold", tones[tone])}>{value}</p>
      {caption && (
        <p className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{caption}</span>
          {to && <ChevronRight aria-hidden className="size-4 shrink-0" />}
        </p>
      )}
    </CardShell>
  );
}

export function DashboardCards({ data }: { data: Dashboard }) {
  const { today, thisWeek, overdue, month, receivable } = data;
  const monthLabel = monthName(month.from);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
      <StatCard
        className="order-1 col-span-1 lg:col-span-2"
        icon={BellRing}
        title={t.overdue.title}
        value={messages.dashboard.orders(overdue.ordersCount)}
        caption={overdue.ordersCount > 0 ? t.overdue.attention : t.overdue.none}
        tone={overdue.ordersCount > 0 ? "alert" : "neutral"}
        to={overdue.ordersCount > 0 ? orderListHref({ status: "CONFIRMED", deliveryTo: overdue.to }) : undefined}
      />
      <StatCard
        className="order-2 col-span-1 lg:col-span-2"
        icon={CalendarDays}
        title={t.week.title}
        value={messages.dashboard.orders(thisWeek.ordersCount)}
        caption={thisWeek.ordersCount > 0 ? t.week.range(shortDate(thisWeek.from), shortDate(thisWeek.to)) : t.week.none}
        to={
          thisWeek.ordersCount > 0
            ? orderListHref({ status: "CONFIRMED", deliveryFrom: thisWeek.from, deliveryTo: thisWeek.to })
            : undefined
        }
      />

      <CardShell className="order-3 col-span-2 lg:order-4 lg:col-span-6">
        <section aria-labelledby="today-title">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Truck aria-hidden className="size-5" />
              </span>
              <div>
                <h2 id="today-title" className="font-display text-lg font-semibold">{t.today.title}</h2>
                <p className="text-xs text-muted-foreground">{weekdayAndDate(today.date)}</p>
              </div>
            </div>
            {today.orders.length > 0 && (
              <span className="rounded-full bg-[#f9d8d2] px-3 py-1 text-xs font-semibold text-primary">
                {messages.dashboard.orders(today.orders.length)}
              </span>
            )}
          </div>

          {today.orders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.today.empty}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {today.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/orders/${order.id}`}
                    aria-label={t.today.open(order.orderNumber)}
                    className="flex items-center gap-3 rounded-xl bg-[#f5f2ef] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="rounded-lg bg-[#e9e4df] px-2 py-1 text-xs font-bold text-primary">#{order.orderNumber}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{order.customerName}</span>
                      <span className="text-xs text-muted-foreground">{messages.orders.fulfillment[order.fulfillmentType]}</span>
                    </span>
                    <span className="hidden text-right text-xs text-muted-foreground sm:block">
                      {t.today.total}
                      <span className="block text-sm font-semibold text-foreground">{formatMoney(order.totalAmount)}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                        order.balance === 0 ? "bg-emerald-100 text-emerald-800" : "bg-[#fdecea] text-destructive",
                      )}
                    >
                      {order.balance === 0 ? t.today.paid : t.today.missing(formatMoney(order.balance))}
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardShell>

      <StatCard
        className="order-4 col-span-1 lg:order-5 lg:col-span-3"
        icon={ShoppingBag}
        title={t.sold.title}
        value={formatMoney(month.soldAmount)}
        caption={t.sold.help(monthLabel)}
      />
      <StatCard
        className="order-5 col-span-1 lg:order-6 lg:col-span-3"
        icon={Wallet}
        title={t.received.title}
        value={formatMoney(month.receivedAmount)}
        caption={month.receivedAmount < 0 ? t.received.negative : t.received.help(monthLabel)}
        tone={month.receivedAmount < 0 ? "warning" : "neutral"}
      />

      <CardShell className="order-6 col-span-2 lg:order-3 lg:col-span-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.receivable.title}</h2>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f9d8d2] text-primary">
            <Banknote aria-hidden className="size-4" />
          </span>
        </div>
        <p className="mt-1 font-display text-xl font-bold">{formatMoney(receivable.amount)}</p>
        <p className="text-xs text-muted-foreground">{messages.dashboard.orders(receivable.ordersCount)}</p>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt>{t.receivable.onDelivery}</dt>
            <dd className="font-semibold">
              {formatMoney(receivable.dueOnDelivery.amount)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">({receivable.dueOnDelivery.ordersCount})</span>
            </dd>
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5",
              receivable.unpaidDelivered.ordersCount > 0 && "bg-[#fdecea] text-destructive",
            )}
          >
            <dt>{t.receivable.unpaidDelivered}</dt>
            <dd className="font-semibold">
              {formatMoney(receivable.unpaidDelivered.amount)}
              <span className="ml-1 text-xs font-normal">({receivable.unpaidDelivered.ordersCount})</span>
            </dd>
          </div>
        </dl>
      </CardShell>
    </div>
  );
}