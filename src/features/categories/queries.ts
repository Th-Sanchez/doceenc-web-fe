import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Category } from "@/api/types";
import { unwrap } from "@/api/unwrap";
import { ingredientKeys } from "@/features/ingredients/queries";

export type CategoryType = Category["type"];

export const categoryKeys = {
  all: ["categories"] as const,
  byType: (type: CategoryType) => [...categoryKeys.all, type] as const,
  ingredient: () => categoryKeys.byType("INGREDIENT"),
  recipe: () => categoryKeys.byType("RECIPE"),
};

export function useCategories(type: CategoryType, enabled = true) {
  return useQuery({
    queryKey: categoryKeys.byType(type),
    queryFn: () => unwrap(api.GET("/api/v1/categories", { params: { query: { type } } })),
    enabled,
  });
}

export const useIngredientCategories = (enabled = true) => useCategories("INGREDIENT", enabled);
export const useRecipeCategories = (enabled = true) => useCategories("RECIPE", enabled);

/**
 * The ingredient list embeds each category's name, so it is refreshed together with the categories.
 * Recipes embed it too, but recipe reads are never fresh (see recipes/queries.ts), so they pick the
 * change up on their own and this feature does not need to know about recipes.
 */
function useCategoryMutation<TVariables, TResult>(request: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ingredientKeys.all }),
      ]),
  });
}

export const useCreateCategory = (type: CategoryType = "INGREDIENT") =>
  useCategoryMutation((name: string) => unwrap(api.POST("/api/v1/categories", { body: { name, type } })));

export const useRenameCategory = () =>
  useCategoryMutation(({ id, name }: { id: string; name: string }) =>
    unwrap(api.PUT("/api/v1/categories/{id}", { params: { path: { id } }, body: { name } })),
  );

export const useDeleteCategory = () =>
  useCategoryMutation((id: string) =>
    unwrap(api.DELETE("/api/v1/categories/{id}", { params: { path: { id } } })),
  );