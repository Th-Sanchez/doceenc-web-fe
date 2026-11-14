# doceenc-web

Frontend of the Doceenc system: a small web app that lets a home bakery owner track ingredient prices,
recipe costs and product margins. It talks to [`doceenc-core-api`](https://github.com/Th-Sanchez/doceenc-core-api) (Spring Boot).

**Stack:** React 19 · TypeScript · Vite · React Router · TanStack Query · Tailwind CSS v4 ·
shadcn/ui-style components · React Hook Form + Zod · `openapi-typescript` / `openapi-fetch` ·
Vitest + Testing Library + MSW.

## Getting started

Requires Node 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to http://localhost:8080
```

Start the backend with its `dev` profile first (see its README). In development the browser only talks
to the Vite origin and Vite forwards `/api` to the backend, so the session cookie is same-origin and no
CORS setup is needed.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with the API proxy |
| `npm test` | Runs the test suite once (`npm run test:watch` for watch mode) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run build` | Typechecks and builds to `dist/` |
| `npm run api:sync` | Downloads the OpenAPI contract from a running backend and regenerates the types |

## API contract and types

The backend is the source of truth for the API. `openapi/openapi.json` is a snapshot of its contract and
`src/api/schema.d.ts` is generated from it (do not edit by hand). When the backend changes:

```bash
# backend running with the dev profile
npm run api:sync
```

Commit both files together with the code that uses the change.

## How authentication works

The API uses a server-side session identified by an `HttpOnly`, `SameSite=Strict` cookie, so the frontend
never handles a token.

- On load the app calls `GET /api/v1/auth/me`: 200 shows the app, 401 shows the login page.
- Every request is sent with `credentials: "include"`. Requests that change state also send the
  `X-Requested-With` header, which the API requires as CSRF protection (see `src/api/client.ts`).
- A 401 on any other request means the session ended: the app drops the user and redirects to login.
- API errors carry a stable `code`; user-facing texts live in `src/i18n/messages.ts`.

## Configuration

Build-time variables (public, they end up in the bundle):

| Variable | Default | Meaning |
|---|---|---|
| `VITE_APP_NAME` | `Doceenc` | Name shown in the UI and the page title |
| `VITE_API_BASE_URL` | empty | API origin. Empty = same origin. In production with separate origins, e.g. `https://api.example.com` |

In production the frontend and the API must share the same site (for example `app.example.com` and
`api.example.com`) so the `SameSite=Strict` cookie is sent.

## Project layout

```
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── openapi/
│   └── openapi.json
├── scripts/
│   └── sync-api.mjs
├── src/
│   ├── api/
│   │   ├── client.test.ts
│   │   ├── client.ts
│   │   ├── problem.ts
│   │   ├── schema.d.ts
│   │   ├── types.ts
│   │   └── unwrap.ts
│   ├── app/
│   │   ├── AppRoutes.tsx
│   │   └── queryClient.ts
│   ├── assets/
│   │   ├── login-arrow.svg
│   │   ├── login-audit.svg
│   │   ├── login-back.svg
│   │   ├── login-bakery.svg
│   │   ├── login-cost.svg
│   │   ├── login-email.svg
│   │   ├── login-eye.svg
│   │   ├── login-google.svg
│   │   ├── login-heart.svg
│   │   ├── login-hero.png
│   │   ├── login-lock.svg
│   │   ├── login-logo.svg
│   │   ├── login-margin.svg
│   │   ├── login-price.svg
│   │   ├── login-quote.svg
│   │   ├── login-secure.svg
│   │   └── login-trend.svg
│   ├── auth/
│   │   ├── LoginPage.test.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RequireAuth.test.tsx
│   │   ├── RequireAuth.tsx
│   │   └── session.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button-variants.ts
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── field-props.ts
│   │   │   ├── field.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── switch.tsx
│   │   ├── Chip.tsx
│   │   └── Pagination.tsx
│   ├── features/
│   │   ├── categories/
│   │   │   ├── CategoriesDialog.tsx
│   │   │   └── queries.ts
│   │   ├── ingredients/
│   │   │   ├── components/
│   │   │   │   ├── ArchiveDialog.tsx
│   │   │   │   ├── IngredientActions.tsx
│   │   │   │   ├── IngredientGate.tsx
│   │   │   │   ├── IngredientList.tsx
│   │   │   │   ├── PriceChart.tsx
│   │   │   │   ├── PriceFields.tsx
│   │   │   │   └── VariationBadge.tsx
│   │   │   ├── pages/
│   │   │   │   ├── AdjustPricePage.tsx
│   │   │   │   ├── EditIngredientPage.tsx
│   │   │   │   ├── IngredientForms.test.tsx
│   │   │   │   ├── IngredientsPage.test.tsx
│   │   │   │   ├── IngredientsPage.tsx
│   │   │   │   └── NewIngredientPage.tsx
│   │   │   ├── catalog.test.ts
│   │   │   ├── catalog.ts
│   │   │   ├── payloads.ts
│   │   │   ├── queries.ts
│   │   │   ├── schemas.test.ts
│   │   │   ├── schemas.ts
│   │   │   └── units.ts
│   │   └── recipes/
│   │       ├── components/
│   │       │   ├── ArchiveRecipeDialog.tsx
│   │       │   ├── CostSummary.tsx
│   │       │   ├── IngredientPicker.tsx
│   │       │   ├── RecipeActions.tsx
│   │       │   ├── RecipeForm.tsx
│   │       │   ├── RecipeGate.tsx
│   │       │   ├── RecipeItemRow.tsx
│   │       │   ├── RecipeList.tsx
│   │       │   ├── RecipeSheetItems.tsx
│   │       │   └── StatusSwitch.tsx
│   │       ├── pages/
│   │       │   ├── EditRecipePage.tsx
│   │       │   ├── NewRecipePage.tsx
│   │       │   ├── RecipeDetailPage.test.tsx
│   │       │   ├── RecipeDetailPage.tsx
│   │       │   ├── RecipeFormPage.test.tsx
│   │       │   ├── RecipePage.test.tsx
│   │       │   └── RecipePage.tsx
│   │       ├── catalog.test.ts
│   │       ├── catalog.ts
│   │       ├── format.test.ts
│   │       ├── format.ts
│   │       ├── payload.test.ts
│   │       ├── payload.ts
│   │       ├── queries.ts
│   │       ├── schemas.test.ts
│   │       └── schemas.ts
│   ├── i18n/
│   │   ├── messages.test.ts
│   │   └── messages.ts
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── routeMeta.test.ts
│   │   └── routeMeta.ts
│   ├── lib/
│   │   ├── catalog.ts
│   │   ├── decimal-field.test.ts
│   │   ├── decimal-field.ts
│   │   ├── decimal.test.ts
│   │   ├── decimal.ts
│   │   ├── form-errors.test.ts
│   │   ├── form-errors.ts
│   │   ├── format.test.ts
│   │   ├── format.ts
│   │   ├── use-debounced-value.ts
│   │   ├── use-media-query.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── test/
│   │   ├── api.ts
│   │   ├── ingredients.ts
│   │   ├── recipe.ts
│   │   ├── render.tsx
│   │   ├── server.ts
│   │   ├── setup.ts
│   │   └── viewport.ts
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```
