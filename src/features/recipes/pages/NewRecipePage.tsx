import { useNavigate } from "react-router";
import { messages } from "@/i18n/messages";
import { RecipeForm } from "../components/RecipeForm";
import { toCreateBody } from "../payload";
import { useCreateRecipe } from "../queries";

export function NewRecipePage() {
  const navigate = useNavigate();
  const create = useCreateRecipe();

  return (
    <RecipeForm
      pending={create.isPending}
      submitLabel={messages.recipeForm.save}
      onSubmit={(values, fail) =>
        create.mutate(toCreateBody(values), { onSuccess: () => navigate("/recipes"), onError: fail })
      }
    />
  );
}