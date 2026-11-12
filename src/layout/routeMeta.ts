import { matchPath } from "react-router";
import { messages } from "@/i18n/messages";

export interface RouteMeta {
  pattern: string;
  /** Breadcrumb label on desktop. */
  section: string;
  /** Pages with this swap the mobile header for "back + title" and hide the bottom navigation. */
  form?: { title: string; backTo: string };
}

/**
 * One place that knows how each page presents itself in the shell, so AppLayout has no
 * per-feature path checks. Each slice adds its entries here (the app uses <Routes>, not a data
 * router, so route `handle`/useMatches is not available).
 */
const routes: RouteMeta[] = [
  { pattern: "/", section: messages.nav.home },
  { pattern: "/ingredients", section: messages.nav.ingredientManagement },
  {
    pattern: "/ingredients/new",
    section: messages.nav.ingredientManagement,
    form: { title: messages.ingredientForm.newTitle, backTo: "/ingredients" },
  },
  {
    pattern: "/ingredients/:id/edit",
    section: messages.nav.ingredientManagement,
    form: { title: messages.ingredientForm.editTitle, backTo: "/ingredients" },
  },
  {
    pattern: "/ingredients/:id/price",
    section: messages.nav.ingredientManagement,
    form: { title: messages.priceForm.title, backTo: "/ingredients" },
  },
  { pattern: "/recipes", section: messages.nav.recipeBook },
  {
    pattern: "/recipes/new",
    section: messages.nav.recipeBook,
    form: { title: messages.recipeForm.newTitle, backTo: "/recipes" },
  },
  {
    pattern: "/recipes/:id/edit",
    section: messages.nav.recipeBook,
    form: { title: messages.recipeForm.editTitle, backTo: "/recipes" },
  },
  {
    pattern: "/recipes/:id",
    section: messages.nav.recipeBook,
    form: { title: messages.recipeSheet.title, backTo: "/recipes" },
  },
];

export function routeMetaFor(pathname: string): RouteMeta | null {
  return routes.find((route) => matchPath({ path: route.pattern, end: true }, pathname)) ?? null;
}