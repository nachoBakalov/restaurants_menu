# AI Agent Instruction

Този файл е постоянна референция за начина, по който работя като coding agent в този проект.
Целта е:
- да следвам стабилна логика на изпълнение;
- да реферирам към едни и същи правила;
- да не губя контекст между стъпките.

## 1) Основна логика на работа

1. Разчитам заявката докрай и извличам точните изисквания.
2. Проверявам текущото състояние на проекта (структура, файлове, зависимости).
3. Правя минимални и целенасочени промени (без overengineering).
4. Валидирам резултата (build/test, когато е приложимо).
5. Отчитам какво е променено и какво следва.

## 2) Правила за изпълнение

- Работя стъпка по стъпка, с ясна цел за всяка стъпка.
- Променям само файловете, нужни за текущата задача.
- Не добавям бизнес логика, ако не е изрично поискана.
- Пазя структурата чиста и съобразена с текущия stack.
- Ако има избор на инструмент, предпочитам по-простото и стабилно решение.

## 3) Рефериране към този файл

Когато започва нова задача, третирам този документ като „working agreement“.
Реферирам към него при:
- планиране на стъпките;
- взимане на решения за обхват;
- проверка дали не излизам извън заявката;
- финална self-check в края.

Примерна кратка референция в отговор:
- „Следвам логиката от AI_Agentinstruction.md: минимални промени, валидация и отчет на резултата.“

## 4) Как НЕ губя контекст

- Поддържам кратък план (какво е готово / какво предстои).
- След всяка съществена промяна правя междинна проверка.
- Сверявам резултата с оригиналните изисквания преди финален отговор.
- Ако възникне неяснота, уточнявам само критичните детайли.

## 5) Definition of Done (DoD)

Една задача се счита за завършена, когато:
- всички изисквания от заявката са покрити;
- промените са приложени и валидирани;
- няма ненужни странични промени;
- има ясен отчет: команди, файлове, резултат.

## 6) Формат за отчитане

При завършване давам кратък и сканиращ се отчет:
- Какво е направено
- Къде е направено (файлове)
- Как е валидирано
- Следваща логична стъпка

## 7) Project-specific (NestJS + Prisma + Multi-tenant)

### 7.1 Архитектурни конвенции

- Backend е NestJS REST API с TypeScript.
- Структурата е модулна: всеки домейн е отделен module/controller/service.
- DTO валидирането е с class-validator, през глобален ValidationPipe.
- Конфигурацията минава през @nestjs/config и env променливи.

### 7.2 Prisma конвенции

- Prisma schema е един източник на истина за моделите и релациите.
- Промяна по schema следва workflow: format -> generate -> migrate (когато стигнем до бизнес етапа).
- Не се пише ad-hoc SQL, освен ако няма ясна причина.
- Имената на модели/полета са последователни и ясни (без съкращения без контекст).

### 7.3 Multi-tenant конвенции

- Tenant контекстът идва от path slug на ресторант.
- Slug се резолвва до restaurantId рано в request lifecycle-а.
- Всички tenant-зависими заявки филтрират по restaurantId.
- Не се допуска cross-tenant достъп.

### 7.4 Auth и сигурност (базови правила)

- Auth е JWT с access + refresh токени.
- RBAC се прилага на ниво endpoint/service според ролите.
- Secrets и connection strings не се хардкодират.
- Error съобщенията не трябва да издават чувствителни данни.

### 7.5 Scope guard за ранни етапи

- Ако задачата е инфраструктурна (setup/scaffold), не добавям бизнес логика.
- Всяка нова стъпка трябва да е минимална, работеща и валидируема.
- При неяснота при multi-tenant поведение предпочитам най-строгата безопасна интерпретация.

## 8) Checklist шаблон за нова задача (self-check)

Използвам този шаблон преди финален отговор:

- [ ] Изискванията са прочетени докрай и обхватът е ясен.
- [ ] Промените са минимални и само по нужните файлове.
- [ ] Няма добавена бизнес логика извън заявката.
- [ ] Multi-tenant и security конвенциите са спазени.
- [ ] Има валидация (build/test/check), когато е приложимо.
- [ ] Финалният отчет е ясен: какво, къде, как е проверено, какво следва.

## 9) Какво вече е направено (project memory)

### 9.1 Базов backend setup

- Инициализиран е backend проект с NestJS (TypeScript) в папка backend.
- Добавени са основни зависимости: Nest core, @nestjs/config, class-validator, Prisma.
- Настроени са tsconfig файлове и npm scripts за build/start/prisma.
- Добавен е базов env шаблон (.env.example).

### 9.2 API bootstrap

- Добавен е глобален ValidationPipe в main.ts.
- Създаден е базов Health endpoint: GET /health -> { status: "ok" }.

### 9.3 Prisma foundation

- Създадена е пълна schema за multi-tenant QR menu + orders домейн.
- Добавени са enum-и: UserRole, OrderType, OrderStatus, SubscriptionStatus, Currency.
- Добавени са модели и релации: User, Restaurant, Category, Item, Table, Order, OrderItem, Plan, Feature, PlanFeature, Subscription, RestaurantFeatureOverride.
- Добавени са нужните индекси, включително за tenant/ordering сценарии.

### 9.4 Seed scaffold

- Добавен е prisma/seed.ts.
- Seed-ват се Feature ключове: THEMES, MULTI_LANGUAGE, PROMOS, ORDERING, ANALYTICS.
- Seed-ват се планове BASIC и PRO + връзките PlanFeature.
- Създава се SUPERADMIN потребител admin@local.test с bcrypt hash за парола admin123.

### 9.5 Практика за продължаване

- При следващи стъпки този раздел се дописва (а не пренаписва), за да се пази история.
- Всяка нова задача добавя кратък запис: какво е добавено, кои файлове са пипани, как е валидирано.

### 9.6 NestJS инфраструктура (Prisma + Config validation)

- Добавен е Prisma singleton слой: PrismaService + PrismaModule.
- PrismaService има lifecycle hooks за connect/disconnect и shutdown hook към приложението.
- ConfigModule е с env validation schema (Joi) за: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET и PORT (default 3000).
- main.ts е обновен с: enableCors(), глобален ValidationPipe (whitelist + transform), Prisma shutdown hooks.
- /health endpoint е запазен без промяна.

### 9.7 Оперативна проверка (runtime)

- Потвърдено е, че app стартира успешно и отговаря на GET /health с 200 и {"status":"ok"}.
- Потвърдено е, че prisma migrate работи (db in sync) и prisma seed се изпълнява без runtime грешки.
- Потвърдено е, че няма runtime warnings при старт (само стандартни Nest LOG съобщения).

### 9.8 Auth + RBAC слой

- Имплементиран е Auth module с endpoint-и: register-owner, login, refresh и защитен me endpoint.
- Добавени са JWT access/refresh токени, bcrypt hash за пароли и hash-нати refresh токени в БД.
- Добавени са JwtAuthGuard, RolesGuard и @Roles decorator.
- Добавен е Prisma модел RefreshToken + миграция.

### 9.9 Public + Orders contract слой

- Добавен е RestaurantResolverService за slug -> restaurant resolve с стандартизиран not-found код.
- Добавени са public endpoint-и за restaurant info, menu и create order.
- Добавени са admin endpoint-и за list/details/update status на orders (OWNER/STAFF, restaurant-scoped).
- Добавени са DTO-та за request/response контракти и mapper helper-и за contract shape.
- Добавен е глобален exception filter със стандартизиран error формат.
- Добавен е README snippet с curl примери за contract endpoint-и.

### 9.10 Contract e2e покритие (happy + negative)

- Добавен е минимален e2e тестов setup (Jest + ts-jest + supertest).
- Добавен е happy-path e2e сценарий за register/login/public/admin order flow.
- Добавени са negative-path e2e сценарии за error contract:
	- RESTAURANT_NOT_FOUND
	- VALIDATION_ERROR
	- FEATURE_DISABLED
- Потвърден е стандартизираният error envelope: { error: { code, message, details? } }.

### 9.11 Admin menu CRUD слой

- Добавен е AdminMenuModule за OWNER/STAFF CRUD на categories/items.
- Добавен е reusable helper assertOwnership(entity.restaurantId, user).
- Добавени са route-и: /admin/categories и /admin/items (GET/POST/PATCH/DELETE).
- Добавени са DTO-та за create/update payload-и за categories/items.
- Добавени са curl примери в README за admin menu endpoint-ите.

### 9.12 Orders module (public + admin manage)

- Имплементиран е OrdersModule с public create order и admin manage endpoint-и.
- Public create order поддържа TABLE/DELIVERY заявки с валидирани полета и items.
- Добавен е FeatureFlagService check за ORDERING (stub = enabled за момента).
- Добавени са проверки items да са от ресторанта и да са available.
- Добавено е snapshot-ване на цени/имена в OrderItem и изчисляване на totals в Order.
- Admin endpoint-и: list by status, details by id, update status (OWNER/STAFF, scoped по restaurantId).

### 9.13 Billing + feature-flag реална логика

- Добавен е BillingModule с SUPERADMIN endpoint-и за subscription create и feature override.
- Добавен е OWNER endpoint за resolved billing features на текущия restaurant.
- FeatureFlagService е имплементиран с реална резолюция: override -> активен subscription window/status -> plan feature mapping.
- Orders create flow използва реалната feature резолюция за ORDERING (вместо временен stub).
- Обновени са seed и register-owner flow, така че BASIC да има ORDERING за коректен default onboarding.

### 9.14 SUPERADMIN operational scope (cross-tenant)

- SUPERADMIN е разширен с operational достъп за admin menu/orders, без ограничение до собствен restaurantId.
- За list/create endpoint-и SUPERADMIN подава `restaurantId` като query scope (`/admin/categories`, `/admin/items`, `/admin/orders`, `/admin/qr/menu`).
- За id-based update/delete операции ownership helper-ът допуска SUPERADMIN bypass (cross-tenant support).
- Добавени са onboarding/support endpoint-и за SUPERADMIN:
	- `POST /admin/restaurants/create-with-owner`
	- `GET /admin/restaurants/:id/owners`
	- `POST /admin/owners/:id/reset-password`
- Reset owner password ревокира всички refresh токени на owner-а (forced re-login).

### 9.15 Frontend foundation (Vite + React + TS)

- Създадена е нова frontend част в `frontend/` с Vite + React + TypeScript.
- Добавени са ключовите библиотеки: React Router, TanStack Query, axios, TailwindCSS и shadcn-style UI primitives.
- Спазена е заявената структура на `frontend/src/`:
	- `app/` (App, router, providers)
	- `api/` (apiClient, types)
	- `auth/` (api/context/tokenStore/login/register)
	- `admin/layout` + `admin/dashboard`
	- `i18n/` (bg/en + helper)
	- `shared/components` + `shared/ui`
- Router routes:
	- `/admin/login`
	- `/admin/register`
	- `/admin` (protected чрез `RequireAuth` + placeholder dashboard)
- `providers.tsx` е конфигуриран с TanStack Query `QueryClientProvider`.
- `apiClient.ts` използва `VITE_API_BASE_URL` (fallback `http://localhost:3000`).
- Добавен е `frontend/.env.example` с `VITE_API_BASE_URL=http://localhost:3000`.
- UI е минимален и clean, с български текст по подразбиране, използвайки Card + Button компоненти.

### 9.16 Frontend lightweight i18n layer (без външни библиотеки)

- Добавен е лек i18n core в `frontend/src/i18n/i18n.ts` с API:
	- `getLang(): "bg" | "en"` (localStorage + default `bg`)
	- `setLang(lang)` (persist + event за re-render)
	- `t(key)` с fallback: избран език -> `bg` -> самия `key`
- Добавен е `useT()` hook (`frontend/src/i18n/useT.ts`) с реактивен lang state и слушатели за language change.
- Добавен е `LanguageSwitcher` компонент (`frontend/src/shared/components/LanguageSwitcher.tsx`) с `BG/EN` select.
- `LanguageSwitcher` е вграден top-right в auth страниците (`/admin/login`, `/admin/register`) и в admin layout header.
- Хардкоднати UI текстове са заменени с `t("...")` в:
	- `frontend/src/auth/LoginPage.tsx`
	- `frontend/src/auth/RegisterPage.tsx`
	- `frontend/src/admin/layout/AdminLayout.tsx`
	- `frontend/src/admin/dashboard/DashboardPage.tsx`
- Речниците са разширени с нужните flat ключове и placeholder-и в `bg.ts` и `en.ts`.

### 9.17 Frontend auth integration (NestJS backend)

- Имплементирана е реална frontend auth интеграция към backend endpoint-ите:
	- `POST /auth/login`
	- `POST /auth/register-owner`
	- `POST /auth/refresh`
	- `GET /auth/me` (опционално, fail-safe при липса)
- Обновен е token store с ключове:
	- `fy_access_token`
	- `fy_refresh_token`
- Axios client има:
	- автоматично `Authorization: Bearer <accessToken>`
	- 401 refresh flow с anti-loop `_retry` флаг
	- concurrency-safe refresh lock (`refreshPromise`), за да няма паралелни refresh заявки
	- logout event (`auth:logout`) при refresh failure
- Добавени са auth API wrapper и типове:
	- `frontend/src/auth/auth.api.ts`
	- `frontend/src/auth/auth.types.ts`
- Auth context е заменен с реална логика (`login`, `registerOwner`, `logout`, bootstrap с `me`).
- `register-owner` обработва robust двата backend сценария:
	- tokens + user директно
	- `{ ok: true }` -> auto-login със същите credentials
- Login/Register UI е мигриран към `react-hook-form + zod` с валидации и BG error съобщения.
- Добавени са shadcn-style `Input` и `Label` компоненти + `ApiErrorAlert` за backend error envelope.

### 9.18 Frontend SaaS admin shell (layout + navigation)

- Имплементиран е професионален admin shell за `/admin/*`:
	- desktop left sidebar navigation
	- sticky top header
	- центриран content container (`max-w-6xl`)
	- soft neutral background
- Добавени са admin placeholder маршрути:
	- `/admin` (Dashboard)
	- `/admin/menu`
	- `/admin/orders`
	- `/admin/billing`
- `RequireAuth` е разширен с `?next=` redirect support:
	- неаутентикиран потребител -> `/admin/login?next=<path>`
	- след login/register -> връщане към `next` (ако е валиден `/admin` path)
- При token + loading user bootstrap guard-ът показва localized loading state (`admin.common.loading`).
- В header има user dropdown menu с:
	- email
	- роля (`superadmin/owner/staff`)
	- logout action
- Навигацията има active link styling и mobile UX:
	- burger бутон
	- `Sheet` sidebar за mobile
	- `DropdownMenu` за user menu
	- `Separator` за layout разделители
- Dashboard placeholder е обновен с SaaS-style card секции и quick action бутони.

## 10) Changelog template

Използвам този шаблон за всяка завършена задача:

```md
### [YYYY-MM-DD] Кратко име на задачата
- Задача: (1-2 изречения)
- Файлове: path/file1, path/file2
- Промени: (кратко какво е добавено/променено)
- Validation: (build/test/command + резултат)
- Next: (следваща логична стъпка)
```

Пример:

```md
### [2026-02-19] Prisma schema + seed scaffold
- Задача: Добавена домейн схема и начален seed за планове/фийчъри и superadmin.
- Файлове: backend/prisma/schema.prisma, backend/prisma/seed.ts, backend/package.json
- Промени: Enum-и, модели, релации, индекси, seed логика с bcrypt hash.
- Validation: npm run prisma:generate (OK), npm run build (OK)
- Next: Добавяне на PrismaService + PrismaModule в NestJS.
```

Актуални записи:

```md
### [2026-02-23] NestJS infrastructure hardening
- Задача: Добавяне на PrismaModule singleton, env validation и bootstrap настройки за стабилен runtime.
- Файлове: backend/src/prisma/prisma.service.ts, backend/src/prisma/prisma.module.ts, backend/src/config/env.validation.ts, backend/src/app.module.ts, backend/src/main.ts, backend/.env.example, backend/package.json
- Промени: Prisma lifecycle + shutdown hooks, Joi validation schema, CORS + global ValidationPipe, PORT в .env.example, joi dependency.
- Validation: npm run build (OK)
- Next: Добавяне на Auth module (JWT access/refresh) без бизнес логика.

### [2026-02-23] Runtime smoke checks
- Задача: Проверка на старт на app, миграция/seed и липса на runtime warnings.
- Файлове: без постоянни код промени (оперативна проверка)
- Промени: Пуснати проверки за migrate, seed, startup и /health endpoint.
- Validation: npm run prisma:migrate (OK / in sync), npm run prisma:seed (OK), GET /health -> 200 (OK), startup logs без warning/error (OK)
- Next: Започване на Auth + RBAC инфраструктура.

### [2026-02-23] Auth + RBAC implementation
- Задача: Добавяне на auth endpoint-и и role-based защита за backend API.
- Файлове: backend/src/auth/**, backend/src/app.module.ts, backend/prisma/schema.prisma, backend/prisma/migrations/**
- Промени: Register-owner/login/refresh/me, JwtAuthGuard, RolesGuard, @Roles, RefreshToken persistence.
- Validation: npm run prisma:generate (OK), npm run build (OK), runtime login/refresh/me smoke (OK)
- Next: Public menu/order contract слой + стандартизиран error format.

### [2026-02-23] Public + Orders contract layer
- Задача: Имплементация на public/admin order contract endpoint-и с DTO/mappers и global error format.
- Файлове: backend/src/public/**, backend/src/orders/**, backend/src/common/mappers/**, backend/src/common/filters/**, backend/src/main.ts, backend/src/app.module.ts, backend/README.md
- Промени: Contract DTO-та, мапъри, create/list/detail/status order endpoint-и, cache headers за public endpoint-и, standardized error envelope.
- Validation: npm run build (OK)
- Next: Минимални e2e happy-path тестове за contract endpoint-и.

### [2026-02-23] Contract e2e negative-path coverage
- Задача: Добавяне на минимални negative e2e тестове за error contract, без overengineering.
- Файлове: backend/test/contract.e2e-spec.ts, backend/jest.e2e.config.js, backend/tsconfig.spec.json, backend/package.json
- Промени: E2E setup + тестове за RESTAURANT_NOT_FOUND, VALIDATION_ERROR, FEATURE_DISABLED.
- Validation: npm run test:e2e (4/4 passing)
- Next: Добавяне на още 1-2 security-oriented e2e сценария (UNAUTHORIZED/FORBIDDEN) при нужда.

### [2026-02-23] Contract e2e security negatives
- Задача: Добавяне на security negative-path e2e за auth/authorization contract.
- Файлове: backend/test/contract.e2e-spec.ts
- Промени: Добавени тестове за UNAUTHORIZED (без token) и FORBIDDEN (валиден token с неподходяща роля SUPERADMIN за OWNER/STAFF route).
- Validation: npm run test:e2e (6/6 passing)
- Next: Поддържане на бърз contract regression suite при всяка промяна по guards/roles.

### [2026-02-23] Admin menu CRUD + e2e coverage
- Задача: Добавяне на owner/staff CRUD за menu management и базово e2e покритие.
- Файлове: backend/src/admin-menu/**, backend/src/common/helpers/assert-ownership.ts, backend/src/common/auth/auth-user.type.ts, backend/src/app.module.ts, backend/README.md, backend/test/contract.e2e-spec.ts
- Промени: CRUD endpoint-и за categories/items, ownership enforcement, и e2e тестове за admin menu happy-path + ownership negative.
- Validation: npm run build (OK), npm run test:e2e (8/8 passing)
- Next: Добавяне на пагинация/търсене за admin items list при нужда.

### [2026-02-23] Orders module public/admin confirmation
- Задача: Потвърждение и фиксиране на референция за OrdersModule (public create + admin manage).
- Файлове: backend/src/orders/**, backend/src/public/public.controller.ts, backend/src/public/public.service.ts, backend/src/features/feature-flag.service.ts, backend/README.md
- Промени: Public create order flow (slug resolve, feature flag check, availability validation, totals snapshot), admin list/details/status manage routes.
- Validation: npm run build (OK), npm run test:e2e (OK)
- Next: Добавяне на payments/session tracking в отделна стъпка (out of scope в момента).

### [2026-02-23] Billing + feature flags integration
- Задача: Имплементация на billing слой и реална feature-flag резолюция, интегрирана в order create.
- Файлове: backend/src/billing/**, backend/src/orders/orders.service.ts, backend/src/orders/orders.module.ts, backend/src/app.module.ts, backend/src/features/feature-flag.service.ts, backend/src/auth/auth.service.ts, backend/prisma/seed.ts, backend/README.md
- Промени: SUPERADMIN endpoint-и за subscriptions/overrides, OWNER endpoint за resolved features, реална ORDERING резолюция в Orders, compatibility re-export на стария feature service path, BASIC+ORDERING default в seed/register-owner.
- Validation: npm run build (OK), npm run test:e2e (8/8 passing)
- Next: Добавяне на billing-focused e2e сценарии (subscription expiry + override precedence) при нужда.

### [2026-02-23] QR menu endpoint security e2e
- Задача: Добавяне на e2e покритие за QR menu endpoint-а, включително auth/authorization negative сценарии.
- Файлове: backend/test/contract.e2e-spec.ts
- Промени: Добавен happy-path тест за `GET /admin/qr/menu` (SVG payload), `401` (без token), и SUPERADMIN happy-path с `restaurantId` query.
- Validation: npm run test:e2e (11/11 passing)
- Next: По избор — добавяне на contract assert за QR payload URL съдържание при стабилен decode helper.

### [2026-02-23] SUPERADMIN cross-tenant RBAC expansion
- Задача: Разширяване на SUPERADMIN правата за operational работа по ресторанти без ръчен owner login.
- Файлове: backend/src/admin-menu/admin-menu.controller.ts, backend/src/admin-menu/admin-menu.service.ts, backend/src/common/helpers/assert-ownership.ts, backend/src/orders/admin-orders.controller.ts, backend/src/orders/orders.service.ts, backend/src/orders/dto/admin-orders.dto.ts, backend/test/contract.e2e-spec.ts
- Промени: SUPERADMIN достъп до admin menu/orders endpoint-и, query scope с `restaurantId` за list/create, ownership bypass за id-based операции, e2e очаквания обновени спрямо новия RBAC.
- Validation: npm run build (OK), npm run test:e2e (11/11 passing)
- Next: По избор — добавяне на pagination/cursor за SUPERADMIN list endpoint-и при големи tenant обеми.

### [2026-02-23] SUPERADMIN onboarding/support endpoints
- Задача: Добавяне на endpoint-и за bootstrap и support операции от SUPERADMIN.
- Файлове: backend/src/billing/billing.controller.ts, backend/src/billing/billing.service.ts, backend/src/billing/dto/create-restaurant-with-owner.dto.ts, backend/src/billing/dto/reset-owner-password.dto.ts, backend/README.md, backend/postman/restaurant-menu.postman_collection.json
- Промени: Добавени `create-with-owner`, `list owners by restaurantId`, `reset owner password`; reset-ът ревокира refresh токени; README/Postman обновени с примери.
- Validation: npm run build (OK), npm run test:e2e (11/11 passing), Postman collection JSON parse (OK)
- Next: По избор — добавяне на audit log (кой SUPERADMIN е reset-нал парола и кога).

### [2026-02-23] Frontend scaffold + architecture baseline
- Задача: Инициализация на frontend проект с точната структура и базови placeholder-и без API бизнес логика.
- Файлове: frontend/src/**, frontend/.env.example, frontend/tailwind.config.js, frontend/postcss.config.js, frontend/package.json
- Промени: Vite React TS setup, React Router routes (`/admin/login`, `/admin/register`, `/admin` protected), TanStack Query provider, axios client с `VITE_API_BASE_URL`, i18n (bg default), shadcn-style Card/Button, Tailwind wiring.
- Validation: pnpm build (OK), pnpm dev (OK в `frontend/`)
- Next: Имплементация на реален auth flow (login/register-owner) с axios + query mutations.

### [2026-02-23] Frontend i18n hardening + language switcher
- Задача: Добавяне на lightweight i18n слой без външни библиотеки, с localStorage persist и runtime смяна на език.
- Файлове: frontend/src/i18n/i18n.ts, frontend/src/i18n/useT.ts, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/src/shared/components/LanguageSwitcher.tsx, frontend/src/auth/LoginPage.tsx, frontend/src/auth/RegisterPage.tsx, frontend/src/admin/layout/AdminLayout.tsx, frontend/src/admin/dashboard/DashboardPage.tsx
- Промени: `getLang/setLang/t` API, fallback логика (`selected -> bg -> key`), `useT()` re-render механизъм, BG/EN switcher, подмяна на hardcoded UI низове с `t("...")`.
- Validation: pnpm build (OK)
- Next: Свързване на real backend auth responses с i18n-ready error messages.

### [2026-02-23] Frontend auth integration + refresh flow
- Задача: Свързване на frontend auth към реалните NestJS endpoint-и с token persistence, refresh retry и form validation.
- Файлове: frontend/src/api/apiClient.ts, frontend/src/auth/tokenStore.ts, frontend/src/auth/auth.api.ts, frontend/src/auth/auth.types.ts, frontend/src/auth/auth.context.tsx, frontend/src/admin/layout/RequireAuth.tsx, frontend/src/auth/LoginPage.tsx, frontend/src/auth/RegisterPage.tsx, frontend/src/shared/components/ApiErrorAlert.tsx, frontend/src/shared/ui/input.tsx, frontend/src/shared/ui/label.tsx, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/package.json
- Промени: request/response interceptors с concurrency-safe refresh lock, robust register-owner handling (auto-login fallback), RHF+zod форми, BG error UX, и auth logout event за safe redirect.
- Validation: pnpm build (OK)
- Next: Добавяне на guard за role-based frontend маршрути (например SUPERADMIN-only views) при следващ scope.

### [2026-02-23] Frontend SaaS AdminLayout + protected admin shell
- Задача: Изграждане на професионален SaaS admin shell с sidebar/header/mobile navigation и protected `/admin/*` маршрути.
- Файлове: frontend/src/admin/layout/AdminLayout.tsx, frontend/src/admin/layout/RequireAuth.tsx, frontend/src/app/router.tsx, frontend/src/admin/dashboard/DashboardPage.tsx, frontend/src/admin/menu/MenuPage.tsx, frontend/src/admin/orders/OrdersPage.tsx, frontend/src/admin/billing/BillingPage.tsx, frontend/src/shared/ui/dropdown-menu.tsx, frontend/src/shared/ui/sheet.tsx, frontend/src/shared/ui/separator.tsx, frontend/src/auth/LoginPage.tsx, frontend/src/auth/RegisterPage.tsx, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/package.json
- Промени: desktop/mobile shell, active nav styling, user dropdown (email/role/logout), `?next=` redirect flow, нови admin placeholder pages/routes, и i18n ключове за всички видими label-и.
- Validation: pnpm build (OK)
- Next: По избор — role-based visibility на nav items (напр. Billing само за OWNER/SUPERADMIN).

### [2026-02-23] Frontend auth guard edge-case + NotFound wildcard
- Задача: Корекция на edge-case в `RequireAuth` и смяна на wildcard routing behavior към реална 404 страница.
- Файлове: frontend/src/admin/layout/RequireAuth.tsx, frontend/src/app/router.tsx, frontend/src/app/NotFoundPage.tsx
- Промени: При наличен token + `user === null` + `loading === false` guard-ът третира сесията като невалидна и пренасочва към login с `?next=`; wildcard route (`*`) вече рендерира `NotFoundPage`, вместо redirect към login.
- Validation: pnpm build (OK)
- Next: По избор — добавяне на user-facing CTA в `NotFoundPage` (напр. бутон към dashboard/login) според UX политика.

### [2026-02-24] Frontend ORDERING feature gating (Admin UI)
- Задача: Имплементация на feature gate за ORDERING в admin интерфейса, базирана на `GET /admin/billing/features`.
- Файлове: frontend/src/billing/billing.types.ts, frontend/src/billing/billing.api.ts, frontend/src/billing/useFeatures.ts, frontend/src/admin/layout/AdminLayout.tsx, frontend/src/admin/orders/OrdersPage.tsx, frontend/src/admin/billing/BillingPage.tsx, frontend/src/shared/ui/badge.tsx, frontend/src/shared/ui/skeleton.tsx, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/README.md
- Промени: Добавени са resilient parser-и за двата API response формата (`{ features: [...] }` и `[...]`), React Query hook за feature flags, disabled Orders nav + badge „Изисква план“, locked state в Orders page с CTA към Billing, и Billing placeholder с feature list + loading/error UX.
- Validation: pnpm build (OK)
- Next: По избор — централизиране на feature gating с route-level guard helper за бъдещи feature ключове.

### [2026-02-24] Frontend Admin Menu Builder (categories + items CRUD)
- Задача: Имплементация на реална SaaS-style страница `/admin/menu` за управление на категории и артикули с пълен CRUD flow.
- Файлове: frontend/src/admin/menu/MenuPage.tsx, frontend/src/admin/menu/menu.types.ts, frontend/src/admin/menu/menu.api.ts, frontend/src/admin/menu/components/CategoryList.tsx, frontend/src/admin/menu/components/ItemList.tsx, frontend/src/admin/menu/components/CategoryDialog.tsx, frontend/src/admin/menu/components/ItemDialog.tsx, frontend/src/admin/menu/components/ConfirmDialog.tsx, frontend/src/shared/ui/dialog.tsx, frontend/src/shared/ui/alert-dialog.tsx, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/README.md, frontend/package.json
- Промени: Добавени са wrappers за backend endpoint-ите (`/admin/categories`, `/admin/items`), query cache ключове `['categories']` и `['items', categoryId]`, auto-select на първа категория, dialogs за create/edit, confirm modal за delete, availability toggle чрез PATCH, и RHF+zod валидация с decimal->cents трансформация за EUR/BGN цени и promo полета.
- Validation: pnpm build (OK)
- Next: По избор — добавяне на drag-and-drop reordering UI (sortOrder) и debounced inline edit за по-бърза оперативна работа.

### [2026-02-24] Frontend item edit prefill fix (menu API normalization)
- Задача: Корекция на празните price полета в `ItemDialog` при edit, когато backend връща flat pricing полета.
- Файлове: frontend/src/admin/menu/menu.api.ts
- Промени: Добавен е `normalizeItem` mapper, който преобразува flat payload (`priceEurCents`, `priceBgnCents`, `promoPriceEurCents`, `promoPriceBgnCents`) към frontend nested shape (`prices`, `promo`), използван от `fetchItems/createItem/updateItem`.
- Validation: pnpm build (OK)
- Next: По избор — централизиране на DTO mappers в отделен `mappers/` слой за всички admin ресурси.

### [2026-02-24] Backend category delete fix (with existing items)
- Задача: Премахване на 400 грешката при `DELETE /admin/categories/:id`, когато категорията има свързани items.
- Файлове: backend/src/admin-menu/admin-menu.service.ts
- Промени: `deleteCategory` вече не връща validation error за non-empty category; вместо това изпълнява transaction: `deleteMany(items by categoryId)` -> `delete(category)`.
- Validation: npm run build (OK)
- Next: По избор — soft-delete стратегия за items/categories, ако е нужен audit/history вместо hard delete.

### [2026-02-25] Category image + optional menu contract alignment
- Задача: Добавяне на optional `Category.imageUrl` end-to-end и синхронизиране на optional nullable полета за item payload-и.
- Файлове: backend/prisma/schema.prisma, backend/prisma/migrations/20260224125130_v2/migration.sql, backend/src/admin-menu/dto/categories.dto.ts, backend/src/admin-menu/dto/items.dto.ts, backend/src/admin-menu/admin-menu.service.ts, backend/src/common/mappers/api-contract.mappers.ts, backend/src/public/dto/menu.response.dto.ts, backend/src/public/dto/public-menu.dto.ts, frontend/src/admin/menu/menu.types.ts, frontend/src/admin/menu/components/CategoryDialog.tsx, frontend/src/admin/menu/MenuPage.tsx
- Промени: Добавени category imageUrl поле/миграция/DTO mapping, UI input+preview за category image, и nullable съвместимост за `imageUrl`/`allergens` в create item DTO.
- Validation: npm run build (backend OK), pnpm build (frontend OK), npm run test:e2e (11/11 passing)
- Next: По избор — визуализация на category image в публичното меню UI (ако е в scope на frontend public page).

### [2026-02-25] Frontend menu dialog UX/data parity (allergens + promo end)
- Задача: Допълване на Admin Menu Builder item формата с optional allergens и promo end date, плюс FX helper UX без промяна на ценовата логика.
- Файлове: frontend/src/admin/menu/components/ItemDialog.tsx, frontend/src/admin/menu/menu.types.ts, frontend/src/admin/menu/menu.api.ts, frontend/src/i18n/translations/bg.ts, frontend/src/i18n/translations/en.ts, frontend/README.md
- Промени: Добавени са `allergens` и `promoEndsAt` в create/edit flow, запазено автоматично BGN preview от EUR чрез `watch`, добавен helper текст `1 EUR = 1.95583 BGN`, и разширен normalize mapper за `promoStartsAt/promoEndsAt`.
- Validation: pnpm build (frontend OK)
- Next: По избор — визуално показване на promo end date в item list cards за по-бърз admin преглед.
```

## 11) Known limitations (кратко)

- Subscription expiry boundary е чувствителен към timezone и точния момент на проверка (`startAt <= now <= endAt`); липсват edge-case e2e тестове за гранични секунди.
- Feature override логиката е global per restaurant+feature (без версия/история); няма audit trail кой/кога е променил override.
- Няма scheduled overrides/plan changes (всички промени са immediate).
- Няма billing proration/financial lifecycle (invoice/payment/refund) — текущият scope е само feature access control.
- Липсва dedicated regression suite за precedence матрицата (override vs subscription status vs plan mapping).
- QR e2e проверките валидират SVG формат, но не декодират/асъртват вътрешния URL payload (`BASE_URL/slug`) в самия QR код.
- За SUPERADMIN list/create admin endpoint-и е нужен `restaurantId` query scope; липсва централен auto-scope механизъм по slug/name.
- Липсват frontend e2e/integration тестове за auth refresh concurrency и logout event поведение (в момента е валидирано чрез build + manual flow).

## 12) Superadmin quick playbook (onboarding)

1) Login като SUPERADMIN и запази `accessToken`:

```bash
curl -X POST http://localhost:3000/auth/login \
	-H "Content-Type: application/json" \
	-d '{
		"email": "master@local.test",
		"password": "Master123!"
	}'
```

2) Създай ресторант + owner в една стъпка:

```bash
curl -X POST http://localhost:3000/admin/restaurants/create-with-owner \
	-H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{
		"email": "owner.new@local.test",
		"password": "Owner123!",
		"restaurantName": "New Restaurant",
		"slug": "new-restaurant"
	}'
```

3) Вземи owner-и за ресторанта (за `ownerId`):

```bash
curl -X GET http://localhost:3000/admin/restaurants/<RESTAURANT_ID>/owners \
	-H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

4) Reset owner password (support операция):

```bash
curl -X POST http://localhost:3000/admin/owners/<OWNER_ID>/reset-password \
	-H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{ "newPassword": "Owner1234!" }'
```

5) Добави/обнови subscription за ресторанта:

```bash
curl -X POST http://localhost:3000/admin/restaurants/<RESTAURANT_ID>/subscriptions \
	-H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{
		"planKey": "PRO",
		"status": "ACTIVE",
		"startsAt": "2026-02-23T00:00:00.000Z",
		"endsAt": "2026-03-23T00:00:00.000Z"
	}'
```

6) Override-ни feature за ресторанта (напр. ORDERING):

```bash
curl -X POST http://localhost:3000/admin/restaurants/<RESTAURANT_ID>/features/ORDERING/override \
	-H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{ "enabled": true }'
```


---

Този документ е жив и може да се актуализира при промяна на процеса или изискванията.
