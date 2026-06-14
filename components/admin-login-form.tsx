"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password"))
    });

    if (error) {
      setMessage("The administrator credentials are incorrect.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("users_profile")
      .select("is_admin, account_status").eq("id", data.user.id).single();

    if (!profile?.is_admin || profile.account_status !== "active") {
      await supabase.auth.signOut();
      setMessage("This account does not have active administrator access.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>Administrator email<input name="email" type="email" autoComplete="username" required placeholder="admin@example.com" /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="Enter administrator password" /></label>
      {message && <p className="form-error" role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={loading}>
        {loading ? "Verifying access..." : "Open admin console →"}
      </button>
    </form>
  );
}
