import Link from "next/link";
import { signOut } from "@/app/dashboard/actions";
import { AdminConsole, type AdminDashboardData } from "@/components/admin-console";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin();
  await supabase.rpc("release_expired_reviews");

  const [{ data, error }, { data: packages }] = await Promise.all([
    supabase.rpc("admin_dashboard_data"),
    supabase.from("review_packages").select("id, name, review_count, price_pence, is_active, sort_order").order("sort_order")
  ]);

  const initials = profile.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const initialData = { ...((data || {}) as AdminDashboardData), packages: packages ?? [] };

  return <div className="dashboard-layout admin-layout admin-workspace">
    <aside className="dashboard-sidebar admin-sidebar">
      <Link className="brand brand-light" href="/admin"><span className="brand-mark">R</span><span>ResumeReview</span></Link>
      <div className="role-tag">Admin</div>
      <nav>
        <p>Menu</p>
        <Link className="active" href="/admin"><span>01</span>Overview</Link>
        <Link href="#people"><span>02</span>Accounts</Link>
        <Link href="#requests"><span>03</span>Requests</Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="support-card">
          <strong>Admin access</strong>
          <p>Secure controls.</p>
          <a href="mailto:support@resumereview.app">Support</a>
        </div>
        <form action={signOut}><button className="logout-button">Log out</button></form>
      </div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-topbar admin-topbar">
        <div><p>Admin</p><h2>Dashboard</h2></div>
        <div className="profile-summary"><span className="avatar">{initials}</span><div><strong>{profile.full_name}</strong><small>Administrator</small></div></div>
      </header>
      <main className="dashboard-content admin-content">
        <div className="page-heading">
          <div><p className="eyebrow">Control panel</p><h1>Admin dashboard</h1></div>
          <span className="live-pill">Live</span>
        </div>
        {error ? <p className="form-error">The admin dashboard could not load: {error.message}</p> : <AdminConsole initialData={initialData} />}
      </main>
    </section>
  </div>;
}
