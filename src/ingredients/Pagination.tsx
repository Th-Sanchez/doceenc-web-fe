import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages";

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
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {t.previous}
        </Button>
        <span>{t.page(page, pageCount)}</span>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          {t.next}
        </Button>
      </div>
    </nav>
  );
}