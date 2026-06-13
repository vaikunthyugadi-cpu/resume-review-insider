import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireProfile } from "@/lib/auth";

type QueueRow = {
  id: string;
  status: string;
  target_role: string;
  created_at: string;
  hunter_id: string;
  hunter_name?: string;
};

export default async function ReviewerDashboard() {
  const { supabase, profile } = await requireProfile("reviewer");
  const { data } = await supabase
    .from("review_requests")
    .select("id, status, target_role, created_at, hunter_id")
    .in("status", ["open", "claimed", "completed"])
    .order("created_at", { ascending: false });
  const all = (data ?? []) as unknown as QueueRow[];
  const hunterIds = [...new Set(all.map((item) => item.hunter_id))];
  const { data: hunters } = hunterIds.length
    ? await supabase.from("users_profile").select("id, full_name").in("id", hunterIds)
    : { data: [] };
  const hunterNames = new Map((hunters ?? []).map((hunter) => [hunter.id, hunter.full_name]));
  all.forEach((item) => { item.hunter_name = hunterNames.get(item.hunter_id) ?? "Candidate"; });
  const queue = all.filter((item) => item.status === "open");
  const claimed = all.filter((item) => item.status === "claimed");
  const completed = all.filter((item) => item.status === "completed");

  return (
    <DashboardShell profile={profile} active="overview">
      <div className="page-heading"><div><h1>Reviews at a glance</h1><p>Help candidates sharpen their story and earn for your company expertise.</p></div></div>
      <section className="stat-grid">
        <Stat label="Open requests" value={queue.length} note={`For ${profile.company_name ?? "your company"}`} />
        <Stat label="In progress" value={claimed.length} note="Claimed reviews" />
        <Stat label="Completed" value={completed.length} note="Available history" />
        <Stat label="Estimated earnings" value={`£${completed.length}`} note="£1 per review" />
      </section>
      {!profile.work_email_verified && <section className="panel verification-banner"><strong>Reviewer verification pending</strong><p>An administrator must verify your company account before you can claim new reviews.</p></section>}
      <section className="panel" id="queue">
        <div className="panel-heading"><div><h2>Open review queue</h2><p>The first reviewer to start a review claims it.</p></div><span className="live-pill">Live queue</span></div>
        {queue.length ? <div className="queue-list">{queue.map((item) => <article className="queue-row" key={item.id}><span className="avatar">{initials(item.hunter_name)}</span><div><strong>{item.hunter_name}</strong><small>{item.target_role}</small></div><span className="date-note">{new Date(item.created_at).toLocaleDateString()}</span><Link className="button button-primary" href={`/dashboard/reviewer/reviews/${item.id}`}>Start review</Link></article>)}</div> : <div className="empty-inline"><strong>The queue is clear</strong><span>New submissions for {profile.company_name} will appear here.</span></div>}
      </section>
      <section className="panel" id="completed">
        <div className="panel-heading"><div><h2>Your reviews</h2><p>Claimed and completed candidate reviews.</p></div></div>
        {[...claimed, ...completed].length ? <div className="data-list">{[...claimed, ...completed].map((item) => <Link className="data-row" href={`/dashboard/reviewer/reviews/${item.id}`} key={item.id}><span className="avatar">{initials(item.hunter_name)}</span><div className="row-main"><strong>{item.hunter_name}</strong><small>{item.target_role}</small></div><span className={`status status-${item.status}`}>{item.status === "claimed" ? "In progress" : "Completed"}</span><span className="row-arrow">›</span></Link>)}</div> : <div className="empty-inline"><strong>No claimed reviews yet</strong><span>Choose an available candidate above to begin.</span></div>}
      </section>
    </DashboardShell>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function initials(name?: string) {
  return (name ?? "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
