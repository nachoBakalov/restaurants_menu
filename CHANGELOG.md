# Changelog

All notable changes to this repository are documented in this file.

## [2026-02-25]

### Added
- End-to-end optional `Category.imageUrl` support across Prisma schema, migration, backend DTO/service/mappers, and frontend admin menu types/dialog.
- Category image URL input + preview + edit prefill in Admin Menu Builder.
- Explicit nullable support for `CreateItemDto.imageUrl` and `CreateItemDto.allergens`.

### Changed
- Public menu category contracts now expose `imageUrl` in both DTO contract variants.
- Admin Orders now has F6 Kitchen UI in `/admin/orders`: tabs (`NEW/IN_PROGRESS/READY/COMPLETED`), order list, right-side drawer details, and status transition actions.
- Frontend billing features parser now supports backend envelope shape `{ items: [...] }`, fixing false `ORDERING` locked state in admin menu/orders.
- Frontend now supports SUPERADMIN restaurant impersonation with `/admin/restaurants`, persisted active restaurant scope, and automatic `restaurantId` query scoping for admin API calls (with exclusions for global restaurant/owner admin endpoints).
- SUPERADMIN restaurant management now supports branding fields (`logoUrl`, `coverImageUrl`) in create/list/update flows, including `PATCH /admin/restaurants/:id`.
- Public restaurant responses now consistently expose branding fields in both `/public/restaurants/:slug` and `/public/restaurants/:slug/menu` restaurant block.
- Frontend `/admin/restaurants` now supports branding UX for SUPERADMIN: logo thumbnail in list, edit dialog (`name/slug/logoUrl/coverImageUrl`) with live previews, and create flow with optional branding fields.
- Public restaurant contract now includes `features.ORDERING` resolved via existing feature-flag service with safe fallback to `false` on resolver errors.
- Added public customer-facing route `/:slug` with a luxe menu UI, category navigation, item detail dialog, and localized empty/error/loading states.
- Added frontend public ordering flow gated by `restaurant.features.ORDERING`: cart, checkout dialog (TABLE/DELIVERY), and success state after order submission.
- Added frontend public module scaffolding (`public/api`, `public/cart`, `public/theme`) to keep customer menu, API contracts, and theming isolated from admin flows.
- Public menu item cards now show optional allergens with subtle truncated text (`Алергени: ...`) when present.
- Public cart UX now supports item removal controls on both desktop and mobile; mobile remove now decrements quantity by 1 and auto-removes at zero.
- Public menu UX polish: search input with cross-category results, smooth category scroll tabs, skeleton loading state, and safe image fallbacks for cover/item images.
- Public checkout now supports `TAKEAWAY` type with conditional field validation (no `tableCode`/`deliveryAddress` required) and updated frontend/backend order contracts.
- Backend now supports per-restaurant ordering visibility and schedule (`orderingVisible`, `orderingTimezone`, `orderingSchedule`) with timezone-aware availability computation.
- Added admin restaurant settings endpoints (`GET/PATCH /admin/restaurant/settings`) for managing ordering visibility/timezone/schedule with OWNER/STAFF and SUPERADMIN scoped access.
- Public restaurant responses now include computed ordering availability block (`visible`, `availableNow`, `timezone`, `schedule`, `nextOpenAt`).
- Public order creation now enforces ordering runtime rules and returns `ORDERING_HIDDEN` / `ORDERING_CLOSED` (with `nextOpenAt`) when ordering is not currently allowed.
- Frontend admin now includes `/admin/settings` page for ordering configuration: visibility toggle, timezone field, and weekly schedule editor with always-open mode (`orderingSchedule = null`).
- Public menu ordering UI is now gated by runtime policy (`features.ORDERING && ordering.visible && ordering.availableNow`), with hidden add/cart/checkout controls when ordering is not currently allowed and informational next-open message support.
- Public menu item details button is now hidden together with add-to-cart when ordering is not currently allowed, keeping action visibility consistent with ordering policy.
- Admin Dashboard (`/admin`) now includes a QR card with live menu QR preview and direct SVG/PNG download actions, including SUPERADMIN scoped restaurant support via existing impersonation query injection.
- Restaurant contact profile now supports optional `phoneNumber`, `address`, and `socialLinks` (`facebook`/`instagram`/`googleBusiness`) across SUPERADMIN restaurant management, OWNER/STAFF restaurant settings, and public restaurant responses.
- Frontend admin UI now supports editing restaurant contact/social fields in SUPERADMIN `/admin/restaurants` edit dialog and OWNER/STAFF `/admin/settings` contacts section with trim-to-null save semantics.
- Public menu hero now shows restaurant contact/social info (`phone`, `address`, `facebook`, `instagram`, `googleBusiness`) with accessible links and improved cover readability.
- Public menu conversion polish (F7.6): single card CTA (`Добави`) with inline quantity controls, allergen chips, upgraded mobile sticky cart/desktop cart styling, and active category tracking with IntersectionObserver.
- Fixed public category tab click behavior to always smooth-scroll to the correct section via stable refs + click-scroll observer lock, including sticky-header-safe section offsets.

### Validation
- `backend`: `npm run build` ✅
- `frontend`: `pnpm build` ✅
- `backend`: `npm run test:e2e` (11/11 passing) ✅

## [2026-02-24]

### Fixed
- `DELETE /admin/categories/:id` no longer returns 400 when category has items; deletion runs in transaction (`deleteMany(items)` -> `delete(category)`).
- Admin menu item edit dialog now pre-fills price fields correctly via API normalization (flat backend payload -> frontend nested shape).

### Added
- Admin Menu Builder page (`/admin/menu`) with categories/items CRUD, availability toggle, create/edit dialogs, and delete confirmations.

### Validation
- `backend`: `npm run build` ✅
- `frontend`: `pnpm build` ✅
- `backend`: `npm run test:e2e` ✅

## [2026-02-23]

### Added
- Backend foundation for auth, RBAC, public menu/orders contracts, billing feature resolution, and admin menu/orders operations.
- Frontend foundation with auth integration, i18n, admin shell, and protected routing.

### Validation
- Build/test checks executed per module during implementation.
