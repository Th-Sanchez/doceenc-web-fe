import { MoreVertical } from "lucide-react";
import type { RecipeSummary } from "@/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { messages } from "@/i18n/messages";

const t = messages.recipes.actions;

/** The "⋮" menu of a card: archive an active recipe, restore an archived one. Editing has its own button. */
export function RecipeActions({
  recipe,
  onArchive,
  onRestore,
}: {
  recipe: RecipeSummary;
  onArchive: (recipe: RecipeSummary) => void;
  onRestore: (recipe: RecipeSummary) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.menu(recipe.name)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {recipe.active ? (
          <DropdownMenuItem onSelect={() => onArchive(recipe)}>{t.archive}</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onRestore(recipe)}>{t.restore}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}