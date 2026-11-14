import { MoreVertical } from "lucide-react";
import type { ProductSummary } from "@/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { messages } from "@/i18n/messages";

const t = messages.products.actions;

/** The "⋮" menu of a card: archive an active product, restore an archived one. Editing has its own button. */
export function ProductActions({
  product,
  onArchive,
  onRestore,
}: {
  product: ProductSummary;
  onArchive: (product: ProductSummary) => void;
  onRestore: (product: ProductSummary) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.menu(product.name)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {product.active ? (
          <DropdownMenuItem onSelect={() => onArchive(product)}>{t.archive}</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onRestore(product)}>{t.restore}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}