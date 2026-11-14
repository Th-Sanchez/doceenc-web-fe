import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router";
import { ApiError } from "@/api/problem";
import type { Product } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { IngredientPicker } from "@/features/recipes/components/IngredientPicker";
import { useIngredients } from "@/features/ingredients/queries";
import { recipesByStatus, sortRecipes } from "@/features/recipes/catalog";
import { formatRecipeUnitCostWithUnit } from "@/features/recipes/format";
import { useRecipes } from "@/features/recipes/queries";
import { messages } from "@/i18n/messages";
import { toInputText } from "@/lib/decimal";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { formatQuantity } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { toSimulationBody } from "../payload";
import { useProductSimulation } from "../queries";
import {
  type ProductFormInput,
  type ProductFormValues,
  productSchema,
  type SimulationFormInput,
} from "../schemas";
import { ChannelPanel } from "./ChannelPanel";
import { ProductCostSummary } from "./ProductCostSummary";
import { type ExtraInfo, ProductItemRow } from "./ProductItemRow";

const t = messages.productForm;

const SERVER_ERRORS = {
  fields: {
    name: "name",
    recipeId: "recipeId",
    recipeQuantity: "recipeQuantity",
    retailPrice: "retailPrice",
    wholesalePrice: "wholesalePrice",
    items: "items",
  },
  codes: {
    PRODUCT_ALREADY_EXISTS: "name",
    ARCHIVED_PRODUCT_EXISTS: "name",
    RECIPE_NOT_FOUND: "recipeId",
    ARCHIVED_RECIPE_NOT_ALLOWED: "recipeId",
    DUPLICATE_PRODUCT_ITEM: "items",
    ARCHIVED_INGREDIENT_NOT_ALLOWED: "items",
    INGREDIENT_NOT_FOUND: "items",
  },
} satisfies ServerErrorMapping<ProductFormInput>;

// The quantity starts blank on purpose: a silent default of 1 would be wrong for a recipe measured in grams.
const EMPTY: ProductFormInput = {
  name: "",
  recipeId: "",
  recipeQuantity: "",
  retailPrice: "",
  wholesalePrice: "",
  items: [],
};

const priceText = (price: number | null) => (price === null ? "" : toInputText(price, 2));

function toDefaults(product: Product): ProductFormInput {
  return {
    name: product.name,
    recipeId: product.recipe.id,
    recipeQuantity: toInputText(product.recipeQuantity),
    retailPrice: priceText(product.retail.price),
    wholesalePrice: priceText(product.wholesale.price),
    items: product.items.map((item) => ({ ingredientId: item.ingredientId, quantity: toInputText(item.quantity) })),
  };
}

interface Props {
  /** Present when editing: it fills the form. */
  product?: Product;
  pending: boolean;
  submitLabel: string;
  /** `fail` puts the server's error on the right field or in the form alert. */
  onSubmit: (values: ProductFormValues, fail: (error: unknown) => void) => void;
}

export function ProductForm({ product, pending, submitLabel, onSubmit }: Props) {
  const recipes = useRecipes();
  const catalog = useIngredients();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? toDefaults(product) : EMPTY,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const name = watch("name") ?? "";
  const recipeId = watch("recipeId");
  const recipeQuantity = watch("recipeQuantity");
  const retailPrice = watch("retailPrice");
  const wholesalePrice = watch("wholesalePrice");
  const items = watch("items");

  // Active recipes, plus the one the product already uses even if it was archived since.
  const recipeOptions = useMemo(() => {
    const all = recipes.data ?? [];
    const usable = sortRecipes(recipesByStatus(all, "active"), "name");
    const current = all.find((recipe) => recipe.id === product?.recipe.id && !recipe.active);
    return current ? [current, ...usable] : usable;
  }, [recipes.data, product]);
  const selectedRecipe = recipes.data?.find((recipe) => recipe.id === recipeId);

  // What the rows show about each extra item: the catalog (fresh) over what the product carried.
  const known = useMemo(() => {
    const byId = new Map<string, ExtraInfo>();
    for (const item of product?.items ?? []) {
      byId.set(item.ingredientId, {
        id: item.ingredientId,
        name: item.name,
        baseUnit: item.baseUnit,
        active: item.ingredientActive,
        unitPrice: item.unitPrice,
      });
    }
    for (const ingredient of catalog.data ?? []) byId.set(ingredient.id, ingredient);
    return byId;
  }, [product, catalog.data]);

  // Live numbers: the request is the (debounced) text of the form, and an incomplete form makes none.
  const requestKey = JSON.stringify({ recipeId, recipeQuantity, retailPrice, wholesalePrice, items });
  const debouncedKey = useDebouncedValue(requestKey, 300);
  const simulationInput = useMemo(
    () => toSimulationBody(JSON.parse(debouncedKey) as SimulationFormInput),
    [debouncedKey],
  );
  const simulation = useProductSimulation(simulationInput);
  // placeholder data would keep showing the last numbers while the form is incomplete
  const priced = simulationInput ? simulation.data : undefined;
  const costByIngredient = useMemo(
    () => new Map(priced?.items.map((line) => [line.ingredientId, line.cost] as const)),
    [priced],
  );
  const pickedIds = useMemo(() => new Set(items.map((item) => item.ingredientId)), [items]);

  const applySuggested = (field: "retailPrice" | "wholesalePrice") => (price: number) =>
    setValue(field, toInputText(price, 2), { shouldDirty: true, shouldValidate: true });

  const fail = (error: unknown) => {
    setDuplicateName(
      error instanceof ApiError && ["PRODUCT_ALREADY_EXISTS", "ARCHIVED_PRODUCT_EXISTS"].includes(error.code ?? ""),
    );
    setFormError(applyServerError(error, setError, SERVER_ERRORS));
  };
  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, fail);
  });

  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const fieldClass = "h-10 rounded-xl border-0 bg-[#f5f3f0] text-sm sm:h-[50px]";
  const unitLabel = selectedRecipe ? messages.units[selectedRecipe.yieldUnit] : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-5">
      <div className="hidden items-center justify-between py-1 lg:flex">
        <Link to="/products" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>
        <span className="text-xs text-muted-foreground">{t.subtitle}</span>
      </div>
      <h1 className="hidden font-display text-2xl font-bold lg:block">{product ? t.editTitle : t.newTitle}</h1>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:gap-5">
        <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex flex-col gap-3 sm:gap-5">
            <section className="flex flex-col gap-4 rounded-2xl border border-[#eee8e5] bg-card p-3 shadow-sm sm:gap-5 sm:p-5">
              <div>
                <h2 className="text-base font-semibold">{t.basicsTitle}</h2>
                <p className="text-xs text-muted-foreground">{t.basicsDescription}</p>
              </div>

              <Field id="name" label={t.name} hint={`${name.length}/120`} required error={errors.name?.message}>
                <Input
                  placeholder={t.namePlaceholder}
                  maxLength={120}
                  className={fieldClass}
                  {...fieldProps("name", errors.name?.message)}
                  {...register("name", {
                    onChange: () => {
                      if (duplicateName) {
                        setDuplicateName(false);
                        clearErrors("name");
                      }
                    },
                  })}
                />
              </Field>

              <Field id="recipeId" label={t.recipe} required error={errors.recipeId?.message}>
                <Select
                  // options arrive after mount on a cold load: remount so the select picks up the form's value
                  key={recipes.isPending ? "loading" : "ready"}
                  disabled={recipes.isPending}
                  className={fieldClass}
                  {...fieldProps("recipeId", errors.recipeId?.message)}
                  {...register("recipeId")}
                >
                  <option value="">{t.recipePlaceholder}</option>
                  {recipeOptions.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.active ? recipe.name : `${recipe.name} (${t.archivedTag})`}
                    </option>
                  ))}
                </Select>
                {recipes.data && recipeOptions.length === 0 && (
                  <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
                    <p>{t.noRecipes}</p>
                    <Link to="/recipes/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t.createRecipe}
                    </Link>
                  </div>
                )}
                {selectedRecipe && (
                  <p className="text-xs text-muted-foreground">
                    {t.recipeInfo(
                      formatQuantity(selectedRecipe.yieldQuantity, selectedRecipe.yieldUnit),
                      formatRecipeUnitCostWithUnit(selectedRecipe.costPerYieldUnit, selectedRecipe.yieldUnit),
                    )}
                  </p>
                )}
              </Field>

              <Field id="recipeQuantity" label={t.quantity} hint={t.quantityHint} required error={errors.recipeQuantity?.message}>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    autoComplete="off"
                    className={cn(fieldClass, unitLabel && "pr-12")}
                    {...fieldProps("recipeQuantity", errors.recipeQuantity?.message)}
                    {...register("recipeQuantity")}
                  />
                  {unitLabel && (
                    <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {unitLabel}
                    </span>
                  )}
                </div>
              </Field>
            </section>

            <section aria-labelledby="extras-title" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div>
                  <h2 id="extras-title" className="text-base font-semibold">
                    {t.extrasTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">{t.extrasDescription}</p>
                </div>
                <span className="rounded-full bg-[#f9d8d2] px-2.5 py-1 text-xs font-semibold text-[#765d58]">
                  {t.extrasCount(fields.length)}
                </span>
              </div>

              {fields.length === 0 && <p className="px-1 text-sm text-muted-foreground">{t.extrasEmpty}</p>}

              <ul className="flex flex-col gap-3">
                {fields.map((field, index) => {
                  const ingredientId = items[index]?.ingredientId ?? field.ingredientId;
                  return (
                    <ProductItemRow
                      key={field.id}
                      index={index}
                      info={known.get(ingredientId)}
                      quantityProps={register(`items.${index}.quantity`)}
                      error={errors.items?.[index]?.quantity?.message}
                      cost={costByIngredient.get(ingredientId)}
                      onRemove={() => remove(index)}
                    />
                  );
                })}
              </ul>

              {itemsError && (
                <p role="alert" className="text-sm text-destructive">
                  {itemsError}
                </p>
              )}

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden className="size-4" />
                {t.addExtra}
              </button>
            </section>
          </div>

          <aside className="flex flex-col gap-3 sm:gap-5">
            <ProductCostSummary
              data={priced}
              complete={simulationInput !== null}
              isFetching={simulationInput !== null && simulation.isFetching}
              isError={simulationInput !== null && simulation.isError}
            />
            <ChannelPanel
              fieldName="retailPrice"
              title={t.channel.retailTitle}
              subtitle={t.channel.retailSubtitle}
              inputProps={register("retailPrice")}
              error={errors.retailPrice?.message}
              pricing={priced?.retail}
              onUseSuggested={applySuggested("retailPrice")}
            />
            <ChannelPanel
              fieldName="wholesalePrice"
              title={t.channel.wholesaleTitle}
              subtitle={t.channel.wholesaleSubtitle}
              inputProps={register("wholesalePrice")}
              error={errors.wholesalePrice?.message}
              pricing={priced?.wholesale}
              onUseSuggested={applySuggested("wholesalePrice")}
            />
          </aside>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={pending || duplicateName} className="h-12 w-full sm:w-auto">
            {!duplicateName && <Save aria-hidden className="size-4" />}
            {pending ? messages.form.saving : duplicateName ? t.duplicateNameSave : submitLabel}
          </Button>
          <Link
            to="/products"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#f9d8d2] px-4 text-sm font-medium text-[#765d58] hover:bg-[#f4cec7] sm:w-auto"
          >
            {messages.form.cancel}
          </Link>
        </div>
      </form>

      <IngredientPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        copy={t.picker}
        ingredients={catalog.data}
        excludedIds={pickedIds}
        onPick={(ingredient) => {
          append({ ingredientId: ingredient.id, quantity: "" });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}