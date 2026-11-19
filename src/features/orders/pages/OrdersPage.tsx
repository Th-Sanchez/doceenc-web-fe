import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Eye, Filter, MoreHorizontal, PackageCheck, Pencil, Plus, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { OrderPaymentStatus, OrderStatus, OrderSummary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/queries";
import { messageForError, messages } from "@/i18n/messages";
import { formatDate, formatMoney } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";
import { unwrap } from "@/api/unwrap";
import { OrderPaymentBadge, OrderStatusBadge } from "../components/OrderStatusBadge";
import { orderKeys, type OrderListParams } from "../queries";

const t = messages.orders;
const pageSize = 20;

const tabs: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: t.tabs.all },
  { value: "PENDING", label: t.tabs.pending },
  { value: "CONFIRMED", label: t.tabs.confirmed },
  { value: "DELIVERED", label: t.tabs.delivered },
  { value: "CANCELLED", label: t.tabs.cancelled },
];

interface OrdersViewState {
  activeTab: OrderStatus | "ALL";
  search: string;
  customerId: string;
  paymentStatus: string;
  fulfillmentType: string;
  deliveryFrom: string;
  deliveryTo: string;
  page: number;
  mobilePage: number;
}

const initialViewState: OrdersViewState = {
  activeTab: "ALL",
  search: "",
  customerId: "",
  paymentStatus: "",
  fulfillmentType: "",
  deliveryFrom: "",
  deliveryTo: "",
  page: 0,
  mobilePage: 0,
};

function updateView<K extends keyof OrdersViewState>(state: OrdersViewState, key: K, value: OrdersViewState[K]): OrdersViewState {
  return {
    ...state,
    [key]: value,
    ...(key === "page" || key === "mobilePage" ? {} : { page: 0, mobilePage: 0 }),
  };
}

function orderDate(date: string | null) {
  return date ? formatDate(date) : "—";
}

function OrderSummaryCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex flex-col gap-3 rounded-xl border border-[#eee7e2] bg-card p-4 shadow-[0_2px_12px_-2px_rgba(110,95,98,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-primary">Pedido #{order.orderNumber}</p>
          <p className="mt-0.5 text-sm font-medium">{order.customer.name}</p>
          {order.customer.storeName && <p className="text-xs text-muted-foreground">{order.customer.storeName}</p>}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Truck aria-hidden className="size-3.5" />{t.fulfillment[order.fulfillmentType]}</span>
        <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden className="size-3.5" />{orderDate(order.deliveryDate)}</span>
        <span>{t.items(order.itemCount)}</span>
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <OrderPaymentBadge status={order.paymentStatus} />
        <span className="font-semibold">{order.totalAmount === null ? "—" : formatMoney(order.totalAmount)}</span>
      </div>
    </Link>
  );
}

export function OrdersPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  const customers = useCustomers();
  const [view, setView] = useState(initialViewState);
  const { activeTab, search, customerId, paymentStatus, fulfillmentType, deliveryFrom, deliveryTo, page, mobilePage } = view;
  const setFilter = <K extends keyof OrdersViewState>(key: K, value: OrdersViewState[K]) =>
    setView((current) => updateView(current, key, value));

  const filters = useMemo<OrderListParams>(() => ({
    ...(activeTab === "ALL" ? {} : { status: [activeTab] }),
    ...(customerId ? { customerId } : {}),
    ...(paymentStatus ? { paymentStatus: [paymentStatus as OrderPaymentStatus] } : {}),
    ...(deliveryFrom ? { deliveryFrom } : {}),
    ...(deliveryTo ? { deliveryTo } : {}),
    page: isDesktop ? page : 0,
    size: pageSize,
  }), [activeTab, customerId, deliveryFrom, deliveryTo, isDesktop, page, paymentStatus]);

  const pageNumbers = isDesktop ? [page] : Array.from({ length: mobilePage + 1 }, (_, index) => index);
  const orderQueries = pageNumbers.map((pageNumber) => ({
      ...filters,
      page: pageNumber,
    }));
  const listResults = useQueries({
    queries: orderQueries.map((params) => ({
      queryKey: orderKeys.list(params),
      queryFn: () => unwrap(api.GET("/api/v1/orders", { params: { query: params } })),
    })),
  });
  const isPending = listResults.some((result) => result.isPending);
  const queryError = listResults.find((result) => result.isError)?.error;
  const pages = listResults.flatMap((result) => result.data?.items ?? []);
  const response = listResults[0]?.data;
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return pages.filter((order) => {
      if (fulfillmentType && order.fulfillmentType !== fulfillmentType) return false;
      if (!query) return true;
      return (
        String(order.orderNumber).includes(query) ||
        order.customer.name.toLocaleLowerCase().includes(query) ||
        (order.customer.storeName ?? "").toLocaleLowerCase().includes(query)
      );
    });
  }, [fulfillmentType, pages, search]);
  const hasFilters = Boolean(customerId || paymentStatus || fulfillmentType || deliveryFrom || deliveryTo || search || activeTab !== "ALL");

  const resetFilters = () => {
    setView(initialViewState);
  };

  const firstPageCount = listResults[0]?.data?.items.length ?? 0;
  const hasLocalFilter = Boolean(search.trim() || fulfillmentType);
  const pendingCount = filteredOrders.filter((order) => order.status === "PENDING").length;
  const pickupCount = filteredOrders.filter((order) => order.fulfillmentType === "PICKUP").length;
  const pageTotal = filteredOrders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="hidden text-xs font-bold uppercase tracking-wider text-primary lg:block">{messages.nav.operational}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button className="hidden lg:inline-flex" onClick={() => navigate("/orders/new")}>
          <Plus aria-hidden className="size-4" />{t.new}
        </Button>
      </header>

      <section aria-label={t.metrics.total} className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={ClipboardList} label={t.metrics.total} value={filteredOrders.length} />
        <Metric icon={PackageCheck} label={t.metrics.pending} value={pendingCount} />
        <Metric icon={Truck} label={t.metrics.pickup} value={pickupCount} />
        <Metric icon={CircleDollarSign} label={t.metrics.amount} value={formatMoney(pageTotal)} />
        <p className="col-span-full -mt-2 text-right text-[11px] text-muted-foreground">{t.metrics.pageScope}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={t.searchLabel}
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(event) => setFilter("search", event.currentTarget.value)}
            className="h-12 rounded-xl border-0 bg-card pl-10 shadow-sm"
          />
        </div>
        {hasLocalFilter && <p className="text-xs text-muted-foreground">{t.searchScope}</p>}
        <div role="tablist" aria-label={t.title} className="flex gap-1 overflow-x-auto rounded-xl bg-[#f0ece8] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setFilter("activeTab", tab.value)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${activeTab === tab.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Select aria-label={t.filters.customer} value={customerId} onChange={(event) => setFilter("customerId", event.currentTarget.value)} className="rounded-lg bg-card text-sm">
            <option value="">{t.filters.allCustomers}</option>
            {customers.data?.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}{customer.active ? "" : " · Arquivado"}</option>
            ))}
          </Select>
          <Select aria-label={t.filters.payment} value={paymentStatus} onChange={(event) => setFilter("paymentStatus", event.currentTarget.value)} className="rounded-lg bg-card text-sm">
            <option value="">{t.filters.allPayments}</option>
            <option value="UNPAID">{t.paymentStatus.UNPAID}</option>
            <option value="PARTIAL">{t.paymentStatus.PARTIAL}</option>
            <option value="PAID">{t.paymentStatus.PAID}</option>
          </Select>
          <Select aria-label={t.filters.fulfillment} value={fulfillmentType} onChange={(event) => setFilter("fulfillmentType", event.currentTarget.value)} className="rounded-lg bg-card text-sm">
            <option value="">{t.filters.allFulfillment}</option>
            <option value="PICKUP">{t.filters.pickup}</option>
            <option value="DELIVERY">{t.filters.delivery}</option>
          </Select>
          <label className="relative">
            <span className="sr-only">{t.filters.deliveryFrom}</span>
            <CalendarDays aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" aria-label={t.filters.deliveryFrom} value={deliveryFrom} onChange={(event) => setFilter("deliveryFrom", event.currentTarget.value)} className="rounded-lg bg-card pl-9 text-sm" />
          </label>
          <label className="relative">
            <span className="sr-only">{t.filters.deliveryTo}</span>
            <CalendarDays aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" aria-label={t.filters.deliveryTo} value={deliveryTo} onChange={(event) => setFilter("deliveryTo", event.currentTarget.value)} className="rounded-lg bg-card pl-9 text-sm" />
          </label>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="self-start px-2 text-primary">
            <Filter aria-hidden className="size-3.5" />{t.filters.clear}
          </Button>
        )}
        {customers.isError && <p role="alert" className="text-sm text-destructive">{messageForError(customers.error)}</p>}
      </section>

      {queryError ? (
        <div role="alert" className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{messageForError(queryError) || t.loadError}</p>
          <Button variant="outline" className="mt-3" onClick={() => listResults.forEach((result) => void result.refetch())}>{t.retry}</Button>
        </div>
      ) : isPending && pages.length === 0 ? (
        <div role="status" aria-label={messages.loading} className="h-52 animate-pulse rounded-2xl bg-card" />
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{t.empty}</div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f2ef] text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {Object.values(t.columns).map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fdfaf8]">
                    <td className="px-4 py-4 font-semibold text-primary">#{order.orderNumber}</td>
                    <td className="px-4 py-4">{order.customer.name}<span className="block text-xs text-muted-foreground">{order.customer.storeName ?? (order.customer.type === "WHOLESALE" ? "Lojista" : "Varejo")}</span></td>
                    <td className="px-4 py-4">{t.fulfillment[order.fulfillmentType]}</td>
                    <td className="px-4 py-4">{orderDate(order.deliveryDate)}</td>
                    <td className="px-4 py-4">{order.totalAmount === null ? "—" : formatMoney(order.totalAmount)}</td>
                    <td className="px-4 py-4"><OrderPaymentBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" aria-label={t.actions.menu(order.orderNumber)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreHorizontal aria-hidden className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/orders/${order.id}`}><Eye aria-hidden className="size-4" />{t.actions.view}</Link>
                          </DropdownMenuItem>
                          {order.status === "PENDING" && (
                            <DropdownMenuItem asChild>
                              <Link to={`/orders/${order.id}/edit`}><Pencil aria-hidden className="size-4" />{t.actions.edit}</Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
              <span>{hasLocalFilter ? t.localPagination(filteredOrders.length) : t.pagination(firstPageCount, response?.totalElements ?? 0)}</span>
              <div className="flex items-center gap-2">
                <span>{t.page(page + 1, response?.totalPages ?? 1)}</span>
                <Button variant="outline" size="sm" className="size-9 px-0" aria-label={t.previous} disabled={page === 0} onClick={() => setView((current) => updateView(current, "page", Math.max(0, current.page - 1)))}><ChevronLeft aria-hidden className="size-4" /></Button>
                <Button variant="outline" size="sm" className="size-9 px-0" aria-label={t.next} disabled={page + 1 >= (response?.totalPages ?? 1)} onClick={() => setView((current) => updateView(current, "page", current.page + 1))}><ChevronRight aria-hidden className="size-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {filteredOrders.map((order) => <OrderSummaryCard key={order.id} order={order} />)}
            <p className="text-center text-xs text-muted-foreground">{hasLocalFilter ? t.localPagination(filteredOrders.length) : t.pagination(filteredOrders.length, response?.totalElements ?? 0)}</p>
            {mobilePage + 1 < (response?.totalPages ?? 1) && (
              <Button variant="outline" disabled={listResults.some((result) => result.isFetching)} onClick={() => setView((current) => updateView(current, "mobilePage", current.mobilePage + 1))}>
                {t.loadMore}
              </Button>
            )}
          </div>
        </>
      )}

      <Button className="fixed bottom-20 right-4 z-10 size-14 rounded-full shadow-lg lg:hidden" aria-label={t.new} onClick={() => navigate("/orders/new")}>
        <Plus aria-hidden className="size-6" />
      </Button>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-3 rounded-xl border-0 p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f9d8d2] text-primary"><Icon aria-hidden className="size-5" /></span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-lg font-bold">{value}</span>
      </span>
    </Card>
  );
}
