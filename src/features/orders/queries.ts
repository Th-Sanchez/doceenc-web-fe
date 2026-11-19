import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  Order,
  OrderCancellationInput,
  OrderConfirmationInput,
  OrderInput,
  OrderPage,
  OrderPaymentInput,
  OrderSimulation,
  OrderSimulationInput,
  OrderStatus,
  OrderPaymentStatus,
} from "@/api/types";
import { unwrap } from "@/api/unwrap";

export interface OrderListParams {
  status?: OrderStatus[];
  deliveryFrom?: string;
  deliveryTo?: string;
  customerId?: string;
  paymentStatus?: OrderPaymentStatus[];
  page: number;
  size: number;
}

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => [...orderKeys.all, "list", params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  simulation: (input: OrderSimulationInput) => ["orderSimulation", input] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => unwrap(api.GET("/api/v1/orders", { params: { query: params } })),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => unwrap(api.GET("/api/v1/orders/{id}", { params: { path: { id: id as string } } })),
    enabled: Boolean(id),
  });
}

export function useOrderSimulation(input: OrderSimulationInput | null) {
  return useQuery({
    queryKey: input ? orderKeys.simulation(input) : ["orderSimulation", null],
    queryFn: () => unwrap(api.POST("/api/v1/orders/simulation", { body: input as OrderSimulationInput })),
    enabled: input !== null,
  });
}

function useOrderMutation<TVariables>(request: (variables: TVariables) => Promise<Order>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      return queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export const useCreateOrder = () =>
  useOrderMutation((body: OrderInput) => unwrap(api.POST("/api/v1/orders", { body })));

export const useUpdateOrder = () =>
  useOrderMutation(({ id, ...body }: { id: string } & OrderInput) =>
    unwrap(api.PUT("/api/v1/orders/{id}", { params: { path: { id } }, body })),
  );

export const useConfirmOrder = () =>
  useOrderMutation(({ id, body }: { id: string; body: OrderConfirmationInput }) =>
    unwrap(api.POST("/api/v1/orders/{id}/confirm", { params: { path: { id } }, body })),
  );

export const useCancelOrder = () =>
  useOrderMutation(({ id, body }: { id: string; body: OrderCancellationInput }) =>
    unwrap(api.POST("/api/v1/orders/{id}/cancel", { params: { path: { id } }, body })),
  );

export const useDeliverOrder = () =>
  useOrderMutation((id: string) => unwrap(api.POST("/api/v1/orders/{id}/deliver", { params: { path: { id } } })));

export const useRegisterOrderPayment = () =>
  useOrderMutation(({ id, body }: { id: string; body: OrderPaymentInput }) =>
    unwrap(api.POST("/api/v1/orders/{id}/payments", { params: { path: { id } }, body })),
  );

export const useVoidOrderPayment = () =>
  useOrderMutation(({ id, paymentId }: { id: string; paymentId: string }) =>
    unwrap(api.POST("/api/v1/orders/{id}/payments/{paymentId}/void", { params: { path: { id, paymentId } } })),
  );

export type OrderPageResponse = OrderPage;
export type { OrderSimulation };
