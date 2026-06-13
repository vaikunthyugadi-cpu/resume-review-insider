import Link from "next/link";
import { signOut } from "@/app/dashboard/actions";
import type { Profile } from "@/lib/types";

export function DashboardShell({
  profile,
  active,
  children
}: {
  profile: Profile;
  active: string;
  children: React.ReactNode;
}) {
  const reviewer = profile.role === "reviewer";
  const links = reviewer
    ? [
        ["overview", "/dashboard/reviewer", "Overview"],
        ["queue", "/dashboard/reviewer#queue", "Review queue"],
        ["completed", "/dashboard/reviewer#completed", "Completed reviews"]
      ]
    : [
        ["overview", "/dashboard/hunter", "Overview"],
        ["new", "/dashboard/hunter/new", "Submit a resume"],
        ["reviews", "/dashboard/hunter#reviews", "My reviews"]
      ];
  const initials = profile.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand brand-light" href="/">
          <span className="brand-mark">R</span><span>ResumeReview</span>
        </Link>
        <div className="role-tag">{reviewer ? "Reviewer workspace" : "Hunter workspace"}</div>
        <nav>
          <p>Workspace</p>
          {links.map(([id, href, label]) => (
            <Link className={active === id ? "active" : ""} href={href} key={id}>
              <span>{id === "overview" ? "⌂" : id === "new" || id === "queue" ? "+" : "✓"}</span>{label}
            </Link>
          ))}
          <p>Account</p>
          <Link href="/dashboard"><span>○</span>Account routing</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><strong>Need help?</strong><p>Contact support for account or review assistance.</p><a href="mailto:support@resumereview.app">Contact support</a></div>
          <form action={signOut}><button className="logout-button">↪ Log out</button></form>
        </div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p>{reviewer ? "Reviewer dashboard" : "Hunter dashboard"}</p><h2>Welcome back, {profile.full_name.split(" ")[0]}</h2></div>
          <div className="profile-summary"><span className="avatar">{initials}</span><div><strong>{profile.full_name}</strong><small>{reviewer ? profile.company_name : "Job seeker"}</small></div></div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}
