"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

export function SignupForm({ initialRole }: { initialRole: UserRole }) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const company = String(form.get("company") ?? "");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: String(form.get("fullName")),
          user_type: role,
          company_name: role === "reviewer" ? company : null,
          work_email: role === "reviewer" ? email : null,
          job_title: role === "reviewer" ? String(form.get("jobTitle")) : null
        }
      }
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    if (data.session) window.location.href = "/dashboard";
    else {
      setSuccess(true);
      setMessage("Check your email and confirm your account to continue.");
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="role-picker">
        <button className={role === "hunter" ? "active" : ""} type="button" onClick={() => setRole("hunter")}>
          <strong>Hunter</strong><span>I want resume feedback</span>
        </button>
        <button className={role === "reviewer" ? "active" : ""} type="button" onClick={() => setRole("reviewer")}>
          <strong>Reviewer</strong><span>I work at a company</span>
        </button>
      </div>
      <label>Full name<input name="fullName" required minLength={2} placeholder="Your full name" /></label>
      <label>{role === "reviewer" ? "Work email address" : "Email address"}<input name="email" type="email" required autoComplete="email" placeholder={role === "reviewer" ? "you@company.com" : "you@example.com"} /></label>
      {role === "reviewer" && <>
        <label>Company name<input name="company" required placeholder="e.g. OpenAI" /></label>
        <label>Job title<input name="jobTitle" required placeholder="e.g. Product Manager" /></label>
      </>}
      <label>Password<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label>
      {message && <p className={success ? "form-success" : "form-error"} role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={loading || success}>
        {loading ? "Creating account..." : success ? "Confirmation email sent" : `Create ${role} account →`}
      </button>
    </form>
  );
}
