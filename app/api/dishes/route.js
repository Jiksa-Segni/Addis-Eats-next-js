import { getDishes, getDishesPage } from "@/lib/dishes";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const pageParam = searchParams.get("page");

  if (query === null && pageParam === null) {
    return Response.json(await getDishes());
  }

  const page = pageParam === null ? 1 : Number(pageParam);
  if (!Number.isSafeInteger(page) || page < 1) {
    return Response.json({ error: "Page must be a positive integer." }, { status: 400 });
  }

  if (query !== null && query.length > 100) {
    return Response.json({ error: "Search terms must be 100 characters or fewer." }, { status: 400 });
  }

  return Response.json(await getDishesPage({ query: query ?? "", page }));
}
