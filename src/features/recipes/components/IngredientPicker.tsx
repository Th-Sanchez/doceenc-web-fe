import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { availableIngredients, filterIngredients, sortIngredients } from "@/features/ingredients/catalog";
import { messages } from "@/i18n/messages";
import { formatUnitCost } from "@/lib/format";

const t = messages.recipeForm.picker;

interface BodyProps {
  /** The whole catalog (undefined while it loads). Archived ones are filtered out here. */
  ingredients: Ingredient[] | undefined;
  /** Ingredients already in the recipe: they cannot be added twice. */
  excludedIds: ReadonlySet<string>;
  onPick: (ingredient: Ingredient) => void;
}

/**
 * Lives inside DialogContent, which Radix unmounts when it closes: the search starts empty every time
 * the picker opens, however it was closed (the parent can close it without Radix calling onOpenChange).
 */
function PickerBody({ ingredients, excludedIds, onPick }: BodyProps) {
  const [search, setSearch] = useState("");

  const active = useMemo(() => availableIngredients(ingredients ?? [], false), [ingredients]);
  const pool = useMemo(() => active.filter((ingredient) => !excludedIds.has(ingredient.id)), [active, excludedIds]);
  const matches = useMemo(
    () => sortIngredients(filterIngredients(pool, { search, categoryId: null }), "name"),
    [pool, search],
  );

  let emptyMessage: string | null = null;
  if (matches.length === 0) {
    emptyMessage = active.length === 0 ? t.empty : pool.length === 0 ? t.none : t.noMatch;
  }

  return (
    <>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {ingredients === undefined && <p role="status">{messages.loading}</p>}

      {ingredients !== undefined && emptyMessage && (
        <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
          <p>{emptyMessage}</p>
          {active.length === 0 && (
            <Link to="/ingredients/new" className={buttonVariants({ variant: "outline" })}>
              {t.createIngredient}
            </Link>
          )}
        </div>
      )}

      <ul className="flex flex-col divide-y">
        {matches.map((ingredient) => (
          <li key={ingredient.id}>
            <button
              type="button"
              onClick={() => onPick(ingredient)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{ingredient.name}</span>
                {ingredient.brandSupplier && (
                  <span className="block truncate text-xs text-muted-foreground">{ingredient.brandSupplier}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatUnitCost(ingredient.unitPrice, ingredient.baseUnit)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">{t.close}</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

interface Props extends BodyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IngredientPicker({ open, onOpenChange, ...body }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{t.title}</DialogTitle>
        <DialogDescription>{t.description}</DialogDescription>
        <PickerBody {...body} />
      </DialogContent>
    </Dialog>
  );
}