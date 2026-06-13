import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark">R</span><span>ResumeReview</span>
        </Link>
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Join the marketplace</p>
          <h1>Better applications start with better context.</h1>
          <p>Join as a Hunter seeking feedback or a Reviewer sharing company expertise.</p>
        </div>
        <blockquote>
          “A focused review can save a candidate weeks of guessing.”
          <footer>Taylor M. · Verified reviewer</footer>
        </blockquote>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card auth-card-wide">
          <Link className="brand brand-dark auth-mobile-brand" href="/">
            <span className="brand-mark">R</span><span>ResumeReview</span>
          </Link>
          <p className="eyebrow">Create account</p>
          <h2>Choose how you will use ResumeReview</h2>
          <p className="subtle">Your role determines your dashboard and available tools.</p>
          <SignupForm initialRole={role === "reviewer" ? "reviewer" : "hunter"} />
          <p className="auth-switch">Already registered? <Link href="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  );
}
