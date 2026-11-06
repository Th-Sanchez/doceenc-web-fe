import { Route, Routes } from "react-router";
import { LoginPage } from "@/auth/LoginPage";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdjustPricePage } from "@/ingredients/AdjustPricePage";
import { EditIngredientPage } from "@/ingredients/EditIngredientPage";
import { IngredientsPage } from "@/ingredients/IngredientsPage";
import { NewIngredientPage } from "@/ingredients/NewIngredientPage";

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
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
