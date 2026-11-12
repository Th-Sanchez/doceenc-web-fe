import { Route, Routes } from "react-router";
import { RecipeDetailPage } from "@/features/recipes/pages/RecipeDetailPage";
import { LoginPage } from "@/auth/LoginPage";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdjustPricePage } from "@/features/ingredients/pages/AdjustPricePage";
import { EditIngredientPage } from "@/features/ingredients/pages/EditIngredientPage";
import { IngredientsPage } from "@/features/ingredients/pages/IngredientsPage";
import { NewIngredientPage } from "@/features/ingredients/pages/NewIngredientPage";
import { EditRecipePage } from "@/features/recipes/pages/EditRecipePage";
import { NewRecipePage } from "@/features/recipes/pages/NewRecipePage";
import { RecipesPage } from "@/features/recipes/pages/RecipePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="ingredients" element={<IngredientsPage />} />
          <Route path="ingredients/new" element={<NewIngredientPage />} />
          <Route path="ingredients/:id/edit" element={<EditIngredientPage />} />
          <Route path="ingredients/:id/price" element={<AdjustPricePage />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="recipes/:id" element={<RecipeDetailPage />} />
          <Route path="recipes/new" element={<NewRecipePage />} />
          <Route path="recipes/:id/edit" element={<EditRecipePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
