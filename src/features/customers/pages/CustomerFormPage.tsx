import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Heart, LoaderCircle, MapPin, Phone, Save, ShieldCheck, Store, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import type { CustomerType } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { messageForError, messages } from "@/i18n/messages";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { toCustomerBody } from "../payload";
import { useCreateCustomer, useCustomer, useRestoreCustomer, useUpdateCustomer } from "../queries";
import { type CustomerFormInput, type CustomerFormValues, customerSchema } from "../schemas";

const t = messages.customerForm;
const SERVER_ERRORS = {
  fields: {
    name: "name",
    type: "type",
    phone: "phone",
    address: "address",
    storeName: "storeName",
    notes: "notes",
  },
  codes: {
    CUSTOMER_ALREADY_EXISTS: "name",
    CUSTOMER_NAME_ALREADY_EXISTS: "name",
    ARCHIVED_CUSTOMER_EXISTS: "name",
  },
} satisfies ServerErrorMapping<CustomerFormInput>;

const defaultValues: CustomerFormInput = {
  name: "",
  type: "WHOLESALE",
  storeName: "",
  phone: "",
  address: "",
  notes: "",
};

function CustomerTypeSelect({
  value,
  onChange,
}: {
  value: CustomerType;
  onChange: (value: CustomerType) => void;
}) {
  const options: { value: CustomerType; label: string; Icon: typeof UserRound }[] = [
    { value: "RETAIL", label: t.retail, Icon: UserRound },
    { value: "WHOLESALE", label: t.wholesale, Icon: Store },
  ];

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{t.category} <span className="text-primary">*</span></span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{t.categoryHint}</span>
      </legend>
      <div role="radiogroup" aria-label={t.category} className="grid grid-cols-2 gap-1 rounded-xl bg-[#f5f3f0] p-1">
        {options.map(({ value: option, label, Icon }) => (
          <label
            key={option}
            className="cursor-pointer"
          >
            <input
              type="radio"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-[#715954] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                value === option && "bg-primary text-primary-foreground shadow-sm",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground lg:hidden">{t.typeDescription}</p>
    </fieldset>
  );
}

export function CustomerFormPage() {
  const { id } = useParams();
  const isEditing = id !== undefined;
  const navigate = useNavigate();
  const customer = useCustomer(id);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const restore = useRestoreCustomer();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CustomerFormInput, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });
  const { register, handleSubmit, setValue, reset, setError, control, formState: { errors } } = form;
  const type = useWatch({ control, name: "type" });
  const name = useWatch({ control, name: "name" });
  const storeName = useWatch({ control, name: "storeName" });
  const notes = useWatch({ control, name: "notes" });

  useEffect(() => {
    if (!customer.data) return;
    reset({
      name: customer.data.name,
      type: customer.data.type,
      storeName: customer.data.storeName ?? "",
      phone: customer.data.phone ?? "",
      address: customer.data.address ?? "",
      notes: customer.data.notes ?? "",
    });
  }, [customer.data, reset]);

  const submit = handleSubmit((values) => {
    setFormError(null);
    const body = toCustomerBody(values);
    const callbacks = {
      onSuccess: () => navigate("/customers"),
      onError: (error: unknown) => setFormError(applyServerError(error, setError, SERVER_ERRORS)),
    };
    if (id) update.mutate({ id, ...body }, callbacks);
    else create.mutate(body, callbacks);
  });

  const restoreCustomer = () => {
    if (id) restore.mutate(id);
  };
  const saving = create.isPending || update.isPending;
  const shouldShowForm = !isEditing || customer.isSuccess;

  return (
    <div className="mx-auto flex w-full max-w-[768px] flex-col gap-4 pb-28 sm:gap-6 lg:pb-0">
      <header className="hidden flex-col gap-1 lg:flex">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px]">
          <Link to="/customers" className="font-bold text-muted-foreground">{t.back}</Link>
          <span aria-hidden className="text-[#dac0c3]">/</span>
          <span className="font-bold text-primary">{isEditing ? t.editTitle : t.newTitle}</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{isEditing ? t.editTitle : t.newTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#f9d8d2] px-2 py-1 text-[11px] font-bold text-[#765d58]">
            <BriefcaseBusiness aria-hidden className="size-3.5" />{t.activeProfile}
          </span>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="max-w-[230px]">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Heart aria-hidden className="size-3.5" /> Cadastro afetuoso
          </p>
          <p className="mt-1 text-sm leading-5 text-[#554245]">{t.mobileIntro}</p>
        </div>
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f9d8d2] text-primary">
          <Store className="size-4" />
        </span>
      </div>

      {isEditing && customer.isPending && (
        <div role="status" aria-label={messages.loading} className="h-[520px] animate-pulse rounded-2xl bg-muted" />
      )}
      {isEditing && customer.isError && (
        <div role="alert" className="rounded-xl border bg-card p-6">
          <p>{t.notFound}</p>
          <Link to="/customers" className="mt-3 inline-flex text-sm font-semibold text-primary">{t.backToList}</Link>
        </div>
      )}

      {isEditing && customer.data && !customer.data.active && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-[#f9d8d2] bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{t.archivedBanner.title}</p>
            <p className="text-sm text-muted-foreground">{t.archivedBanner.description}</p>
          </div>
          <Button onClick={restoreCustomer} disabled={restore.isPending}>
            {restore.isPending ? t.archivedBanner.restoring : t.archivedBanner.restore}
          </Button>
          {restore.isError && <p role="alert" className="text-sm text-destructive">{messageForError(restore.error)}</p>}
        </div>
      )}

      {shouldShowForm && !(isEditing && customer.data && !customer.data.active) && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 rounded-xl bg-card p-5 shadow-[0_2px_12px_-2px_rgba(110,95,98,0.08)] sm:p-6 lg:gap-6 lg:rounded-2xl lg:p-8">
            <CustomerTypeSelect value={type} onChange={(value) => setValue("type", value, { shouldDirty: true })} />

            <Field id="customer-name" label={t.name} required hint={`${name.length}/120`} error={errors.name?.message}>
              <div className="relative">
                <UserRound aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="customer-name"
                  placeholder={t.namePlaceholder}
                  maxLength={120}
                  autoComplete="name"
                  className="h-[52px] rounded-xl border-0 bg-[#f5f3f0] pl-11 text-sm"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "customer-name-error" : "customer-name-help"}
                  {...register("name")}
                />
              </div>
              <p id="customer-name-help" className="text-xs text-muted-foreground">{t.nameHint}</p>
            </Field>

            {type === "WHOLESALE" && (
              <Field
                id="customer-store-name"
                label={t.storeName}
                required
                hint={`${storeName.length}/120 · ${t.storeNameRequiredTag}`}
                error={errors.storeName?.message}
              >
                <div className="relative">
                  <BriefcaseBusiness aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-store-name"
                    placeholder={t.storeNamePlaceholder}
                    maxLength={120}
                    className="h-[52px] rounded-xl border-0 bg-[#f5f3f0] pl-11 text-sm"
                    aria-invalid={Boolean(errors.storeName)}
                    {...register("storeName")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t.storeNameHint}</p>
              </Field>
            )}

            <Field id="customer-phone" label={t.phone} error={errors.phone?.message}>
              <div className="relative">
                <Phone aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.phonePlaceholder}
                  maxLength={18}
                  className="h-[52px] rounded-xl border-0 bg-[#f5f3f0] pl-11 text-sm"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby="customer-phone-help"
                  {...register("phone")}
                />
              </div>
              <p id="customer-phone-help" className="text-xs text-muted-foreground">{t.phoneHint}</p>
            </Field>

            <Field id="customer-address" label={t.address} hint={t.maxCharacters(255)} error={errors.address?.message}>
              <div className="relative">
                <MapPin aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="customer-address"
                  placeholder={t.addressPlaceholder}
                  maxLength={255}
                  autoComplete="street-address"
                  className="h-[52px] rounded-xl border-0 bg-[#f5f3f0] pl-11 text-sm"
                  aria-invalid={Boolean(errors.address)}
                  {...register("address")}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t.addressHint}</p>
            </Field>

            <Field id="customer-notes" label={t.notes} hint={`${notes.length}/1000`} error={errors.notes?.message}>
              <textarea
                id="customer-notes"
                placeholder={t.notesPlaceholder}
                maxLength={1000}
                rows={4}
                className="min-h-24 resize-y rounded-xl border-0 bg-[#f5f3f0] px-4 py-3 text-sm"
                aria-invalid={Boolean(errors.notes)}
                {...register("notes")}
              />
              <p className="text-xs text-muted-foreground">{t.notesHint}</p>
            </Field>

            {formError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-border/70 bg-[#fbf9f6]/95 px-4 py-3 backdrop-blur-xl lg:static lg:flex-row lg:justify-between lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <Link
              to="/customers"
              className="order-2 inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-semibold text-[#554245] hover:bg-muted lg:order-1"
            >
              {messages.form.cancel}
            </Link>
            <Button type="submit" disabled={saving} className="order-1 h-12 w-full rounded-xl shadow-sm lg:order-2 lg:w-auto lg:px-8">
              {saving ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
              {saving ? t.saving : isEditing ? t.saveChanges : t.save}
            </Button>
          </div>
        </form>
      )}

      {!isEditing && (
        <p className="hidden items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground lg:flex">
          <ShieldCheck aria-hidden className="size-3.5" />{t.footer}
        </p>
      )}
    </div>
  );
}
