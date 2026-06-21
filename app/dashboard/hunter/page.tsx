import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NotificationCenter } from "@/components/notification-center";
import { requireProfile } from "@/lib/auth";

type RequestRow = {
  id: string;
  status: "open" | "claimed" | "completed" | "cancelled";
  target_role: string;
  created_at: string;
  due_at: string | null;
  companies: { name: string } | null;
  resumes: { file_name: string } | null;
  review_feedback: { id: string }[] | null;
};
type NotificationRow = { id: string; title: string; message: string; link: string | null; read_at: string | null; created_at: string };
type CompanyRow = { id: string; name: string; verified_reviewer_count: number };

export default async function HunterDashboard() {
  const { supabase, user, profile } = await requireProfile("hunter");
  const [
    { data, error: requestsError },
    { data: wallet },
    { data: notificationData },
    { data: companyData, error: companiesError }
  ] = await Promise.all([
    supabase.from("review_requests").select("id, status, target_role, created_at, due_at, companies(name), resumes(file_name), review_feedback(id)").eq("hunter_id", user.id).order("created_at", { ascending: false }),
    supabase.from("hunter_wallets").select("review_credits").eq("user_id", user.id).single(),
    supabase.from("notifications").select("id, title, message, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("companies").select("id, name, verified_reviewer_count").eq("is_active", true).gt("verified_reviewer_count", 0).order("name")
  ]);

  const requests = (data ?? []) as unknown as RequestRow[];
  const companies = (companyData ?? []) as CompanyRow[];
  const completed = requests.filter((item) => item.status === "completed").length;
  const inProgress = requests.filter((item) => item.status === "claimed").length;
  const waiting = requests.filter((item) => item.status === "open").length;

  return (
    <DashboardShell profile={profile} active="overview">
      <div className="page-heading">
        <div><h1>Your resume journey</h1><p>Track every submission and turn insider feedback into a stronger application.</p></div>
        <Link className="button button-primary" href="/dashboard/hunter/new">+ Submit a resume</Link>
      </div>
      {(requestsError || companiesError) && <p className="form-error" role="alert">Some dashboard information could not be loaded. Please refresh and try again.</p>}
      <NotificationCenter initialItems={(notificationData ?? []) as NotificationRow[]} />
      <section className="stat-grid">
        <Stat label="Submitted" value={requests.length} note="Total review requests" />
        <Stat label="Waiting" value={waiting} note="Available to reviewers" />
        <Stat label="In progress" value={inProgress} note="Claimed by an insider" />
        <Stat label="Review credits" value={wallet?.review_credits ?? 0} note={`${completed} completed reviews`} />
      </section>

      <section className="panel company-directory" id="companies">
        <div className="panel-heading">
          <div><p className="eyebrow">Choose a company</p><h2>Companies accepting resume reviews</h2><p>Select a company to begin with it already chosen in the submission form.</p></div>
          <span className="directory-count">{companies.length} available</span>
        </div>
        {companies.length ? (
          <div className="company-directory-grid">
            {companies.map((company, index) => (
              <article className={`company-directory-card company-accent-${index % 5 + 1}`} key={company.id}>
                <div className="company-directory-icon">{company.name.slice(0, 2).toUpperCase()}</div>
                <div className="company-directory-copy">
                  <strong>{company.name}</strong>
                  <small>{company.verified_reviewer_count} verified {company.verified_reviewer_count === 1 ? "reviewer" : "reviewers"}</small>
                </div>
                <Link className="button company-submit-button" href={`/dashboard/hunter/new?company=${company.id}`}>Submit resume for review</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-inline"><strong>No companies are available right now</strong><span>Companies will appear here when a verified reviewer is ready.</span></div>
        )}
      </section>

      <section className="panel" id="reviews">
        <div className="panel-heading"><div><h2>My reviews</h2><p>Your latest submissions and feedback status.</p></div></div>
        {requests.length ? (
          <div className="data-list">
            {requests.map((request) => (
              <Link className="data-row" href={`/dashboard/hunter/reviews/${request.id}`} key={request.id}>
                <span className="company-logo">{request.companies?.name.slice(0, 2).toUpperCase() ?? "RR"}</span>
                <div className="row-main"><strong>{request.companies?.name ?? "Target company"}</strong><small>{request.target_role} · {new Date(request.created_at).toLocaleDateString()}</small></div>
                <Status value={request.status} /><span className="row-arrow">+</span>
              </Link>
            ))}
          </div>
        ) : <EmptyState />}
      </section>
    </DashboardShell>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Status({ value }: { value: string }) {
  const label = value === "open" ? "Waiting" : value === "claimed" ? "In progress" : value === "completed" ? "Completed" : "Cancelled";
  return <span className={`status status-${value}`}>{label}</span>;
}

function EmptyState() {
  return <div className="empty-state"><span>R</span><h3>Start your first targeted review</h3><p>Choose a verified company, upload a PDF or Word resume, and receive structured insider feedback.</p><Link className="button button-primary" href="/dashboard/hunter/new">Submit a resume</Link></div>;
}
