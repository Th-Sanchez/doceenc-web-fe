import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CreateProductInput, Product, SimulateProductInput, UpdateProductInput } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

/**
 * A product's cost comes from its recipe and from ingredient prices, which change in other
 * features that cannot invalidate these queries. So reads never count as fresh: reopening a
 * screen always asks again (the same rule the recipes follow).
 */
const ALWAYS_REFETCH = { staleTime: 0 } as const;

/** Every product, archived included: search, status, sorting and pages are done in the client. */
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: () => unwrap(api.GET("/api/v1/products")),
    ...ALWAYS_REFETCH,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => unwrap(api.GET("/api/v1/products/{id}", { params: { path: { id: id as string } } })),
    enabled: !!id,
    ...ALWAYS_REFETCH,
  });
}

/**
 * Live cost and margins for the form. The key is the request itself, so a late answer for an old
 * input can never overwrite the one for the current input. Kept out of productKeys.all so saving a
 * product does not refetch every simulation that was ever typed.
 */
export function useProductSimulation(input: SimulateProductInput | null) {
  return useQuery({
    queryKey: ["productSimulation", input],
    queryFn: () => unwrap(api.POST("/api/v1/products/simulation", { body: input as SimulateProductInput })),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    ...ALWAYS_REFETCH,
  });
}

/** Every write returns the product: it goes straight into the detail cache and the list is refreshed. */
function useProductMutation<TVariables>(request: (variables: TVariables) => Promise<Product>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      return queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}

export const useCreateProduct = () =>
  useProductMutation((body: CreateProductInput) => unwrap(api.POST("/api/v1/products", { body })));

export const useUpdateProduct = () =>
  useProductMutation(({ id, ...body }: { id: string } & UpdateProductInput) =>
    unwrap(api.PUT("/api/v1/products/{id}", { params: { path: { id } }, body })),
  );

export const useArchiveProduct = () =>
  useProductMutation((id: string) =>
    unwrap(api.POST("/api/v1/products/{id}/archive", { params: { path: { id } } })),
  );

export const useRestoreProduct = () =>
  useProductMutation((id: string) =>
    unwrap(api.POST("/api/v1/products/{id}/restore", { params: { path: { id } } })),
  );