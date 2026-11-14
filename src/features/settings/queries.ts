import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { UpdateSettingsInput } from "@/api/types";
import { unwrap } from "@/api/unwrap";
import { productKeys } from "@/features/products/queries";

export const settingsKeys = {
  detail: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail,
    queryFn: () => unwrap(api.GET("/api/v1/settings")),
  });
}

/** The targets decide every product's status, so saving them refreshes the products too. */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSettingsInput) => unwrap(api.PUT("/api/v1/settings", { body })),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.detail, settings);
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}