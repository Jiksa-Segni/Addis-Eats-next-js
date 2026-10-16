# Component and State Boundaries

## Component ownership

| Component or module | Runtime | Owns or depends on |
| --- | --- | --- |
| `app/layout.js` (`RootLayout`) | Server Component | Shared shell, navigation, metadata, and footer; it owns no mutable state. |
| `app/page.js` (`HomePage`) | Static Server Component | Reads the featured dish from `lib/dishes.js`; owns no mutable state. |
| `app/about/page.js` (`AboutPage`) | Static Server Component | Story content only; owns no mutable state. |
| `app/menu/layout.js` (`MenuLayout`) | Server Component | Menu-section navigation; owns no mutable state. |
| `app/menu/page.js` (`MenuPage`) | Revalidated Server Component | Reads the shared dish catalog and renders its cards; owns no mutable state. |
| `app/menu/[id]/page.js` (`DishPage`) | Revalidated Server Component | Resolves the route ID against the shared catalog; `notFound()` handles missing items. |
| `app/cart/page.js` (`CartPage`) | Dynamic Server Component | Owns a fixed example cart in the page render; no browser or persistent cart state exists. |
| `app/checkout/page.js` (`CheckoutPage`) | Client Component | React `useActionState` owns transient submission status, field errors, and pending state. Form values are submitted to the server action and are not persisted by the component. |
| `app/actions.js` (`placeOrder`) | Server Action | Validates submitted form values, creates a demo order, and revalidates checkout/cart paths. Its demo session is fixed and is not authentication. |
| `app/api/dishes/*` | Route Handlers | Read-only access to the shared dish catalog; no UI or client state. |
| `app/api/orders/route.js` | Route Handler | Validates JSON and creates a demo order through the shared order store. |
| `app/menu/error.js` | Client error boundary | Receives the route error and owns the retry interaction through `reset()`. |
| `app/loading.js`, `app/menu/loading.js`, `app/menu/not-found.js` | Server Components | Present route feedback only; own no persistent state. |
| `lib/dishes.js` | Server-side data module | Owns the in-memory dish catalog used by pages and handlers. |
| `lib/orders.js` | Server-side data module | Owns a process-local `Map` of demo orders. It is volatile and not suitable for production persistence. |
| `lib/schema.js` | Shared validation module | Defines the Zod order-input contract; owns no state. |

## State flow

1. Menu pages and dish APIs read the same catalog. Dish detail paths are built from catalog IDs.
2. The checkout form sends `FormData` to `placeOrder`; the action validates with `orderSchema` before writing.
3. The JSON order endpoint validates with the same schema before writing to `lib/orders.js`.
4. Checkout submission status exists only in the current `useActionState` instance. Orders live only in the server process memory and are lost on restart.
5. The cart and checkout recap are seeded examples, not connected to a customer session or to the order payload.

The fixed demo session and in-memory store are instructional boundaries, not production authentication or persistence. A real deployment needs an authenticated session, durable storage, and a cart connected to checkout before it can accept real orders.
