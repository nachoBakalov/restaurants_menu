## API contract quick curl examples

### Public restaurant info

```bash
curl -X GET http://localhost:3000/public/restaurants/bellabonita
```

### Public menu

```bash
curl -X GET http://localhost:3000/public/restaurants/bellabonita/menu
```

### Public create order (TABLE)

```bash
curl -X POST http://localhost:3000/public/restaurants/bellabonita/orders \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TABLE",
    "tableCode": "T12",
    "phone": "+359888123456",
    "customerName": "Ivan",
    "note": "No onions",
    "items": [
      { "itemId": "cmxxxxitem1", "qty": 2 },
      { "itemId": "cmxxxxitem2", "qty": 1, "note": "Extra spicy" }
    ]
  }'
```

### Public create order (DELIVERY)

```bash
curl -X POST http://localhost:3000/public/restaurants/bellabonita/orders \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DELIVERY",
    "deliveryAddress": "Sofia, Vitosha 1",
    "phone": "+359888123456",
    "customerName": "Ivan",
    "items": [
      { "itemId": "cmxxxxitem1", "qty": 3 }
    ]
  }'
```

### Public create order (TAKEAWAY)

```bash
curl -X POST http://localhost:3000/public/restaurants/bellabonita/orders \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TAKEAWAY",
    "phone": "+359888123456",
    "customerName": "Ivan",
    "note": "Pickup in 20 minutes",
    "items": [
      { "itemId": "cmxxxxitem1", "qty": 1 }
    ]
  }'
```

### Admin list orders (OWNER/STAFF JWT)

```bash
curl -X GET "http://localhost:3000/admin/orders?status=NEW" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Admin order details

```bash
curl -X GET http://localhost:3000/admin/orders/<ORDER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Admin update status

```bash
curl -X PATCH http://localhost:3000/admin/orders/<ORDER_ID>/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "READY" }'
```

### Billing (SUPERADMIN)

```bash
curl -X GET http://localhost:3000/admin/restaurants \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

```bash
curl -X PATCH http://localhost:3000/admin/restaurants/<RESTAURANT_ID> \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bella Bonita",
    "slug": "bella-bonita",
    "logoUrl": "https://cdn.example.com/logo.png",
    "coverImageUrl": "https://cdn.example.com/cover.jpg"
  }'
```

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

```bash
curl -X GET http://localhost:3000/admin/restaurants/<RESTAURANT_ID>/owners \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

```bash
curl -X POST http://localhost:3000/admin/owners/<OWNER_ID>/reset-password \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "Owner1234!"
  }'
```

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

```bash
curl -X POST http://localhost:3000/admin/restaurants/<RESTAURANT_ID>/features/ORDERING/override \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "enabled": true }'
```

### Billing (OWNER)

```bash
curl -X GET http://localhost:3000/admin/billing/features \
  -H "Authorization: Bearer <OWNER_ACCESS_TOKEN>"
```

### Billing (SUPERADMIN impersonation)

```bash
curl -X GET "http://localhost:3000/admin/billing/features?restaurantId=<RESTAURANT_ID>" \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

```bash
curl -X GET "http://localhost:3000/admin/categories?restaurantId=<RESTAURANT_ID>" \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

```bash
curl -X GET "http://localhost:3000/admin/orders?status=NEW&restaurantId=<RESTAURANT_ID>" \
  -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>"
```

### Admin QR menu (OWNER, SVG)

```bash
curl -X GET http://localhost:3000/admin/qr/menu \
  -H "Authorization: Bearer <OWNER_ACCESS_TOKEN>" \
  -H "Accept: image/svg+xml"
```

### Admin categories (OWNER/STAFF JWT)

```bash
curl -X GET http://localhost:3000/admin/categories \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```bash
curl -X POST http://localhost:3000/admin/categories \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Burgers", "sortOrder": 1 }'
```

```bash
curl -X PATCH http://localhost:3000/admin/categories/<CATEGORY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Signature Burgers", "sortOrder": 2 }'
```

```bash
curl -X DELETE http://localhost:3000/admin/categories/<CATEGORY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Admin items (OWNER/STAFF JWT)

```bash
curl -X GET "http://localhost:3000/admin/items?categoryId=<CATEGORY_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```bash
curl -X POST http://localhost:3000/admin/items \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "<CATEGORY_ID>",
    "name": "Classic Burger",
    "description": "Beef, cheddar, lettuce",
    "isAvailable": true,
    "prices": {
      "priceEurCents": 999,
      "priceBgnCents": 1953
    },
    "promo": {
      "promoPriceEurCents": 799,
      "promoPriceBgnCents": 1563
    },
    "sortOrder": 1
  }'
```

```bash
curl -X PATCH http://localhost:3000/admin/items/<ITEM_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "isAvailable": false, "sortOrder": 5 }'
```

```bash
curl -X DELETE http://localhost:3000/admin/items/<ITEM_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Release notes

### 2026-02-25

- Added optional `Category.imageUrl` support end-to-end (Prisma schema, migration, admin DTO/service, public DTO/mapper).
- Migration: `backend/prisma/migrations/20260224125130_v2/migration.sql` adds nullable `Category.imageUrl` (`TEXT`).
- Aligned create item DTO optional nullability for `imageUrl` and `allergens`.
- Added `GET /admin/restaurants` (SUPERADMIN) for restaurant listing with stable response envelope.
- Added `PATCH /admin/restaurants/:id` (SUPERADMIN) for partial restaurant updates including branding fields (`logoUrl`, `coverImageUrl`).
- Enabled `GET /admin/billing/features?restaurantId=<id>` for SUPERADMIN impersonation while keeping OWNER/STAFF scoped behavior.
- Documented SUPERADMIN scoped usage for admin endpoints via `restaurantId` query (`/admin/categories`, `/admin/orders`) used by frontend impersonation flow.
- Added public restaurant feature flags in response (`features.ORDERING`) for both `/public/restaurants/:slug` and `/public/restaurants/:slug/menu` restaurant block, backed by existing feature-flag resolver with safe fallback.
- Validation snapshot: `npm run build` (OK), `npm run test:e2e` (11/11 passing).
