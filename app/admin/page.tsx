import Link from "next/link";
import { signOut } from "@/app/dashboard/actions";
import { AdminConsole, type AdminDashboardData } from "@/components/admin-console";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_dashboard_data");
  const initials = profile.full_name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-layout admin-layout">
      <aside className="dashboard-sidebar admin-sidebar">
        <Link className="brand brand-light" href="/admin"><span className="brand-mark">R</span><span>ResumeReview</span></Link>
        <div className="role-tag">Administrator console</div>
        <nav>
          <p>Control center</p>
          <Link className="active" href="/admin"><span>⌂</span>Overview</Link>
          <Link href="#people"><span>◎</span>People</Link>
          <Link href="#reviewers"><span>✓</span>Reviewers</Link>
          <Link href="#requests"><span>≡</span>Requests</Link>
          <Link href="#companies"><span>◇</span>Companies</Link>
          <Link href="#support"><span>!</span>Support</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><strong>Operations access</strong><p>Every action is checked against your administrator permission in Supabase.</p><a href="mailto:support@resumereview.app">Platform support</a></div>
          <form action={signOut}><button className="logout-button">↪ Log out</button></form>
        </div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar admin-topbar">
          <div><p>Platform administration</p><h2>Operations overview</h2></div>
          <div className="profile-summary"><span className="avatar">{initials}</span><div><strong>{profile.full_name}</strong><small>Administrator</small></div></div>
        </header>
        <main className="dashboard-content admin-content">
          <div className="page-heading"><div><p className="eyebrow">Live platform control</p><h1>Everything that needs attention</h1><p>Manage access, trust, review flow, companies, and support without leaving this page.</p></div><span className="live-pill">Live Supabase data</span></div>
          {error ? <p className="form-error">The admin dashboard could not load: {error.message}</p> : <AdminConsole initialData={(data || {}) as AdminDashboardData} />}
        </main>
      </section>
    </div>
  );
}
