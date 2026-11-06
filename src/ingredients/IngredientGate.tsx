import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { useIngredient } from "./queries";

export function IngredientGate({ children }: { children: (ingredient: Ingredient) => ReactNode }) {
  const { id } = useParams();
  const query = useIngredient(id);

  if (query.isPending) return <p role="status">{messages.loading}</p>;
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
        <p>{messages.ingredients.loadError}</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          {messages.ingredients.retry}
        </Button>
      </div>
    );
  }
  if (!query.data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
        <p>{messages.ingredientForm.notFound}</p>
        <Link to="/ingredients" className={buttonVariants({ variant: "outline" })}>
          {messages.ingredientForm.backToList}
        </Link>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}