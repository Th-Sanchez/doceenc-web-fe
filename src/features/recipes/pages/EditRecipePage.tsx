import { Link, useNavigate } from "react-router";
import type { Recipe } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messageForError, messages } from "@/i18n/messages";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeGate } from "../components/RecipeGate";
import { toUpdateBody } from "../payload";
import { useRestoreRecipe, useUpdateRecipe } from "../queries";

const t = messages.recipeForm;

function EditRecipe({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  const update = useUpdateRecipe();
  const restore = useRestoreRecipe();

  // An archived recipe is read-only until restored; restoring puts the fresh recipe in the cache and the form appears.
  if (!recipe.active) {
    return (
      <div role="status" className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="font-semibold">{t.archivedBanner.title}</p>
        <p className="text-sm">{t.archivedBanner.description}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => restore.mutate(recipe.id)} disabled={restore.isPending}>
            {restore.isPending ? t.archivedBanner.restoring : t.archivedBanner.restore}
          </Button>
          <Link to="/recipes" className={buttonVariants({ variant: "outline" })}>
            {t.backToList}
          </Link>
        </div>
        {restore.isError && (
          <p role="alert" className="text-sm text-destructive">
            {messageForError(restore.error)}
          </p>
        )}
      </div>
    );
  }

  return (
    <RecipeForm
      recipe={recipe}
      pending={update.isPending}
      submitLabel={t.saveChanges}
      onSubmit={(values, fail) =>
        update.mutate(
          { id: recipe.id, ...toUpdateBody(values) },
          { onSuccess: () => navigate("/recipes"), onError: fail },
        )
      }
    />
  );
}

export function EditRecipePage() {
  return <RecipeGate>{(recipe) => <EditRecipe recipe={recipe} />}</RecipeGate>;
}