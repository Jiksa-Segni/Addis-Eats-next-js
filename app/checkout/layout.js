import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Checkout is transactional and requires authentication — exclude from indexing.
export const metadata = {
  title: "Checkout",
  description: "Complete your Addis Eats order — enter your delivery details and place your order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutLayout({ children }) {
  const session = await getSession();

  if (session?.role !== "customer") {
    redirect(`/signin?next=${encodeURIComponent("/checkout")}`);
  }

  return <>{children}</>;
}
