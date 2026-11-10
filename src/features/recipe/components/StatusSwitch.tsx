import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import type { RecipeStatus } from "../catalog";

const t = messages.recipes;

/** "Ativas | Arquivadas": exclusive, unlike the "mostrar arquivados" switch of ingredients. */
export function StatusSwitch({
  status,
  activeCount,
  archivedCount,
  onChange,
}: {
  status: RecipeStatus;
  activeCount: number;
  archivedCount: number;
  onChange: (status: RecipeStatus) => void;
}) {
  const options: { value: RecipeStatus; label: string }[] = [
    { value: "active", label: t.status.active(activeCount) },
    { value: "archived", label: t.status.archived(archivedCount) },
  ];
  return (
    <div role="group" aria-label={t.statusLabel} className="inline-flex rounded-lg border bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={status === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            status === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}