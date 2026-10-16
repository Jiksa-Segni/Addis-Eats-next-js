
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        Dish Not Found
      </h1>

      <p className="mt-4">
        Sorry, we could not find that dish on our menu.
      </p>

      <Link
        href="/menu"
        className="mt-6 inline-block text-blue-600 underline"
      >
        Back to Menu
      </Link>
    </main>
  );
}
