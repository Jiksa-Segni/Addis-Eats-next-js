import { getDishById } from "@/lib/dishes";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    return Response.json({ error: "No such dish" }, { status: 404 });
  }

  return Response.json(dish);
}
