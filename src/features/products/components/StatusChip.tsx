import type { MarginStatus } from "@/api/types";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

const CHIP: Record<MarginStatus, string> = {
  ON_TARGET: "bg-emerald-100 text-[#00523b]",
  BELOW_TARGET: "bg-amber-100 text-amber-900",
  LOSS: "bg-red-100 text-red-800",
  NO_PRICE: "bg-muted text-muted-foreground",
};

export const BAR: Record<MarginStatus, string> = {
  ON_TARGET: "bg-[#00523b]",
  BELOW_TARGET: "bg-amber-500",
  LOSS: "bg-destructive",
  NO_PRICE: "bg-muted-foreground",
};

export function StatusChip({ status, className }: { status: MarginStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", CHIP[status], className)}>
      {messages.products.status[status]}
    </span>
  );
}