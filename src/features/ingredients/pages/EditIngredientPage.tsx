import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { Ingredient } from "@/api/types";
import { CategoriesDialog } from "@/features/categories/CategoriesDialog";
import { useIngredientCategories } from "@/features/categories/queries";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { messageForError, messages } from "@/i18n/messages";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { formatMoney, formatQuantity, formatUnitCost } from "@/lib/format";
import { ArchiveDialog } from "../components/ArchiveDialog";
import { IngredientGate } from "../components/IngredientGate";
import { toUpdateBody } from "../payloads";
import { useRestoreIngredient, useUpdateIngredient } from "../queries";
import { type EditFormInput, type EditFormValues, editSchema } from "../schemas";

const SERVER_ERRORS = {
  fields: { name: "name", brandSupplier: "brandSupplier", categoryId: "categoryId" },
  codes: { CATEGORY_NOT_FOUND: "categoryId", CATEGORY_TYPE_MISMATCH: "categoryId" },
} satisfies ServerErrorMapping<EditFormInput>;

function EditIngredientForm({ ingredient }: { ingredient: Ingredient }) {
  const t = messages.ingredientForm;
  const navigate = useNavigate();
  const categories = useIngredientCategories();
  const update = useUpdateIngredient();
  const restore = useRestoreIngredient();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [archiving, setArchiving] = useState<Ingredient | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<EditFormInput, unknown, EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: ingredient.name,
      brandSupplier: ingredient.brandSupplier ?? "",
      categoryId: ingredient.category.id,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    update.mutate(
      { id: ingredient.id, ...toUpdateBody(values) },
      {
        onSuccess: () => navigate("/ingredients"),
        onError: (error) => setFormError(applyServerError(error, setError, SERVER_ERRORS)),
      },
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/ingredients" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary">{t.editTitle}</h1>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <Field id="name" label={t.name} hint={messages.form.required} error={errors.name?.message}>
          <Input {...fieldProps("name", errors.name?.message)} {...register("name")} />
        </Field>

        <Field id="brandSupplier" label={t.brandSupplier} hint={messages.form.optional} error={errors.brandSupplier?.message}>
          <Input {...fieldProps("brandSupplier", errors.brandSupplier?.message)} {...register("brandSupplier")} />
        </Field>

        <Field id="categoryId" label={t.category} hint={messages.form.required} error={errors.categoryId?.message}>
          <Select disabled={categories.isPending} {...fieldProps("categoryId", errors.categoryId?.message)} {...register("categoryId")}>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <button type="button" onClick={() => setCategoriesOpen(true)} className="self-end text-xs font-semibold text-primary">
            {t.manageCategories}
          </button>
        </Field>

        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3 text-sm">
          <p>
            <span className="font-medium">{t.unit}: </span>
            {t.units[ingredient.baseUnit]}
          </p>
          <p className="text-xs text-muted-foreground">{t.unitLocked}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f9d8d2]/40 p-3 text-sm">
          <p>
            <span className="font-medium">{t.currentPrice}: </span>
            {formatMoney(ingredient.packagePrice)} / {formatQuantity(ingredient.packageQuantity, ingredient.baseUnit)} •{" "}
            {formatUnitCost(ingredient.unitPrice, ingredient.baseUnit)}
          </p>
          <Link to={`/ingredients/${ingredient.id}/price`} className="font-semibold text-primary">
            {t.adjustPrice}
          </Link>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/ingredients" className={buttonVariants({ variant: "outline" })}>
            {messages.form.cancel}
          </Link>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? messages.form.saving : t.saveChanges}
          </Button>
        </div>
      </form>

      {ingredient.active ? (
        <Button variant="ghost" className="self-start text-destructive" onClick={() => setArchiving(ingredient)}>
          {t.archive}
        </Button>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <Button variant="outline" onClick={() => restore.mutate(ingredient.id)} disabled={restore.isPending}>
            {restore.isPending ? t.restoring : t.restore}
          </Button>
          {restore.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageForError(restore.error)}
            </p>
          )}
        </div>
      )}

      <ArchiveDialog ingredient={archiving} onClose={() => setArchiving(null)} />
      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}

export function EditIngredientPage() {
  return <IngredientGate>{(ingredient) => <EditIngredientForm ingredient={ingredient} />}</IngredientGate>;
}