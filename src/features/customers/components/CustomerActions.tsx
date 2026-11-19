import { Archive, MoreVertical, Pencil, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import type { Customer } from "@/api/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { messages } from "@/i18n/messages";

export function CustomerActions({
  customer,
  onArchive,
}: {
  customer: Customer;
  onArchive: (customer: Customer) => void;
}) {
  const navigate = useNavigate();
  const t = messages.customers;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.actions.menu(customer.name)}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => navigate(`/customers/${customer.id}/edit`)}>
          <Pencil aria-hidden className="size-4" />
          {t.actions.edit}
        </DropdownMenuItem>
        {customer.active ? (
          <DropdownMenuItem onSelect={() => onArchive(customer)}>
            <Archive aria-hidden className="size-4" />
            {t.actions.archive}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onArchive(customer)}>
            <RotateCcw aria-hidden className="size-4" />
            {t.actions.restore}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
