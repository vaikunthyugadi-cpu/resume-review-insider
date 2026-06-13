import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark">R</span>
          <span>ResumeReview</span>
        </Link>
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Feedback from the inside</p>
          <h1>Build a resume that gets noticed.</h1>
          <p>Practical feedback from verified employees at companies you want to join.</p>
        </div>
        <blockquote>
          “The feedback was specific, honest, and changed how I presented my experience.”
          <footer>Alex R. · Product candidate</footer>
        </blockquote>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <Link className="brand brand-dark auth-mobile-brand" href="/">
            <span className="brand-mark">R</span><span>ResumeReview</span>
          </Link>
          <p className="eyebrow">Welcome back</p>
          <h2>Log in to your account</h2>
          <p className="subtle">Continue to your Hunter or Reviewer workspace.</p>
          <LoginForm />
          <p className="auth-switch">New to ResumeReview? <Link href="/signup">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
