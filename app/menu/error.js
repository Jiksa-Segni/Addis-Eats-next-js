
"use client";

export default function Error({ error, reset }) {
  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold text-red-600">
        Something went wrong!
      </h2>

      <p className="mt-2">
        We could not load the menu. Please try again.
      </p>

      <button
        onClick={() => reset()}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Try Again
      </button>
    </main>
  );
}
