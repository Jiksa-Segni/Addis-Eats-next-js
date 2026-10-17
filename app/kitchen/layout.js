// Kitchen is staff-only — exclude from search-engine indexing.
// Server-side role checks are still enforced on every kitchen page independently.
export const metadata = {
  title: "Kitchen",
  description: "Addis Eats staff area — manage orders and menu items.",
  robots: { index: false, follow: false },
};

export default function KitchenLayout({ children }) {
  return <>{children}</>;
}
