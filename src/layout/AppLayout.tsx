import { Home, LogOut, Package } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import logoIcon from "@/assets/login-logo.svg";
import { useLogout, useSession } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

/** Each slice adds its entries here (recipes, products, settings...). */
const navItems = [
  { to: "/", label: messages.nav.home, end: true, icon: Home },
  { to: "/ingredients", label: messages.nav.ingredients, end: false, icon: Package },
];
const comingSoon = [messages.nav.orders, messages.nav.customers, messages.nav.reports];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
        <img src={logoIcon} alt="" />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-lg font-semibold leading-5 text-primary">{messages.login.brand}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {messages.login.brandSubtitle}
        </span>
      </span>
    </div>
  );
}

export function AppLayout() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const onLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });
  };

  const logoutButton = (
    <Button variant="ghost" size="sm" onClick={onLogout} disabled={logout.isPending} aria-label={messages.nav.logout}>
      <LogOut aria-hidden className="size-4" />
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#fbf9f6] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r bg-card p-4 lg:flex">
        <div className="px-2 pt-2">
          <Brand />
        </div>
        <nav aria-label={messages.nav.main} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground">
            {messages.nav.operational}
          </p>
          {navItems.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary",
                )
              }
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground">{messages.nav.soon}</p>
          {comingSoon.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
            >
              {label}
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{messages.nav.soonBadge}</span>
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-muted p-3">
          <span className="truncate text-sm">{session.data?.email}</span>
          {logoutButton}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <Brand />
          {logoutButton}
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label={messages.nav.main}
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-card px-2 py-2 lg:hidden"
      >
        {navItems.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground",
                isActive && "bg-[#f9d8d2] text-primary",
              )
            }
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}