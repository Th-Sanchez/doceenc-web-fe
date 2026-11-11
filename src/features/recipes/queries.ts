import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CreateRecipeInput, Recipe, SimulateRecipeInput, UpdateRecipeInput } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const recipeKeys = {
  all: ["recipes"] as const,
  list: () => [...recipeKeys.all, "list"] as const,
  detail: (id: string) => [...recipeKeys.all, "detail", id] as const,
};

/**
 * Cost is computed on read from the ingredients' current prices, and ingredients cannot import
 * recipes to invalidate them. So recipe reads never count as fresh: reopening a screen always asks again.
 */
const ALWAYS_REFETCH = { staleTime: 0 } as const;

/** The whole book, archived included: search, category, status, sorting and pages are done in the client. */
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.list(),
    queryFn: () => unwrap(api.GET("/api/v1/recipes")),
    ...ALWAYS_REFETCH,
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ""),
    queryFn: () => unwrap(api.GET("/api/v1/recipes/{id}", { params: { path: { id: id as string } } })),
    enabled: !!id,
    ...ALWAYS_REFETCH,
  });
}

/**
 * Live cost for the form. The key is the request itself, so a response that arrives late for an
 * old input can never overwrite the one for the current input. Kept out of recipeKeys.all so
 * saving a recipe does not refetch every simulation that was ever typed.
 */
export function useRecipeSimulation(input: SimulateRecipeInput | null) {
  return useQuery({
    queryKey: ["recipeSimulation", input],
    queryFn: () => unwrap(api.POST("/api/v1/recipes/simulation", { body: input as SimulateRecipeInput })),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    ...ALWAYS_REFETCH,
  });
}

/** Every write returns the recipe: it goes straight into the detail cache and the list is refreshed. */
function useRecipeMutation<TVariables>(request: (variables: TVariables) => Promise<Recipe>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (recipe) => {
      queryClient.setQueryData(recipeKeys.detail(recipe.id), recipe);
      return queryClient.invalidateQueries({ queryKey: recipeKeys.list() });
    },
  });
}

export const useCreateRecipe = () =>
  useRecipeMutation((body: CreateRecipeInput) => unwrap(api.POST("/api/v1/recipes", { body })));

export const useUpdateRecipe = () =>
  useRecipeMutation(({ id, ...body }: { id: string } & UpdateRecipeInput) =>
    unwrap(api.PUT("/api/v1/recipes/{id}", { params: { path: { id } }, body })),
  );

export const useArchiveRecipe = () =>
  useRecipeMutation((id: string) =>
    unwrap(api.POST("/api/v1/recipes/{id}/archive", { params: { path: { id } } })),
  );

export const useRestoreRecipe = () =>
  useRecipeMutation((id: string) =>
    unwrap(api.POST("/api/v1/recipes/{id}/restore", { params: { path: { id } } })),
  );