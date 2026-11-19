import { Archive, Phone, Plus, Search, Store, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Customer, CustomerType } from "@/api/types";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { messages } from "@/i18n/messages";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { ArchiveCustomerDialog } from "../components/ArchiveCustomerDialog";
import { CustomerActions } from "../components/CustomerActions";
import { filterCustomers, formatCustomerPhone, type CustomerFilter } from "../catalog";
import { useCustomers } from "../queries";

const PAGE_SIZE = 8;
const t = messages.customers;

function CustomerTypeBadge({ type }: { type: CustomerType }) {
  const label = type === "RETAIL" ? t.retail : t.wholesale;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
        type === "RETAIL" ? "bg-[#ffd9de] text-[#7e263f]" : "bg-[#f9d8d2] text-[#765d58]",
      )}
    >
      {label}
    </span>
  );
}

function CustomerTable({
  customers,
  onArchive,
}: {
  customers: Customer[];
  onArchive: (customer: Customer) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-xl bg-card shadow-[0_2px_8px_-2px_rgba(110,95,98,0.08)] lg:block">
      <table className="w-full table-fixed text-left">
        <thead className="bg-[#f5f3f0] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="w-[25%] px-4 py-3">{t.columns.name}</th>
            <th className="w-[12%] px-4 py-3">{t.columns.type}</th>
            <th className="w-[17%] px-4 py-3">{t.columns.phone}</th>
            <th className="w-[38%] px-4 py-3">{t.columns.address}</th>
            <th className="w-[8%] px-4 py-3 text-right">{t.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={cn("border-t border-[#eae8e5]/70", !customer.active && "bg-[#e4e2df]/30 text-muted-foreground")}
            >
              <td className="px-4 py-3.5">
                <p className={cn("truncate text-sm font-semibold text-foreground", !customer.active && "opacity-70")}>
                  {customer.name}
                  {!customer.active && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{t.archivedTag}</span>}
                </p>
                {customer.storeName && <p className="truncate text-xs text-muted-foreground">{customer.storeName}</p>}
              </td>
              <td className="px-4 py-3.5"><CustomerTypeBadge type={customer.type} /></td>
              <td className="truncate px-4 py-3.5 text-sm">{formatCustomerPhone(customer.phone) ?? t.noValue}</td>
              <td className="truncate px-4 py-3.5 text-sm text-muted-foreground">{customer.address || t.noValue}</td>
              <td className="px-4 py-2 text-right"><CustomerActions customer={customer} onArchive={onArchive} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerCards({
  customers,
  onArchive,
}: {
  customers: Customer[];
  onArchive: (customer: Customer) => void;
}) {
  return (
    <ul className="flex flex-col gap-2 lg:hidden">
      {customers.map((customer) => (
        <li key={customer.id} className={cn("rounded-2xl bg-card p-4 shadow-[0_2px_8px_-2px_rgba(110,95,98,0.07)]", !customer.active && "opacity-70")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold">{customer.name}</h2>
              {customer.storeName ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-[#554245]">
                  <Store aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{customer.storeName}</span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{t.noPhone}</p>
              )}
              {!customer.active && <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{t.archivedTag}</span>}
            </div>
            <CustomerTypeBadge type={customer.type} />
          </div>
          <div className="flex items-center justify-between pt-3">
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="flex min-h-8 items-center gap-1.5 rounded-lg text-sm text-[#554245] hover:text-primary"
              >
                <Phone aria-hidden className="size-3.5 text-emerald-800" />
                {formatCustomerPhone(customer.phone)}
              </a>
            ) : <span />}
            <CustomerActions customer={customer} onArchive={onArchive} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label={messages.loading} className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}

export function CustomersPage() {
  const customers = useCustomers();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [showArchived, setShowArchived] = useState(true);
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<Customer | null>(null);
  const all = customers.data;
  const active = all?.filter((customer) => customer.active) ?? [];
  const archived = all?.filter((customer) => !customer.active) ?? [];
  const includeArchived = isDesktop && showArchived;
  const visible = useMemo(
    () => filterCustomers(all ?? [], filter, search, includeArchived),
    [all, filter, search, includeArchived],
  );
  const pageSize = isDesktop ? PAGE_SIZE : 5;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updateFilter = (value: CustomerFilter) => { setFilter(value); setPage(1); };
  const updateSearch = (value: string) => { setSearch(value); setPage(1); };
  const emptyMessage = search.trim()
    ? t.empty.search
    : filter === "archived"
      ? t.empty.archived
      : filter === "all" && !includeArchived && active.length === 0
        ? t.empty.active
        : t.empty.search;
  const countedCustomers = includeArchived ? all ?? [] : active;
  const typeOptions: { value: CustomerFilter; label: string; count: number }[] = [
    { value: "all", label: t.all, count: includeArchived ? all?.length ?? 0 : active.length },
    { value: "RETAIL", label: t.retail, count: countedCustomers.filter((customer) => customer.type === "RETAIL").length },
    { value: "WHOLESALE", label: t.wholesale, count: countedCustomers.filter((customer) => customer.type === "WHOLESALE").length },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex items-center justify-between lg:hidden">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-primary">{t.title}</h1>
        {all && <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-bold text-foreground">{t.count(active.length)}</span>}
      </header>
      <header className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{t.title}</h1>
            {all && <span className="rounded-full bg-[#f9d8d2] px-2.5 py-1 text-xs font-semibold text-[#765d58]">{t.desktopCount(includeArchived ? all.length : active.length)}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Link to="/customers/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" />
          {t.new}
        </Link>
      </header>

      {customers.isPending && <ListSkeleton />}
      {customers.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{t.loadError}</p>
          <Button variant="outline" onClick={() => customers.refetch()}>{t.retry}</Button>
        </div>
      )}

      {all && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <Users aria-hidden className="size-8 text-primary" />
          <p className="text-lg font-semibold">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground">{t.empty.description}</p>
          <Link to="/customers/new" className={buttonVariants()}><Plus aria-hidden className="size-4" />{t.empty.create}</Link>
        </div>
      )}

      {all && all.length > 0 && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-[672px]">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label={t.searchLabel}
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                className="h-[50px] rounded-xl border-0 bg-card pl-10 shadow-sm"
              />
            </div>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <Switch
                id="customer-show-archived"
                checked={showArchived}
                onCheckedChange={(checked) => { setShowArchived(checked); setPage(1); }}
              />
              <Label htmlFor="customer-show-archived" className="whitespace-nowrap">{t.showArchived}</Label>
            </div>
            <div role="group" aria-label={t.filterLabel} className="flex min-w-0 gap-2 overflow-x-auto py-1 lg:ml-auto lg:justify-end">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => updateFilter(option.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    filter === option.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-[#f5f3f0] text-[#554245] hover:bg-muted",
                  )}
                >
                  {option.label} <span className="text-xs opacity-80">({option.count})</span>
                </button>
              ))}
              <button
                type="button"
                aria-pressed={filter === "archived"}
                onClick={() => updateFilter("archived")}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden",
                  filter === "archived" ? "bg-primary text-primary-foreground shadow-sm" : "bg-[#f5f3f0] text-[#554245] hover:bg-muted",
                )}
              >
                <Archive aria-hidden className="size-3.5" />{t.archived}<span className="text-xs opacity-80">({archived.length})</span>
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{emptyMessage}</p>
          ) : (
            <>
              <CustomerTable customers={pageItems} onArchive={setToArchive} />
              <CustomerCards customers={pageItems} onArchive={setToArchive} />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                shown={pageItems.length}
                total={visible.length}
                summary={t.pagination.summary}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      <ArchiveCustomerDialog customer={toArchive} onClose={() => setToArchive(null)} />
      <Link to="/customers/new" className={cn(buttonVariants(), "fixed bottom-[76px] right-4 z-20 size-14 rounded-full p-0 shadow-lg lg:hidden")}>
        <Plus aria-hidden className="size-6" />
        <span className="sr-only">{t.new}</span>
      </Link>
    </div>
  );
}
