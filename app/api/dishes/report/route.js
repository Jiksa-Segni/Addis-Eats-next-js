import { getSession } from "@/lib/auth";
import { getAllDishes } from "@/lib/dishes";

export const dynamic = "force-dynamic";

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") {
    return Response.json({ message: "Admin access required." }, { status: 401 });
  }

  const items = await getAllDishes();
  const rows = [
    ["Item ID", "Name", "Description", "Price (ETB)", "Availability", "Image"],
    ...items.map((item) => [
      item.id,
      item.name,
      item.description,
      item.price,
      item.isAvailable ? "Enabled" : "Disabled",
      item.image,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="addis-eats-all-items-report.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
