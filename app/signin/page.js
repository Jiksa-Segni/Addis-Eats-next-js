import SignInForm from "./SignInForm";

export default async function SignInPage({ searchParams }) {
  const { next } = await searchParams;

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <SignInForm next={typeof next === "string" ? next : ""} />
    </section>
  );
}
