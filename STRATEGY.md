# Rendering and Route Strategy

## Project structure

```text
app/
  about/page.js
  actions.js
  api/
    dishes/route.js
    dishes/[id]/route.js
    orders/route.js
  cart/page.js
  checkout/
    layout.js
    page.js
  menu/
    error.js
    layout.js
    loading.js
    not-found.js
    page.js
    [id]/page.js
  globals.css
  layout.js
  loading.js
  page.js
lib/
  dishes.js
  orders.js
  schema.js
public/images/
```

## Route strategy

| Route | Rendering | Data source and reason |
| --- | --- | --- |
| `/` | Static (`force-static`) | Featured dish comes from `lib/dishes.js`; content is stable and ships as pre-rendered HTML. |
| `/about` | Static (`force-static`) | Editorial copy is local and does not vary per request. |
| `/menu` | Revalidated static (one hour) | `getDishes()` reads the local catalog; shared data keeps cards, detail pages, and the API aligned. |
| `/menu/[id]` | Revalidated static (one hour), known IDs generated at build time; unknown IDs use the menu not-found UI | `generateStaticParams()` and `getDishById()` read `lib/dishes.js`; no runtime catalog fetch is needed. |
| `/cart` | Dynamic (`force-dynamic`) | Shows the current demo cart seed in the request-rendered route. The cart is not yet persistent or interactive. |
| `/checkout` | Dynamic (`checkout/layout.js` uses `force-dynamic`) | The form uses a Server Action and request-time rendering; submitted values are checked by the shared Zod schema. The recap remains demo content. |
| `GET /api/dishes` | Dynamic (`force-dynamic`) | Returns the shared in-memory catalog from `lib/dishes.js`. |
| `GET /api/dishes/[id]` | Dynamic (`force-dynamic`) | Looks up one catalog entry by ID; returns `404` for an unknown dish. |
| `POST /api/orders` | Dynamic (`force-dynamic`) | Validates JSON with `lib/schema.js` and writes to the in-memory order store; returns `400` for invalid JSON and `422` for schema errors. |

The root layout provides shared navigation, metadata, and footer. The menu layout provides its section navigation; menu loading, error, and not-found boundaries are local to that route segment. API route handlers are independent of the visual layouts.

## Data and rendering decisions

- `lib/dishes.js` is the single source of truth for the three demo dishes and their local images.
- UI routes use Server Components by default. No client-side cart state is introduced; the cart and checkout summary remain explicitly illustrative.
- Menu pages revalidate hourly; individual dish paths are generated from the same catalog at build time.
- Order writes are intentionally demo-only: `lib/orders.js` stores them in a process-local `Map`, not a database. Restarting the process clears them.
