import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CreateIngredientInput, Ingredient, PriceInput, UpdateIngredientInput } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const ingredientKeys = {
  all: ["ingredients"] as const,
  list: () => [...ingredientKeys.all, "list"] as const,
  prices: (id: string) => [...ingredientKeys.all, "prices", id] as const,
};

/** The whole catalog, archived included: search, category, sorting and pages are done in the client. */
export function useIngredients() {
  return useQuery({
    queryKey: ingredientKeys.list(),
    queryFn: () => unwrap(api.GET("/api/v1/ingredients")),
  });
}

export function useIngredientPrices(id: string | undefined) {
  return useQuery({
    queryKey: ingredientKeys.prices(id ?? ""),
    queryFn: () =>
      unwrap(api.GET("/api/v1/ingredients/{id}/prices", { params: { path: { id: id as string } } })),
    enabled: !!id,
  });
}

/** Every write refreshes the list and the price histories; the promise keeps the mutation pending until then. */
function useIngredientMutation<TVariables>(request: (variables: TVariables) => Promise<Ingredient>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ingredientKeys.all }),
  });
}

export const useCreateIngredient = () =>
  useIngredientMutation((body: CreateIngredientInput) => unwrap(api.POST("/api/v1/ingredients", { body })));

export const useUpdateIngredient = () =>
  useIngredientMutation(({ id, ...body }: { id: string } & UpdateIngredientInput) =>
    unwrap(api.PUT("/api/v1/ingredients/{id}", { params: { path: { id } }, body })),
  );

export const useRegisterPurchase = () =>
  useIngredientMutation(({ id, ...body }: { id: string } & PriceInput) =>
    unwrap(api.POST("/api/v1/ingredients/{id}/prices", { params: { path: { id } }, body })),
  );

export const useArchiveIngredient = () =>
  useIngredientMutation((id: string) =>
    unwrap(api.POST("/api/v1/ingredients/{id}/archive", { params: { path: { id } } })),
  );

export const useRestoreIngredient = () =>
  useIngredientMutation((id: string) =>
    unwrap(api.POST("/api/v1/ingredients/{id}/restore", { params: { path: { id } } })),
  );