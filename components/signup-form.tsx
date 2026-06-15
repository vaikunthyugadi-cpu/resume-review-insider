"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

type Company = { id: string; name: string };

export function SignupForm({ initialRole }: { initialRole: UserRole }) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.from("companies").select("id, name").eq("is_active", true).order("name")
      .then(({ data, error }) => {
        if (error) setMessage("Companies could not be loaded. Please refresh and try again.");
        else setCompanies(data ?? []);
        setCompaniesLoading(false);
      });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const companyId = String(form.get("companyId") ?? "");
    const company = companies.find((item) => item.id === companyId);

    if (role === "reviewer" && !company) {
      setMessage("Select a company from the list.");
      setLoading(false);
      return;
    }

    if (role === "reviewer" && company) {
      const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
      const companyToken = company.name.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, "");
      if (!companyToken || !emailDomain.includes(companyToken)) {
        setMessage(`Use a ${company.name} work email address to register as a Reviewer.`);
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        data: {
          full_name: String(form.get("fullName")),
          user_type: role,
          company_id: role === "reviewer" ? companyId : null,
          company_name: role === "reviewer" ? company?.name : null,
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

      <label>
        Full name
        <input name="fullName" required minLength={2} placeholder="Your full name" />
      </label>
      <label>
        {role === "reviewer" ? "Work email address" : "Email address"}
        <input name="email" type="email" required autoComplete="email" placeholder={role === "reviewer" ? "you@company.com" : "you@example.com"} />
      </label>

      {role === "reviewer" && (
        <>
          <label>
            Company
            <select name="companyId" required defaultValue="" disabled={companiesLoading || companies.length === 0}>
              <option value="" disabled>{companiesLoading ? "Loading companies..." : "Select your company"}</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label>
            Job title
            <input name="jobTitle" required placeholder="e.g. Product Manager" />
          </label>
        </>
      )}

      <label>
        Password
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
      </label>

      {message && <p className={success ? "form-success" : "form-error"} role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={loading || success || (role === "reviewer" && companiesLoading)}>
        {loading ? "Creating account..." : success ? "Confirmation email sent" : "Create " + role + " account"}
      </button>
    </form>
  );
}
