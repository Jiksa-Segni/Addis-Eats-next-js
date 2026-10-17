// Cart is transactional and account-specific — keep it out of search-engine indexes.
export const metadata = {
  title: "Your Cart",
  description: "Review the dishes in your Addis Eats cart before checking out.",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }) {
  return <>{children}</>;
}
