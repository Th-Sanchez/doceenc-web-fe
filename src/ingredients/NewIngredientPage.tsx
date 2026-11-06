import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LockKeyhole, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { ApiError } from "@/api/problem";
import type { Ingredient } from "@/api/types";
import { CategoriesDialog } from "@/categories/CategoriesDialog";
import { useIngredientCategories } from "@/categories/queries";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { messages } from "@/i18n/messages";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { toIsoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findArchivedTwin } from "./catalog";
import { toCreateBody } from "./payloads";
import { PriceFields } from "./PriceFields";
import { useCreateIngredient, useIngredients, useRestoreIngredient } from "./queries";
import { type CreateFormInput, type CreateFormValues, createSchema } from "./schemas";
import { BASE_UNITS } from "./units";

const SERVER_ERRORS = {
  fields: {
    name: "name",
    brandSupplier: "brandSupplier",
    categoryId: "categoryId",
    baseUnit: "baseUnit",
    "price.packagePrice": "packagePrice",
    "price.packageQuantity": "packageQuantity",
    "price.purchasedOn": "purchasedOn",
  },
  codes: {
    PURCHASE_DATE_IN_FUTURE: "purchasedOn",
    PRICE_OUT_OF_RANGE: "packageQuantity",
    CATEGORY_NOT_FOUND: "categoryId",
    CATEGORY_TYPE_MISMATCH: "categoryId",
  },
} satisfies ServerErrorMapping<CreateFormInput>;

export function NewIngredientPage() {
  const t = messages.ingredientForm;
  const navigate = useNavigate();
  const categories = useIngredientCategories();
  const ingredients = useIngredients();
  const create = useCreateIngredient();
  const restore = useRestoreIngredient();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [archivedTwin, setArchivedTwin] = useState<Ingredient | null>(null);

  const form = useForm<CreateFormInput, unknown, CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      brandSupplier: "",
      categoryId: "",
      baseUnit: "GRAM",
      packagePrice: "",
      packageQuantity: "",
      purchasedOn: toIsoDate(new Date()),
    },
  });
  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = form;
  const unit = watch("baseUnit");
  const quantityText = watch("packageQuantity");

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setArchivedTwin(null);
    create.mutate(toCreateBody(values), {
      onSuccess: () => navigate("/ingredients"),
      onError: (error) => {
        if (error instanceof ApiError && error.code === "ARCHIVED_INGREDIENT_EXISTS") {
          setArchivedTwin(findArchivedTwin(ingredients.data ?? [], values.name, values.brandSupplier));
        }
        setFormError(applyServerError(error, setError, SERVER_ERRORS));
      },
    });
  });

  const onRestoreTwin = () => {
    if (archivedTwin) restore.mutate(archivedTwin.id, { onSuccess: () => navigate("/ingredients") });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:gap-5">
      <div className="flex items-center justify-between py-1">
        <Link to="/ingredients" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>
        <span className="text-xs text-muted-foreground">{t.subtitle}</span>
      </div>
      <h1 className="hidden font-display text-2xl font-bold text-primary lg:block">{t.newTitle}</h1>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 sm:gap-5">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#eee8e5] bg-card p-3 shadow-sm sm:p-5">
          <Field id="name" label={t.name} hint={messages.form.required} error={errors.name?.message}>
            <Input
              placeholder={t.namePlaceholder}
              className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] text-sm"
              {...fieldProps("name", errors.name?.message)}
              {...register("name")}
            />
          </Field>

          <Field id="brandSupplier" label={t.brandSupplier} hint={messages.form.optional} error={errors.brandSupplier?.message}>
            <Input
              placeholder={t.brandSupplierPlaceholder}
              className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] text-sm"
              {...fieldProps("brandSupplier", errors.brandSupplier?.message)}
              {...register("brandSupplier")}
            />
          </Field>

          <Field id="categoryId" label={t.category} hint={messages.form.required} error={errors.categoryId?.message}>
            <Select
              disabled={categories.isPending}
              className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] text-sm"
              {...fieldProps("categoryId", errors.categoryId?.message)}
              {...register("categoryId")}
            >
              <option value="">{t.categoryPlaceholder}</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {categories.data?.length === 0 && <p className="text-xs text-muted-foreground">{t.noCategories}</p>}
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              className="self-end text-xs font-semibold text-primary"
            >
              {t.manageCategories}
            </button>
          </Field>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{t.unit}</span>
              <span className="text-xs text-muted-foreground">{messages.form.required}</span>
            </legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f5f3f0] p-1">
              {BASE_UNITS.map((option) => (
                <label key={option} className="cursor-pointer">
                  <input type="radio" value={option} className="peer sr-only" {...register("baseUnit")} />
                  <span className="block rounded-lg px-2 py-2.5 text-center text-xs font-medium text-muted-foreground peer-checked:bg-card peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring sm:text-sm">
                    {t.units[option]}
                  </span>
                </label>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <LockKeyhole aria-hidden className="size-3" />
              {t.unitLocked}
            </p>
          </fieldset>

          <PriceFields
            unit={unit}
            register={register}
            errors={{
              packagePrice: errors.packagePrice?.message,
              packageQuantity: errors.packageQuantity?.message,
              purchasedOn: errors.purchasedOn?.message,
            }}
            quantityText={quantityText}
            onQuickFill={(text) => setValue("packageQuantity", text, { shouldValidate: true, shouldDirty: true })}
          />

          {formError && (
            <div role="alert" className="flex flex-col items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p>{formError}</p>
              {archivedTwin && (
                <Button variant="outline" size="sm" onClick={onRestoreTwin} disabled={restore.isPending}>
                  {restore.isPending ? t.restoring : t.restoreExisting}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={create.isPending} className="h-12 w-full sm:w-auto">
            <Save aria-hidden className="size-4" />
            {create.isPending ? messages.form.saving : t.save}
          </Button>
          <Link
            to="/ingredients"
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#f9d8d2] px-4 text-sm font-medium text-[#765d58] hover:bg-[#f4cec7] sm:w-auto",
            )}
          >
            {messages.form.cancel}
          </Link>
        </div>
      </form>

      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}