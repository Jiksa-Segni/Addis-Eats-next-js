"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartFavorites } from "../providers";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useCartFavorites();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    signIn({
      email,
      name: email.split("@")[0].replace(/[._-]/g, " ") || "Guest",
    });

    router.push("/menu");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Welcome back</p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Sign in</h1>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-5">
        <label className="block text-sm font-medium text-stone-700">
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="customer@example.test"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-600"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-600"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800"
      >
        Continue to menu
      </button>

      <p className="mt-4 text-center text-sm text-stone-600">
        Demo: enter any email and a password of 6+ characters.
      </p>
    </form>
  );
}
