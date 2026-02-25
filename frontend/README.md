# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Release notes

### 2026-02-25

- Added category image support in Admin Menu Builder (create/edit input, preview, and edit prefill).
- Updated category DTO/types in frontend menu layer to support optional nullable `imageUrl`.
- Synced admin menu contract handling with backend optional fields used by latest menu updates.
- Added item `allergens` optional field in create/edit dialog and request payload.
- Added item promo end date field (`promoEndsAt`) in create/edit dialog and request payload.
- Added FX helper text in item pricing section: `1 EUR = 1.95583 BGN`.
- Extended item API normalization to preserve promo date fields (`promoStartsAt`, `promoEndsAt`).
- Implemented Admin Kitchen Orders UI in `/admin/orders`: status tabs, list, details drawer, and status actions (`NEW -> IN_PROGRESS -> READY -> COMPLETED`).
- Added orders data layer (`orders.api`, query hooks, strict types) with `NEW` tab polling every 5s and optional `restaurantId` support in API params.
- Fixed billing features parser to accept backend payload shape `{ items: [...] }` so ORDERING gate reflects active plan correctly.
- Added SUPERADMIN impersonation flow with `/admin/restaurants` page for list/create/select/clear active restaurant scope.
- Added persisted `activeRestaurantId` in auth context and automatic `restaurantId` query scoping for `/admin/*` frontend requests (excluding `/admin/restaurants*` and `/admin/owners*`).
- Added SUPERADMIN scope UX in admin layout (restaurants nav item, scope badge, quick switch, clear scope action).
- Added restaurants API wrapper (`restaurants.api.ts`) with `fetchRestaurants`, `createWithOwner`, and `updateRestaurant` for branding-aware CRUD flows.
- Extended `/admin/restaurants` table with logo thumbnail preview and per-row `Edit` action.
- Added edit dialog with `react-hook-form + zod` for `name`, `slug`, `logoUrl`, `coverImageUrl` and inline logo/cover previews.
- Extended create-with-owner dialog with optional `logoUrl` and `coverImageUrl`; includes fallback PATCH branding after create to support backend variants.
- Added public customer-facing route `/:slug` with restaurant hero, category tabs, item cards, and item details dialog.
- Added public API layer (`public.api.ts`, `public.types.ts`) for restaurant/menu/order contract handling in the customer flow.
- Added ORDERING-gated customer cart + checkout flow (TABLE/DELIVERY) with localized submit/success/error states.
- Added public module scaffolding for theme and cart state (`public/theme`, `public/cart`) to keep customer experience isolated from admin code.

### 2026-02-24

- Implemented Admin Menu Builder page (`/admin/menu`) with categories/items CRUD, availability toggle, and create/edit/delete dialogs.
- Added TanStack Query data layer for menu management (`['categories']`, `['items', categoryId]`) with automatic invalidation after mutations.
- Added form validation (`react-hook-form + zod`) for category/item dialogs, including EUR/BGN prices and optional promo fields.

- Updated wildcard routing: `*` now renders a dedicated `NotFoundPage` (404) instead of redirecting to login.
- Hardened `RequireAuth` edge-case handling: when a token exists but `user` is `null` and `loading` is `false`, session is treated as invalid and user is redirected to `/admin/login?next=...`.

### 2026-02-23

- Added lightweight i18n layer without external libraries.
- Added BG/EN language switcher with persisted selection in `localStorage` (default `BG`).
- Localized admin auth and admin layout placeholders through translation keys.
- Implemented translation fallback order: selected language -> `bg` -> key name.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
