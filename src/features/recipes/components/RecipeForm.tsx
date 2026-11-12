import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LockKeyhole, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router";
import type { Recipe } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CategoriesDialog } from "@/features/categories/CategoriesDialog";
import { useRecipeCategories } from "@/features/categories/queries";
import { useIngredients } from "@/features/ingredients/queries";
import { BASE_UNITS } from "@/features/ingredients/units";
import { messages } from "@/i18n/messages";
import { toInputText } from "@/lib/decimal";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { toSimulationBody } from "../payload";
import { useRecipeSimulation } from "../queries";
import {
  type CreateRecipeFormInput,
  type CreateRecipeFormValues,
  createSchema,
  type SimulationFormInput,
} from "../schemas";
import { CostSummary } from "./CostSummary";
import { IngredientPicker } from "./IngredientPicker";
import { type IngredientInfo, RecipeItemRow } from "./RecipeItemRow";

const t = messages.recipeForm;

const SERVER_ERRORS = {
  fields: {
    name: "name",
    categoryId: "categoryId",
    yieldQuantity: "yieldQuantity",
    yieldUnit: "yieldUnit",
    prepTimeMinutes: "prepTimeMinutes",
    shelfLifeDays: "shelfLifeDays",
    items: "items",
  },
  codes: {
    RECIPE_ALREADY_EXISTS: "name",
    ARCHIVED_RECIPE_EXISTS: "name",
    CATEGORY_NOT_FOUND: "categoryId",
    CATEGORY_TYPE_MISMATCH: "categoryId",
    DUPLICATE_RECIPE_ITEM: "items",
    ARCHIVED_INGREDIENT_NOT_ALLOWED: "items",
    INGREDIENT_NOT_FOUND: "items",
  },
} satisfies ServerErrorMapping<CreateRecipeFormInput>;

const EMPTY: CreateRecipeFormInput = {
  name: "",
  categoryId: "",
  yieldQuantity: "",
  yieldUnit: "UNIT",
  prepTimeMinutes: "",
  shelfLifeDays: "",
  items: [],
};

function toDefaults(recipe: Recipe): CreateRecipeFormInput {
  return {
    name: recipe.name,
    categoryId: recipe.category.id,
    yieldQuantity: toInputText(recipe.yieldQuantity),
    yieldUnit: recipe.yieldUnit,
    prepTimeMinutes: recipe.prepTimeMinutes === null ? "" : String(recipe.prepTimeMinutes),
    shelfLifeDays: recipe.shelfLifeDays === null ? "" : String(recipe.shelfLifeDays),
    items: recipe.items.map((item) => ({ ingredientId: item.ingredient.id, quantity: toInputText(item.quantity) })),
  };
}

interface Props {
  /** Present when editing: it fills the form and locks the yield unit. */
  recipe?: Recipe;
  pending: boolean;
  submitLabel: string;
  /** `fail` puts the server's error on the right field or in the form alert. */
  onSubmit: (values: CreateRecipeFormValues, fail: (error: unknown) => void) => void;
}

export function RecipeForm({ recipe, pending, submitLabel, onSubmit }: Props) {
  const categories = useRecipeCategories();
  const catalog = useIngredients();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateRecipeFormInput, unknown, CreateRecipeFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: recipe ? toDefaults(recipe) : EMPTY,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const unit = watch("yieldUnit");
  const yieldText = watch("yieldQuantity");
  const items = watch("items");

  // What the rows show about each ingredient: the catalog (fresh) over what the recipe carried.
  const known = useMemo(() => {
    const byId = new Map<string, IngredientInfo>();
    for (const item of recipe?.items ?? []) byId.set(item.ingredient.id, item.ingredient);
    for (const ingredient of catalog.data ?? []) byId.set(ingredient.id, ingredient);
    return byId;
  }, [recipe, catalog.data]);

  // Live cost: the request is the (debounced) text of the form, and an incomplete form makes none.
  const requestKey = JSON.stringify({ yieldQuantity: yieldText, items });
  const debouncedKey = useDebouncedValue(requestKey, 300);
  const simulationInput = useMemo(
    () => toSimulationBody(JSON.parse(debouncedKey) as SimulationFormInput),
    [debouncedKey],
  );
  const simulation = useRecipeSimulation(simulationInput);
  // placeholder data would keep showing the last numbers while the form is incomplete
  const priced = simulationInput ? simulation.data : undefined;
  const costByIngredient = useMemo(
    () => new Map(priced?.items.map((line) => [line.ingredient.id, line.cost] as const)),
    [priced],
  );
  const pickedIds = useMemo(() => new Set(items.map((item) => item.ingredientId)), [items]);

  const fail = (error: unknown) => setFormError(applyServerError(error, setError, SERVER_ERRORS));
  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, fail);
  });

  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const fieldClass = "h-[50px] rounded-xl border-0 bg-[#f5f3f0] text-sm";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-5">
      <div className="flex items-center justify-between py-1">
        <Link to="/recipes" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>
        <span className="text-xs text-muted-foreground">{t.subtitle}</span>
      </div>
      <h1 className="hidden font-display text-2xl font-bold lg:block">{recipe ? t.editTitle : t.newTitle}</h1>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:gap-5">
        <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="flex flex-col gap-3 sm:gap-5">
            <section className="flex flex-col gap-5 rounded-2xl border border-[#eee8e5] bg-card p-3 shadow-sm sm:p-5">
              <div>
                <h2 className="text-base font-semibold">{t.basicsTitle}</h2>
                <p className="text-xs text-muted-foreground">{t.basicsDescription}</p>
              </div>

              <Field id="name" label={t.name} hint={messages.form.required} error={errors.name?.message}>
                <Input
                  placeholder={t.namePlaceholder}
                  maxLength={120}
                  className={fieldClass}
                  {...fieldProps("name", errors.name?.message)}
                  {...register("name")}
                />
              </Field>

              <Field id="categoryId" label={t.category} hint={messages.form.required} error={errors.categoryId?.message}>
                <Select
                  // options arrive after mount on a cold load: remount so the select picks up the form's value
                  key={categories.isPending ? "loading" : "ready"}
                  disabled={categories.isPending}
                  className={fieldClass}
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

              <Field id="yieldQuantity" label={t.yield} hint={messages.form.required} error={errors.yieldQuantity?.message}>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    autoComplete="off"
                    className={cn(fieldClass, "pr-12")}
                    {...fieldProps("yieldQuantity", errors.yieldQuantity?.message)}
                    {...register("yieldQuantity")}
                  />
                  <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {messages.units[unit]}
                  </span>
                </div>
              </Field>

              {recipe ? (
                <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3 text-sm">
                  <p>
                    <span className="font-medium">{t.yieldUnit}: </span>
                    {messages.ingredientForm.units[recipe.yieldUnit]}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LockKeyhole aria-hidden className="size-3" />
                    {t.yieldUnitLocked}
                  </p>
                </div>
              ) : (
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-medium">{t.yieldUnit}</legend>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f5f3f0] p-1">
                    {BASE_UNITS.map((option) => (
                      <label key={option} className="cursor-pointer">
                        <input type="radio" value={option} className="peer sr-only" {...register("yieldUnit")} />
                        <span className="block rounded-lg px-2 py-2.5 text-center text-sm font-medium text-muted-foreground peer-checked:bg-card peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                          {messages.units[option]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <LockKeyhole aria-hidden className="size-3" />
                    {t.yieldUnitLocked}
                  </p>
                </fieldset>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="prepTimeMinutes" label={t.prep} hint={messages.form.optional} error={errors.prepTimeMinutes?.message}>
                  <Input
                    inputMode="numeric"
                    autoComplete="off"
                    className={fieldClass}
                    {...fieldProps("prepTimeMinutes", errors.prepTimeMinutes?.message)}
                    {...register("prepTimeMinutes")}
                  />
                </Field>
                <Field id="shelfLifeDays" label={t.shelfLife} hint={messages.form.optional} error={errors.shelfLifeDays?.message}>
                  <Input
                    inputMode="numeric"
                    autoComplete="off"
                    className={fieldClass}
                    {...fieldProps("shelfLifeDays", errors.shelfLifeDays?.message)}
                    {...register("shelfLifeDays")}
                  />
                </Field>
              </div>
            </section>

            <section aria-labelledby="items-title" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 id="items-title" className="text-base font-semibold">
                  {t.itemsTitle}
                </h2>
                <span className="rounded-full bg-[#f9d8d2] px-2.5 py-1 text-xs font-semibold text-[#765d58]">
                  {t.itemCount(fields.length)}
                </span>
              </div>

              <ul className="flex flex-col gap-3">
                {fields.map((field, index) => {
                  const ingredientId = items[index]?.ingredientId ?? field.ingredientId;
                  return (
                    <RecipeItemRow
                      key={field.id}
                      index={index}
                      info={known.get(ingredientId)}
                      register={register}
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
                {t.addItem}
              </button>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20">
            <CostSummary
              data={priced}
              complete={simulationInput !== null}
              isFetching={simulationInput !== null && simulation.isFetching}
              isError={simulationInput !== null && simulation.isError}
              yieldUnit={unit}
              yieldQuantity={simulationInput?.yieldQuantity}
            />
          </aside>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={pending} className="h-12 w-full sm:w-auto">
            <Save aria-hidden className="size-4" />
            {pending ? messages.form.saving : submitLabel}
          </Button>
          <Link
            to="/recipes"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#f9d8d2] px-4 text-sm font-medium text-[#765d58] hover:bg-[#f4cec7] sm:w-auto"
          >
            {messages.form.cancel}
          </Link>
        </div>
      </form>

      <IngredientPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        ingredients={catalog.data}
        excludedIds={pickedIds}
        onPick={(ingredient) => {
          append({ ingredientId: ingredient.id, quantity: "" });
          setPickerOpen(false);
        }}
      />
      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} type="RECIPE" />
    </div>
  );
}