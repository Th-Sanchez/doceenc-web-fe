import { EllipsisVertical } from "lucide-react";
import { Link } from "react-router";
import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { messages } from "@/i18n/messages";

interface Props {
  ingredient: Ingredient;
  onArchive: (ingredient: Ingredient) => void;
  onRestore: (ingredient: Ingredient) => void;
}

export function IngredientActions({ ingredient, onArchive, onRestore }: Props) {
  const t = messages.ingredients.actions;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="size-9 px-0" aria-label={t.menu(ingredient.name)}>
          <EllipsisVertical aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/ingredients/${ingredient.id}/price`}>{t.adjustPrice}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/ingredients/${ingredient.id}/edit`}>{t.edit}</Link>
        </DropdownMenuItem>
        {ingredient.active ? (
          <DropdownMenuItem onSelect={() => onArchive(ingredient)}>{t.archive}</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onRestore(ingredient)}>{t.restore}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}