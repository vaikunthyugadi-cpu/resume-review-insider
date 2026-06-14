import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = { title: "Administrator login" };

export default function AdminLoginPage() {
  return (
    <main className="auth-layout admin-auth-layout">
      <section className="auth-brand-panel admin-auth-panel">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark">R</span><span>ResumeReview</span>
        </Link>
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Operations center</p>
          <h1>Clear oversight. Better outcomes.</h1>
          <p>Manage people, review quality, companies, requests, and platform support from one secure workspace.</p>
        </div>
        <blockquote>Administrator actions are permission checked, recorded in Supabase, and available only to active admin accounts.</blockquote>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <Link className="brand brand-dark auth-mobile-brand" href="/">
            <span className="brand-mark">R</span><span>ResumeReview</span>
          </Link>
          <p className="eyebrow">Restricted access</p>
          <h2>Administrator login</h2>
          <p className="subtle">Sign in with your dedicated operations account.</p>
          <AdminLoginForm />
          <p className="auth-switch"><Link href="/login">← Return to user login</Link></p>
        </div>
      </section>
    </main>
  );
}
