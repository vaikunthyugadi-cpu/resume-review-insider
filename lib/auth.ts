import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminProfile, Profile } from "@/lib/types";

export async function requireProfile(role?: "hunter" | "reviewer") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("users_profile")
    .select("id, full_name, user_type, account_status, is_admin")
    .eq("id", user.id)
    .single();

  if (!account) redirect("/signup?error=profile");
  if (account.account_status !== "active") redirect("/login?error=suspended");
  if (account.is_admin && role) redirect("/admin");

  const isReviewer = account.user_type === "reviewer";
  const { data: reviewer } = isReviewer
    ? await supabase.from("reviewer_profiles").select("company_id, company_name, verification_status").eq("user_id", user.id).single()
    : { data: null };

  const profile: Profile = {
    id: account.id,
    full_name: account.full_name,
    role: isReviewer ? "reviewer" : "hunter",
    company_id: reviewer?.company_id ?? null,
    company_name: reviewer?.company_name ?? null,
    work_email_verified: reviewer?.verification_status === "verified",
    verification_status: reviewer?.verification_status,
    account_status: account.account_status,
    is_admin: account.is_admin
  };

  if (role && profile.role !== role) redirect(`/dashboard/${profile.role}`);
  return { supabase, user, profile };
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: account } = await supabase
    .from("users_profile")
    .select("id, full_name, email, account_status, is_admin")
    .eq("id", user.id)
    .single();

  if (!account?.is_admin) redirect("/dashboard");
  if (account.account_status !== "active") redirect("/admin/login?error=suspended");

  const profile: AdminProfile = { id: account.id, full_name: account.full_name, email: account.email, is_admin: true };
  return { supabase, user, profile };
}
