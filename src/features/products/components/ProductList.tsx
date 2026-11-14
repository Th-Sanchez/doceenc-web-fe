import { BookOpen, Pencil, RotateCcw, TriangleAlert } from "lucide-react";
import { Link } from "react-router";
import type { ChannelPricing, ProductSummary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { overallStatus } from "../catalog";
import { ProductActions } from "./ProductActions";
import { StatusChip } from "./StatusChip";

interface ListProps {
  items: ProductSummary[];
  onArchive: (product: ProductSummary) => void;
  onRestore: (product: ProductSummary) => void;
  restoring: boolean;
}

const t = messages.products;

function ArchivedTag() {
  return (
    <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
      {t.archivedTag}
    </span>
  );
}

function Alert({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
      <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

function ChannelBlock({ label, channel }: { label: string; channel: ChannelPricing }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-[#f5f3f0] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <StatusChip status={channel.status} />
      </div>
      <p className="text-lg font-bold">{channel.price === null ? "—" : formatMoney(channel.price)}</p>
      {channel.marginPercent !== null && (
        <p className="text-xs text-muted-foreground">
          {t.margin(formatPercent(channel.marginPercent), formatPercent(channel.targetMarginPercent))}
        </p>
      )}
      {channel.status !== "ON_TARGET" && channel.suggestedPrice !== null && (
        <p className="text-xs text-muted-foreground">{t.suggested(formatMoney(channel.suggestedPrice))}</p>
      )}
    </div>
  );
}

function ProductCard({ product, onArchive, onRestore, restoring }: Omit<ListProps, "items"> & { product: ProductSummary }) {
  const archived = !product.active;
  const status = overallStatus(product);
  const hasExtras = product.cost.extrasCost > 0;
  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5",
        !archived && status === "LOSS" && "border-destructive/50",
        !archived && status === "BELOW_TARGET" && "border-amber-300",
        archived && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className={cn("font-display text-xl font-semibold leading-tight", archived && "line-through")}>
            {product.name}
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{t.recipeLine(product.recipe.name)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {archived && <ArchivedTag />}
          <ProductActions product={product} onArchive={onArchive} onRestore={onRestore} />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">{t.unitCost}</span>
          <span className="font-bold text-primary">{formatMoney(product.cost.totalCost)}</span>
        </p>
        {hasExtras && (
          <p className="text-[11px] text-muted-foreground">
            {t.costBreakdown(formatMoney(product.cost.recipeCost), formatMoney(product.cost.extrasCost))}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ChannelBlock label={t.channel.retail} channel={product.retail} />
        <ChannelBlock label={t.channel.wholesale} channel={product.wholesale} />
      </div>

      {!product.recipe.active && <Alert>{t.archivedRecipe}</Alert>}
      {product.archivedIngredientCount > 0 && <Alert>{t.archivedIngredients(product.archivedIngredientCount)}</Alert>}

      <div className="mt-auto flex gap-2">
        {archived ? (
          <>
            <Link to={`/products/${product.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
              {t.view}
            </Link>
            <Button variant="outline" disabled={restoring} onClick={() => onRestore(product)}>
              <RotateCcw aria-hidden className="size-4" />
              {t.actions.restore}
            </Button>
          </>
        ) : (
          <Link
            to={`/products/${product.id}/edit`}
            aria-label={t.editLabel(product.name)}
            className={cn(buttonVariants(), "flex-1")}
          >
            <Pencil aria-hidden className="size-4" />
            {t.edit}
          </Link>
        )}
      </div>
    </li>
  );
}

export function ProductGrid(props: ListProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {props.items.map((product) => (
        <ProductCard key={product.id} product={product} {...props} />
      ))}
    </ul>
  );
}