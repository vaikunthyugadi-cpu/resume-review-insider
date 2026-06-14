"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Metrics = { users?: number; hunters?: number; reviewers?: number; pending_reviewers?: number; open_requests?: number; completed_requests?: number; open_complaints?: number };
type UserRow = { id: string; full_name?: string; email?: string; user_type?: string; account_status?: string; request_count?: number; created_at?: string };
type ReviewerRow = { user_id: string; full_name?: string; email?: string; company_name?: string; job_title?: string; verification_status?: string };
type CompanyRow = { id: string; name?: string; is_active?: boolean; active?: boolean; verified_reviewer_count?: number };
type RequestRow = { id: string; job_title?: string; status?: string; company_name?: string; hunter_name?: string; reviewer_name?: string; created_at?: string };
type ComplaintRow = { id: string; subject?: string; status?: string; reporter_name?: string; created_at?: string };
export type AdminDashboardData = { metrics?: Metrics; users?: UserRow[]; reviewers?: ReviewerRow[]; companies?: CompanyRow[]; requests?: RequestRow[]; complaints?: ComplaintRow[] };

function date(value?: string) { return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
function Badge({ value = "unknown" }: { value?: string }) { return <span className={`status status-${value}`}>{value.replaceAll("_", " ")}</span>; }

export function AdminConsole({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const data = initialData || {};

  async function run(name: string, args: Record<string, string | boolean>, key: string) {
    setBusy(key); setNotice("");
    const { error } = await createClient().rpc(name, args);
    if (error) setNotice(error.message);
    else { setNotice("Change saved successfully."); router.refresh(); }
    setBusy("");
  }

  const metrics = [
    ["People", data.metrics?.users ?? 0, "Active platform accounts"],
    ["Hunters", data.metrics?.hunters ?? 0, "Job seekers using reviews"],
    ["Reviewers", data.metrics?.reviewers ?? 0, `${data.metrics?.pending_reviewers ?? 0} awaiting verification`],
    ["Open requests", data.metrics?.open_requests ?? 0, `${data.metrics?.completed_requests ?? 0} completed`],
    ["Support", data.metrics?.open_complaints ?? 0, "Open complaints"]
  ];

  return <>
    {notice && <p className={notice.includes("successfully") ? "form-success admin-notice" : "form-error admin-notice"} role="status">{notice}</p>}
    <section className="admin-metrics" aria-label="Platform overview">
      {metrics.map(([label, value, note]) => <article className="stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </section>

    <section className="panel admin-section" id="people">
      <div className="panel-heading"><div><p className="eyebrow">Account management</p><h2>Hunters and reviewers</h2><p>Suspend access immediately or restore a resolved account.</p></div><span className="admin-count">{data.users?.length ?? 0} accounts</span></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Activity</th><th>Joined</th><th>Action</th></tr></thead><tbody>
        {(data.users ?? []).map(user => <tr key={user.id}><td><strong>{user.full_name || "Unnamed user"}</strong><small>{user.email}</small></td><td><Badge value={user.user_type} /></td><td><Badge value={user.account_status} /></td><td>{user.request_count ?? 0} requests</td><td>{date(user.created_at)}</td><td><button className="admin-action" disabled={busy === user.id} onClick={() => run("admin_set_account_status", { selected_user: user.id, new_status: user.account_status === "active" ? "suspended" : "active" }, user.id)}>{busy === user.id ? "Saving..." : user.account_status === "active" ? "Suspend" : "Activate"}</button></td></tr>)}
      </tbody></table></div>
    </section>

    <section className="panel admin-section" id="reviewers">
      <div className="panel-heading"><div><p className="eyebrow">Trust and quality</p><h2>Reviewer verification</h2><p>Approve verified employees or reject profiles that do not meet requirements.</p></div></div>
      <div className="admin-card-list">{(data.reviewers ?? []).map(reviewer => <article className="admin-person-card" key={reviewer.user_id}><div className="avatar">{(reviewer.full_name || "R").slice(0,2).toUpperCase()}</div><div className="admin-card-main"><strong>{reviewer.full_name || "Reviewer"}</strong><small>{reviewer.email} · {reviewer.job_title || "Role not supplied"}</small><small>{reviewer.company_name || "Company not supplied"}</small></div><Badge value={reviewer.verification_status} /><div className="admin-actions"><button disabled={busy === reviewer.user_id} onClick={() => run("admin_set_reviewer_verification", { selected_user: reviewer.user_id, new_status: "verified" }, reviewer.user_id)}>Verify</button><button disabled={busy === reviewer.user_id} onClick={() => run("admin_set_reviewer_verification", { selected_user: reviewer.user_id, new_status: "rejected" }, reviewer.user_id)}>Reject</button></div></article>)}</div>
    </section>

    <section className="admin-two-column">
      <div className="panel admin-section" id="companies"><div className="panel-heading"><div><p className="eyebrow">Marketplace</p><h2>Companies</h2></div></div><div className="admin-card-list">{(data.companies ?? []).map(company => { const active = company.is_active ?? company.active ?? true; return <article className="admin-compact-card" key={company.id}><div><strong>{company.name || "Company"}</strong><small>{company.verified_reviewer_count ?? 0} verified reviewers</small></div><button className="admin-action" disabled={busy === company.id} onClick={() => run("admin_set_company_status", { selected_company: company.id, active: !active }, company.id)}>{active ? "Pause" : "Enable"}</button></article>; })}</div></div>
      <div className="panel admin-section" id="support"><div className="panel-heading"><div><p className="eyebrow">Support queue</p><h2>Complaints</h2></div></div><div className="admin-card-list">{(data.complaints ?? []).length ? (data.complaints ?? []).map(item => <article className="admin-compact-card" key={item.id}><div><strong>{item.subject || "Platform complaint"}</strong><small>{item.reporter_name || "User"} · {date(item.created_at)}</small></div>{item.status === "resolved" ? <Badge value="completed" /> : <button className="admin-action" disabled={busy === item.id} onClick={() => run("admin_resolve_complaint", { selected_complaint: item.id }, item.id)}>Resolve</button>}</article>) : <p className="empty-inline">No open complaints.</p>}</div></div>
    </section>

    <section className="panel admin-section" id="requests"><div className="panel-heading"><div><p className="eyebrow">Review operations</p><h2>Recent resume requests</h2><p>Monitor ownership and recover requests that need intervention.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Request</th><th>Hunter</th><th>Reviewer</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>{(data.requests ?? []).map(item => <tr key={item.id}><td><strong>{item.job_title || "Resume review"}</strong><small>{item.company_name || "General"}</small></td><td>{item.hunter_name || "—"}</td><td>{item.reviewer_name || "Unclaimed"}</td><td><Badge value={item.status} /></td><td>{date(item.created_at)}</td><td>{item.status !== "completed" && <button className="admin-action" disabled={busy === item.id} onClick={() => run("admin_set_request_status", { selected_request: item.id, new_status: item.status === "cancelled" ? "open" : "cancelled" }, item.id)}>{item.status === "cancelled" ? "Reopen" : "Cancel"}</button>}</td></tr>)}</tbody></table></div></section>
  </>;
}
