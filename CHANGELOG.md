# Changelog

All notable changes to this repository are documented in this file.

## [2026-02-25]

### Added
- End-to-end optional `Category.imageUrl` support across Prisma schema, migration, backend DTO/service/mappers, and frontend admin menu types/dialog.
- Category image URL input + preview + edit prefill in Admin Menu Builder.
- Explicit nullable support for `CreateItemDto.imageUrl` and `CreateItemDto.allergens`.

### Changed
- Public menu category contracts now expose `imageUrl` in both DTO contract variants.

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
