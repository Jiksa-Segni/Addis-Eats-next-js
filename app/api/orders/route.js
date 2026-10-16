import { saveOrder } from "@/lib/orders";
import { orderSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        message: "Validation failed.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const order = saveOrder({
    id: crypto.randomUUID(),
    ...parsed.data,
    status: "received",
    createdAt: new Date().toISOString(),
  });

  return Response.json({ message: "Order created successfully.", order }, { status: 201 });
}
