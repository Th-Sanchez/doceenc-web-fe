import { IngredientsPage } from "@/ingredients/IngredientsPage";
import { HomePage } from "@/pages/HomePage";
import { Route } from "lucide-react";
// ...
          <Route index element={<HomePage />} />
          <Route path="ingredients" element={<IngredientsPage />} />