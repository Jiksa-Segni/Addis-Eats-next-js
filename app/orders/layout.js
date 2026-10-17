// Order history is account-specific — exclude from search-engine indexing.
// Authentication is still enforced independently inside each page.
export const metadata = {
  title: "Order History",
  description: "View and track your past Addis Eats orders.",
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }) {
  return <>{children}</>;
}
