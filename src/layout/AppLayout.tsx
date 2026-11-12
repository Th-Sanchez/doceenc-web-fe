import { ArrowLeft, BookOpen, Home, LogOut, Package, Tag } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import logoIcon from "@/assets/login-logo.svg";
import { useLogout, useSession } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { routeMetaFor } from "./routeMeta";

/** Each slice adds its entries here (products, settings...). */
const navItems = [
  { to: "/", label: messages.nav.home, end: true, icon: Home },
  { to: "/ingredients", label: messages.nav.ingredients, end: false, icon: Package },
  { to: "/recipes", label: messages.nav.recipes, end: false, icon: BookOpen },
];
const plannedItems = [{ label: messages.nav.products, icon: Tag }];
const comingSoon = [
  { label: messages.nav.orders },
  { label: messages.nav.customers },
  { label: messages.nav.reports },
];
const mobileItems = [...navItems, { label: messages.nav.productsShort, icon: Tag }];

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

function UserMenu({ email, onLogout, pending }: { email: string | undefined; onLogout: () => void; pending: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={messages.nav.userMenu}
          className="flex size-9 items-center justify-center rounded-full bg-[#f9d8d2] text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {email?.slice(0, 1).toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <p className="px-3 py-2 text-xs text-muted-foreground">{email}</p>
        <DropdownMenuItem disabled={pending} onSelect={onLogout}>
          {messages.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmailText({ email }: { email: string }) {
  const at = email.indexOf("@");
  if (at < 0) return <>{email}</>;
  return (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  );
}

export function AppLayout() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  // One layout at a time. Rendering both and hiding one with CSS would duplicate landmarks and
  // controls for assistive technology (and in tests, where no stylesheet is applied).
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const meta = routeMetaFor(location.pathname);
  const isFormRoute = meta?.form !== undefined;

  const onLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });
  };

  const logoutButton = (
    <Button variant="outline" size="sm" onClick={onLogout} disabled={logout.isPending} className="w-full">
      <LogOut aria-hidden className="size-4" />
      {messages.nav.logout}
    </Button>
  );

  return (
    <div className={cn("min-h-screen bg-[#fbf9f6]", isDesktop && "grid grid-cols-[16rem_minmax(0,1fr)]")}>
      {isDesktop && (
        <aside className="sticky top-0 flex h-screen flex-col gap-6 border-r bg-card p-4">
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
            {plannedItems.map(({ label, icon: Icon }) => (
              <span key={label} aria-disabled="true" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                <Icon aria-hidden className="size-4" />
                {label}
              </span>
            ))}
          </nav>
          <div className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground">{messages.nav.soon}</p>
            {comingSoon.map(({ label }) => (
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
          <div className="mt-auto flex flex-col gap-3 rounded-xl bg-muted p-3">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {session.data?.email?.slice(0, 1).toUpperCase()}
              </span>
              <span title={session.data?.email} className="min-w-0 flex-1 text-sm leading-snug [overflow-wrap:anywhere]">
                <EmailText email={session.data?.email ?? ""} />
              </span>
            </div>
            {logoutButton}
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          {isDesktop ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">{messages.login.brand}</span>
              <span aria-hidden className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{meta?.section ?? messages.nav.home}</span>
            </div>
          ) : isFormRoute ? (
            <div className="flex w-full items-center justify-between">
              <Link to={meta?.form?.backTo ?? "/"} aria-label={messages.nav.back} className="flex size-9 items-center justify-center">
                <ArrowLeft aria-hidden className="size-5" />
              </Link>
              <span className="flex flex-1 items-center justify-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#f9d8d2]">
                  <img src={logoIcon} alt="" className="size-4" />
                </span>
                <h1 className="font-display text-lg font-semibold">{meta?.form?.title}</h1>
              </span>
              <UserMenu email={session.data?.email} onLogout={onLogout} pending={logout.isPending} />
            </div>
          ) : (
            <>
              <Brand />
              <UserMenu email={session.data?.email} onLogout={onLogout} pending={logout.isPending} />
            </>
          )}
        </header>
        <main
          className={cn(
            "mx-auto w-full max-w-[1280px] px-4",
            isDesktop ? "py-6 lg:px-6" : "pb-28 pt-3",
            !isDesktop && isFormRoute && "pb-6",
          )}
        >
          <Outlet />
        </main>
      </div>

      {!isDesktop && !isFormRoute && (
        <nav
          aria-label={messages.nav.main}
          className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-card px-2 py-2"
        >
          {mobileItems.map((item) => {
            if (!("to" in item)) {
              const Icon = item.icon;
              return (
                <span key={item.label} aria-disabled="true" className="flex min-w-14 flex-col items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground">
                  <Icon aria-hidden className="size-5" />
                  {item.label}
                </span>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium text-muted-foreground",
                    isActive && "bg-[#f9d8d2] text-primary",
                  )
                }
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}