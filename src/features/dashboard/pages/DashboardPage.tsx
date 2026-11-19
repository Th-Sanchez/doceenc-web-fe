import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { messageForError, messages } from "@/i18n/messages";
import { DashboardCards } from "../components/DashboardCards";
import { isDashboardEmpty } from "../model";
import { useDashboard } from "../queries";

const t = messages.dashboard;

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useDashboard();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button className="hidden lg:inline-flex" onClick={() => navigate("/orders/new")}>
          <Plus aria-hidden className="size-4" />{t.new}
        </Button>
      </header>

      {isPending ? (
        <div role="status" aria-label={messages.loading} className="h-64 animate-pulse rounded-2xl bg-card" />
      ) : error ? (
        <div role="alert" className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{messageForError(error) || t.loadError}</p>
          <Button variant="outline" className="mt-3" onClick={() => void refetch()}>{t.retry}</Button>
        </div>
      ) : isDashboardEmpty(data) ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <h2 className="font-display text-lg font-semibold">{t.empty.title}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t.empty.description}</p>
          <Button className="mt-4" onClick={() => navigate("/orders/new")}>
            <Plus aria-hidden className="size-4" />{t.new}
          </Button>
        </div>
      ) : (
        <DashboardCards data={data} />
      )}

      <Button className="fixed bottom-20 right-4 z-10 size-14 rounded-full shadow-lg lg:hidden" aria-label={t.new} onClick={() => navigate("/orders/new")}>
        <Plus aria-hidden className="size-6" />
      </Button>
    </div>
  );
}