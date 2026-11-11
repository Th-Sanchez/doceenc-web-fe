import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "@/api/problem";
import type { Recipe } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { useRecipe } from "../queries";

/** Loads the recipe of the route and handles loading, failure and "not found" for every page that needs it. */
export function RecipeGate({ children }: { children: (recipe: Recipe) => ReactNode }) {
  const { id } = useParams();
  const query = useRecipe(id);

  if (query.isPending) return <p role="status">{messages.loading}</p>;

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.code === "RECIPE_NOT_FOUND") {
      return (
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{messages.recipeForm.notFound}</p>
          <Link to="/recipes" className={buttonVariants({ variant: "outline" })}>
            {messages.recipeForm.backToList}
          </Link>
        </div>
      );
    }
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
        <p>{messages.recipes.loadError}</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          {messages.recipes.retry}
        </Button>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}