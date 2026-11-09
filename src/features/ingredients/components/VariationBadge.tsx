import { ArrowDown, ArrowUp } from "lucide-react";
import { messages } from "@/i18n/messages";
import { formatVariation, variationTrend } from "@/lib/format";
import { cn } from "@/lib/utils";

const styles = {
  up: "bg-[#ffd9de] text-[#802740]",
  down: "bg-[#abf1d1] text-[#00523b]",
  flat: "bg-[#efeeeb] text-[#554245]",
};

export function VariationBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span title={messages.ingredients.noVariation} className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">{messages.ingredients.noVariation}</span>
      </span>
    );
  }
  const trend = variationTrend(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        styles[trend],
      )}
    >
      {trend === "up" && <ArrowUp aria-hidden className="size-3" />}
      {trend === "down" && <ArrowDown aria-hidden className="size-3" />}
      {formatVariation(value)}
    </span>
  );
}