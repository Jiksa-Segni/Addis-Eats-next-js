// Sign-in is an auth page — exclude from indexing but still allow crawlers to follow links.
export const metadata = {
  title: "Sign In",
  description: "Sign in to your Addis Eats account to place and track orders.",
  robots: { index: false, follow: true },
};

export default function SignInLayout({ children }) {
  return <>{children}</>;
}
