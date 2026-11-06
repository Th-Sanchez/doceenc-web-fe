import { Link } from "react-router";
import type { Ingredient } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatLastPurchase, formatMoney, formatQuantity, formatUnitCost } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IngredientActions } from "./IngredientActions";
import { VariationBadge } from "./VariationBadge";

interface ListProps {
  items: Ingredient[];
  onArchive: (ingredient: Ingredient) => void;
  onRestore: (ingredient: Ingredient) => void;
}

const t = messages.ingredients;
const lastPurchase = (i: Ingredient) => (i.lastPurchasedOn ? formatLastPurchase(i.lastPurchasedOn) : "—");

function ArchivedTag() {
  return <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{t.archivedTag}</span>;
}

export function IngredientTable({ items, onArchive, onRestore }: ListProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.ingredient}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.category}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.package}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.price}</th>
            <th scope="col" className="bg-[#f9d8d2]/40 px-4 py-3 font-semibold text-primary">{t.columns.unitCost}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.variation}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.columns.lastPurchase}</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">{t.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((ingredient) => (
            <tr key={ingredient.id} className={cn(!ingredient.active && "opacity-60")}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn("font-semibold", !ingredient.active && "line-through")}>{ingredient.name}</span>
                  {!ingredient.active && <ArchivedTag />}
                </div>
                {ingredient.brandSupplier && (
                  <div className="text-xs text-muted-foreground">{ingredient.brandSupplier}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-[#f9d8d2] px-2 py-0.5 text-xs text-[#765d58]">
                  {ingredient.category.name}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {formatQuantity(ingredient.packageQuantity, ingredient.baseUnit)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatMoney(ingredient.packagePrice)}</td>
              <td className="whitespace-nowrap bg-[#f9d8d2]/30 px-4 py-3 font-semibold text-primary">
                {formatUnitCost(ingredient.unitPrice, ingredient.baseUnit)}
              </td>
              <td className="px-4 py-3">
                <VariationBadge value={ingredient.variationPercent} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">{lastPurchase(ingredient)}</td>
              <td className="px-2 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link to={`/ingredients/${ingredient.id}/price`} className="px-2 text-sm font-semibold text-primary">
                    {t.adjust}
                  </Link>
                  <IngredientActions ingredient={ingredient} onArchive={onArchive} onRestore={onRestore} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IngredientCards({ items, onArchive, onRestore }: ListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((ingredient) => (
        <li
          key={ingredient.id}
          className={cn("rounded-xl border bg-card p-4 shadow-sm", !ingredient.active && "opacity-70")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn("truncate font-semibold", !ingredient.active && "line-through")}>{ingredient.name}</p>
                {!ingredient.active && <ArchivedTag />}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {[ingredient.brandSupplier, ingredient.category.name].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <VariationBadge value={ingredient.variationPercent} />
              <IngredientActions ingredient={ingredient} onArchive={onArchive} onRestore={onRestore} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
            <div>
              <p className="text-xs text-muted-foreground">{t.packagePrice}</p>
              <p className="text-sm font-semibold">
                {formatMoney(ingredient.packagePrice)} / {formatQuantity(ingredient.packageQuantity, ingredient.baseUnit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t.costLabel[ingredient.baseUnit]}</p>
              <p className="text-lg font-bold text-primary">{formatUnitCost(ingredient.unitPrice, ingredient.baseUnit)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t.lastPurchase}: {lastPurchase(ingredient)}
            </span>
            <Link to={`/ingredients/${ingredient.id}/price`} className="text-sm font-semibold text-primary">
              {t.adjust} ›
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}