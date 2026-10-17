"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/app/actions";
import { useCartFavorites } from "../providers";

const initialState = { success: false, message: "", redirectTo: "" };

export default function SignInForm({ next = "" }) {
  const router = useRouter();
  const { signIn } = useCartFavorites();
  const [role, setRole] = useState("customer");
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  useEffect(() => {
    if (state.success) {
      signIn(state.user);
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, signIn, state]);

  return (
    <form action={formAction} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Welcome</p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Sign in</h1>
      </div>

      {state.message ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="next" value={next} />
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-stone-700">Sign in as</legend>
        <div className="grid grid-cols-2 gap-3">
          {["customer", "admin"].map((accountRole) => (
            <button
              key={accountRole}
              type="button"
              onClick={() => setRole(accountRole)}
              className={`rounded-xl border px-4 py-3 font-semibold capitalize transition ${
                role === accountRole
                  ? "border-amber-700 bg-amber-50 text-amber-900"
                  : "border-stone-300 text-stone-700 hover:border-stone-500"
              }`}
              aria-pressed={role === accountRole}
            >
              {accountRole}
            </button>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="role" value={role} />

      <div className="space-y-5">
        <label className="block text-sm font-medium text-stone-700">
          Phone number
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            placeholder="09xxxxxxxx or +2519xxxxxxxx"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-600"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="At least 6 characters"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-600"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-8 w-full rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Continue"}
      </button>

      <p className="mt-4 text-center text-sm text-stone-600">
        {role === "customer"
          ? "Demo customer access: any valid Ethiopian phone number and password of 6+ characters."
          : "Admin access uses the ADMIN_PHONE and ADMIN_PASSWORD environment settings."}
      </p>
    </form>
  );
}
