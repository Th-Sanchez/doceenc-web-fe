import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageCount: number;
  shown: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, shown, total, onChange }: Props) {
  const t = messages.ingredients.pagination;
  return (
    <nav aria-label={t.label} className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{t.summary(shown, total)}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label={t.previous}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="size-8 px-0"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Button>
        {Array.from({ length: pageCount }, (_, index) => {
          const number = index + 1;
          return (
            <Button
              key={number}
              variant="outline"
              size="sm"
              aria-label={t.page(number, pageCount)}
              aria-current={page === number ? "page" : undefined}
              onClick={() => onChange(number)}
              className={cn("size-8 px-0", page === number && "border-primary bg-primary text-primary-foreground hover:bg-primary")}
            >
              {number}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          aria-label={t.next}
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="size-8 px-0"
        >
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  );
}