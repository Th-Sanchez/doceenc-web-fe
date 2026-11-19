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
import { EditProductPage } from "@/features/products/pages/EditProductPage";
import { NewProductPage } from "@/features/products/pages/NewProductPage";
import { ProductsPage } from "@/features/products/pages/ProductsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { CustomerFormPage } from "@/features/customers/pages/CustomerFormPage";
import { CustomersPage } from "@/features/customers/pages/CustomersPage";

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
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<NewProductPage />} />
          <Route path="products/:id/edit" element={<EditProductPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
