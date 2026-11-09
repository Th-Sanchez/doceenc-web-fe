import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";
import { ingredientKeys } from "@/features/ingredients/queries";

export const categoryKeys = {
  all: ["categories"] as const,
  ingredient: () => [...categoryKeys.all, "INGREDIENT"] as const,
};

export function useIngredientCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.ingredient(),
    queryFn: () => unwrap(api.GET("/api/v1/categories", { params: { query: { type: "INGREDIENT" } } })),
    enabled,
  });
}

/** The ingredient list embeds each category's name, so it is refreshed together with the categories. */
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

export const useCreateCategory = () =>
  useCategoryMutation((name: string) =>
    unwrap(api.POST("/api/v1/categories", { body: { name, type: "INGREDIENT" } })),
  );

export const useRenameCategory = () =>
  useCategoryMutation(({ id, name }: { id: string; name: string }) =>
    unwrap(api.PUT("/api/v1/categories/{id}", { params: { path: { id } }, body: { name } })),
  );

export const useDeleteCategory = () =>
  useCategoryMutation((id: string) =>
    unwrap(api.DELETE("/api/v1/categories/{id}", { params: { path: { id } } })),
  );