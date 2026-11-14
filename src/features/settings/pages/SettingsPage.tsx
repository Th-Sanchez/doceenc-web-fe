import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { useForm } from "react-hook-form";
import type { Settings } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages";
import { toInputText } from "@/lib/decimal";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { useSettings, useUpdateSettings } from "../queries";
import { type SettingsFormInput, type SettingsFormValues, settingsSchema } from "../schemas";

const t = messages.settings;

const SERVER_ERRORS = {
  fields: {
    targetMarginRetail: "targetMarginRetail",
    targetMarginWholesale: "targetMarginWholesale",
  },
} satisfies ServerErrorMapping<SettingsFormInput>;

const toDefaults = (settings: Settings): SettingsFormInput => ({
  targetMarginRetail: toInputText(settings.targetMarginRetail),
  targetMarginWholesale: toInputText(settings.targetMarginWholesale),
});

function PercentInput({ id, error, ...rest }: { id: string; error?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        autoComplete="off"
        className="h-10 rounded-xl border-0 bg-[#f5f3f0] pr-9 text-sm sm:h-[50px]"
        {...fieldProps(id, error)}
        {...rest}
      />
      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {t.percentSuffix}
      </span>
    </div>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const update = useUpdateSettings();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toDefaults(settings),
  });

  const submit = handleSubmit((values) => {
    setFormError(null);
    setSaved(false);
    update.mutate(values, {
      onSuccess: (updated) => {
        reset(toDefaults(updated));
        setSaved(true);
      },
      onError: (error) => setFormError(applyServerError(error, setError, SERVER_ERRORS)),
    });
  });

  const clearSaved = { onChange: () => setSaved(false) };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-[#eee8e5] bg-card p-4 shadow-sm sm:gap-5 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">{t.targetsTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.targetsDescription}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Field id="targetMarginRetail" label={t.retail} hint={t.hint} required error={errors.targetMarginRetail?.message}>
            <PercentInput id="targetMarginRetail" error={errors.targetMarginRetail?.message} {...register("targetMarginRetail", clearSaved)} />
          </Field>
          <Field id="targetMarginWholesale" label={t.wholesale} hint={t.hint} required error={errors.targetMarginWholesale?.message}>
            <PercentInput id="targetMarginWholesale" error={errors.targetMarginWholesale?.message} {...register("targetMarginWholesale", clearSaved)} />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">{t.affects}</p>
      </section>

      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm font-medium text-[#00523b]">
          {t.saved}
        </p>
      )}

      <div className="flex sm:justify-end">
        <Button type="submit" disabled={!isDirty || update.isPending} className="h-12 w-full sm:w-auto">
          <Save aria-hidden className="size-4" />
          {update.isPending ? messages.form.saving : t.save}
        </Button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const query = useSettings();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
      <header className="hidden flex-col gap-1 lg:flex">
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {query.isPending && <p role="status">{messages.loading}</p>}

      {query.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{t.loadError}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {query.data && <SettingsForm settings={query.data} />}
    </div>
  );
}