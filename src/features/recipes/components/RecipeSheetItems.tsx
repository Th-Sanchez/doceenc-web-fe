import type { Recipe } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatMoney, formatQuantity, formatUnitCost } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = Recipe["items"][number];

const t = messages.recipeSheet.composition;

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
        active ? "bg-[#d9eee5] text-[#00523b]" : "border border-amber-300 bg-amber-50 text-amber-800",
      )}
    >
      {active ? t.active : t.archived}
    </span>
  );
}

function Name({ item }: { item: Item }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium">{item.ingredient.name}</p>
      {item.ingredient.brandSupplier && (
        <p className="text-[11px] text-muted-foreground">{item.ingredient.brandSupplier}</p>
      )}
    </div>
  );
}

/** Desktop: the composition as a table. Every number was priced by the server. */
export function RecipeSheetTable({ items }: { items: Item[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-[#fbf9f6] text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-3 font-semibold">{t.columns.ingredient}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.columns.quantity}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.columns.baseCost}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.columns.cost}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.columns.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.ingredient.id} className={cn(!item.ingredient.active && "bg-amber-50/40")}>
              <td className="px-3 py-3">
                <Name item={item} />
              </td>
              <td className="whitespace-nowrap px-3 py-3">{formatQuantity(item.quantity, item.ingredient.baseUnit)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                {formatUnitCost(item.ingredient.unitPrice, item.ingredient.baseUnit)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatMoney(item.cost)}</td>
              <td className="px-3 py-3">
                <StatusBadge active={item.ingredient.active} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Mobile and tablet: one card per line. */
export function RecipeSheetList({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.ingredient.id}
          className={cn("flex flex-col gap-2 rounded-xl border bg-card p-3", !item.ingredient.active && "border-amber-300 bg-amber-50/40")}
        >
          <div className="flex items-start justify-between gap-2">
            <Name item={item} />
            <StatusBadge active={item.ingredient.active} />
          </div>
          <div className="flex items-end justify-between gap-3 rounded-lg bg-[#f5f3f0] p-2 text-xs">
            <div>
              <p className="text-muted-foreground">{formatQuantity(item.quantity, item.ingredient.baseUnit)}</p>
              <p className="text-muted-foreground">{formatUnitCost(item.ingredient.unitPrice, item.ingredient.baseUnit)}</p>
            </div>
            <p className="text-sm font-bold text-primary">{formatMoney(item.cost)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}