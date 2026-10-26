import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages";
import { useSession } from "./session";

/** Layout route: renders the nested routes only for a logged-in user. */
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-muted-foreground">
        {messages.loading}
      </div>
    );
  }

  if (session.isError) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p>{messages.sessionError.title}</p>
        <Button onClick={() => void session.refetch()}>{messages.sessionError.retry}</Button>
      </div>
    );
  }

  if (session.data === null) {
    // Remember where the user was going, to come back after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
