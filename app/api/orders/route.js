import { getSession } from "@/lib/auth";
import { getOrdersByUserId, resolveOrderItems, saveOrder } from "@/lib/orders";
import { orderSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "customer") {
    return Response.json({ message: "Customer sign-in required." }, { status: 401 });
  }

  return Response.json(getOrdersByUserId(session.id));
}

export async function POST(request) {
  const session = await getSession();
  if (session?.role !== "customer") {
    return Response.json({ message: "Customer sign-in required." }, { status: 401 });
  }

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

  const resolvedItems = await resolveOrderItems(parsed.data.items);
  if (!resolvedItems) {
    return Response.json({ message: "One or more ordered items are unavailable." }, { status: 422 });
  }

  const order = saveOrder({
    id: crypto.randomUUID(),
    userId: session.id,
    name: parsed.data.name,
    phone: session.phone,
    address: parsed.data.address,
    notes: parsed.data.notes,
    items: resolvedItems.items,
    total: resolvedItems.total,
    status: "received",
    createdAt: new Date().toISOString(),
  });

  return Response.json({ message: "Order created successfully.", order }, { status: 201 });
}
