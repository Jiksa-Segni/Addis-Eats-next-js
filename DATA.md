# Client Data Queries

All browser queries use the shared `fetcher` in `lib/fetcher.js`. It parses JSON and throws on non-success HTTP responses so SWR exposes request errors instead of treating failed responses as data.

| Screen | SWR key | Refresh and cache policy | Reason |
| --- | --- | --- | --- |
| Order status, `app/orders/[id]/OrderStatus.js` | `/api/orders/${id}` | Poll every 5 seconds; revalidation on focus is disabled | Order state can change while the status screen is open. The server supplies `fallbackData`, so the first render already has the order and does not show a loading flash. |
| Menu search and page 1, `app/menu/SearchBox.jsx` | `/api/dishes?q=${encodeURIComponent(term)}&page=${page}` after a 300 ms debounce; `null` while the search is empty and the current page is 1 | No polling; revalidation on focus is disabled; keep previous data when the key changes | Typing triggers only the final debounced query. SWR deduplicates equal keys and associates responses with their key, while `keepPreviousData` retains the previous results during a search transition. The null key avoids an unnecessary request for an empty term. |
| Menu pagination, `app/menu/SearchBox.jsx` | `/api/dishes?page=${page}` when the page is greater than 1 | No polling; revalidation on focus is disabled; keep previous data between pages | The page is part of the cache key and is also reflected in `/menu?page=N`, making each result page linkable. Page 1 is rendered by the Server Component and supplied as `fallbackData`. |

The static dish detail page and the initial menu page do not need browser fetching. Order writes remain Server Actions or Route Handler mutations; polling is only used to read the resulting order status. Query results and orders use the in-memory demo store and are not persistent across server restarts.
