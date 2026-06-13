import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
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

export default async function HunterDashboard() {
  const { supabase, user, profile } = await requireProfile("hunter");
  const { data } = await supabase
    .from("review_requests")
    .select("id, status, target_role, created_at, due_at, companies(name), resumes(file_name), review_feedback(id)")
    .eq("hunter_id", user.id)
    .order("created_at", { ascending: false });
  const requests = (data ?? []) as unknown as RequestRow[];
  const completed = requests.filter((item) => item.status === "completed").length;
  const inProgress = requests.filter((item) => item.status === "claimed").length;
  const waiting = requests.filter((item) => item.status === "open").length;
  const { data: wallet } = await supabase.from("hunter_wallets").select("review_credits").eq("user_id", user.id).single();

  return (
    <DashboardShell profile={profile} active="overview">
      <div className="page-heading">
        <div><h1>Your resume journey</h1><p>Track every submission and turn insider feedback into a stronger application.</p></div>
        <Link className="button button-primary" href="/dashboard/hunter/new">+ Submit a resume</Link>
      </div>
      <section className="stat-grid">
        <Stat label="Submitted" value={requests.length} note="Total review requests" />
        <Stat label="Waiting" value={waiting} note="Available to reviewers" />
        <Stat label="In progress" value={inProgress} note="Claimed by an insider" />
        <Stat label="Review credits" value={wallet?.review_credits ?? 0} note={`${completed} completed reviews`} />
      </section>
      <section className="panel" id="reviews">
        <div className="panel-heading"><div><h2>My reviews</h2><p>Your latest submissions and feedback status.</p></div></div>
        {requests.length ? (
          <div className="data-list">
            {requests.map((request) => (
              <Link className="data-row" href={`/dashboard/hunter/reviews/${request.id}`} key={request.id}>
                <span className="company-logo">{request.companies?.name.slice(0, 2).toUpperCase() ?? "RR"}</span>
                <div className="row-main"><strong>{request.companies?.name ?? "Target company"}</strong><small>{request.target_role} · {new Date(request.created_at).toLocaleDateString()}</small></div>
                <Status value={request.status} />
                <span className="row-arrow">›</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No resume reviews yet" copy="Choose a company and submit your first resume for targeted feedback." href="/dashboard/hunter/new" />
        )}
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

function EmptyState({ title, copy, href }: { title: string; copy: string; href: string }) {
  return <div className="empty-state"><span>R</span><h3>{title}</h3><p>{copy}</p><Link className="button button-primary" href={href}>Get started</Link></div>;
}
