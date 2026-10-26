import { NavLink, Outlet, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/auth/session";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

/** Each slice adds its entries here (ingredients, recipes, products, settings...). */
const navItems = [{ to: "/", label: messages.nav.home, end: true }];

export function AppLayout() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const onLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <span className="font-semibold text-primary">{messages.appName}</span>
          <nav aria-label="Principal" className="flex flex-1 gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-muted",
                    isActive && "bg-muted text-primary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="hidden text-sm text-muted-foreground sm:inline">{session.data?.email}</span>
          <Button variant="outline" size="sm" onClick={onLogout} disabled={logout.isPending}>
            {messages.nav.logout}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
