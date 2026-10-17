import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutLayout({ children }) {
  const session = await getSession();

  if (session?.role !== "customer") {
    redirect(`/signin?next=${encodeURIComponent("/checkout")}`);
  }

  return <>{children}</>;
}
