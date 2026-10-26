import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { toApiError } from "@/api/problem";
import type { components } from "@/api/schema";

export type SessionUser = components["schemas"]["MeResponse"];

export const sessionKey = ["session"] as const;

/** The current user, or null when nobody is logged in. Errors mean "could not find out". */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async (): Promise<SessionUser | null> => {
      const { data, error, response } = await api.GET("/api/v1/auth/me");
      if (response.status === 401) return null;
      if (!data) throw toApiError(response.status, error);
      return data;
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { error, response } = await api.POST("/api/v1/auth/login", { body: credentials });
      if (!response.ok) throw toApiError(response.status, error);
    },
    // Returning the promise keeps the mutation pending until the session is loaded.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST("/api/v1/auth/logout");
    },
    onSettled: () => {
      queryClient.setQueryData(sessionKey, null);
      // Do not keep data of the previous user in memory.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] });
    },
  });
}
