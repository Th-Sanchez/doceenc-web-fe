import { QueryClient } from "@tanstack/react-query";
import { setUnauthorizedHandler } from "@/api/client";
import { sessionKey } from "@/auth/session";

export function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  });
  // A 401 on any request means the session ended: dropping the user sends the app to the login page.
  setUnauthorizedHandler(() => queryClient.setQueryData(sessionKey, null));
  return queryClient;
}
