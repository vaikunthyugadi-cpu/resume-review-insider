import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  if (profile.is_admin) redirect("/admin");
  redirect(`/dashboard/${profile.role}`);
}
