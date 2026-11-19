import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CreateCustomerInput, Customer, UpdateCustomerInput } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => unwrap(api.GET("/api/v1/customers")),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => unwrap(api.GET("/api/v1/customers/{id}", { params: { path: { id: id as string } } })),
    enabled: !!id,
  });
}

function useCustomerMutation<TVariables>(request: (variables: TVariables) => Promise<Customer>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      return queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export const useCreateCustomer = () =>
  useCustomerMutation((body: CreateCustomerInput) => unwrap(api.POST("/api/v1/customers", { body })));

export const useUpdateCustomer = () =>
  useCustomerMutation(({ id, ...body }: { id: string } & UpdateCustomerInput) =>
    unwrap(api.PUT("/api/v1/customers/{id}", { params: { path: { id } }, body })),
  );

export const useArchiveCustomer = () =>
  useCustomerMutation((id: string) =>
    unwrap(api.POST("/api/v1/customers/{id}/archive", { params: { path: { id } } })),
  );

export const useRestoreCustomer = () =>
  useCustomerMutation((id: string) =>
    unwrap(api.POST("/api/v1/customers/{id}/restore", { params: { path: { id } } })),
  );
