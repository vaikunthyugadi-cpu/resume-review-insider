"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Metrics = { users?: number; hunters?: number; reviewers?: number; pending_reviewers?: number; open_requests?: number; completed_requests?: number; open_complaints?: number };
type UserRow = { id: string; full_name?: string; email?: string; user_type?: string; account_status?: string; request_count?: number; created_at?: string };
type ReviewerRow = { user_id: string; full_name?: string; email?: string; company_name?: string; job_title?: string; verification_status?: string };
type CompanyRow = { id: string; name?: string; is_active?: boolean; active?: boolean; verified_reviewer_count?: number };
type RequestRow = { id: string; target_role?: string; status?: string; company_name?: string; hunter_name?: string; reviewer_name?: string; created_at?: string };
type ComplaintRow = { id: string; category?: string; details?: string; status?: string; created_at?: string };
type PackageRow = { id: string; name: string; review_count: number; price_pence: number; is_active: boolean; sort_order: number };
type RoleTab = "hunter" | "reviewer";
type AdminRun = (name: string, args: Record<string, string | boolean | number>, id: string) => Promise<boolean>;

export type AdminDashboardData = { metrics?: Metrics; users?: UserRow[]; reviewers?: ReviewerRow[]; companies?: CompanyRow[]; requests?: RequestRow[]; complaints?: ComplaintRow[]; packages?: PackageRow[] };

function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function Badge({ value = "unknown" }: { value?: string }) {
  return <span className={`status status-${value}`}>{value.replaceAll("_", " ")}</span>;
}

export function AdminConsole({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("hunter");
  const data = initialData || {};
  const hunters = (data.users ?? []).filter((user) => user.user_type === "hunter");
  const reviewerAccounts = (data.users ?? []).filter((user) => user.user_type === "reviewer");
  const activeHunters = hunters.filter((user) => user.account_status === "active").length;
  const activeReviewers = reviewerAccounts.filter((user) => user.account_status === "active").length;
  const suspendedHunters = hunters.filter((user) => user.account_status === "suspended").length;
  const pendingReviewers = (data.reviewers ?? []).filter((reviewer) => reviewer.verification_status !== "verified");
  const hunterRequests = data.requests ?? [];
  const reviewerRequests = (data.requests ?? []).filter((request) => request.status === "claimed" || request.status === "completed" || Boolean(request.reviewer_name));
  const completedRequests = (data.requests ?? []).filter((request) => request.status === "completed").length;
  const openRequests = (data.requests ?? []).filter((request) => request.status === "open").length;

  async function run(name: string, args: Record<string, string | boolean | number>, id: string) {
    setBusy(id);
    setNotice("");
    const { error } = await createClient().rpc(name, args);
    if (error) {
      setNotice(error.message);
      setBusy("");
      return false;
    }
    setNotice("Change saved successfully.");
    router.refresh();
    setBusy("");
    return true;
  }

  async function updatePackage(event: React.FormEvent<HTMLFormElement>, item: PackageRow) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run("admin_update_package", {
      p_package_id: item.id,
      p_review_count: Number(form.get("reviews")),
      p_price_pence: Math.round(Number(form.get("price")) * 100),
      p_is_active: form.get("active") === "on"
    }, item.id);
  }

  async function createCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const companyName = String(form.get("companyName") ?? "").trim();
    if (!companyName) {
      setNotice("Company name is required.");
      return;
    }
    const saved = await run("admin_create_company", { p_company_name: companyName }, "company-create");
    if (saved) formElement.reset();
  }

  const hunterMetrics = [
    ["Hunters", hunters.length, "Total"],
    ["Active", activeHunters, "Live accounts"],
    ["Suspended", suspendedHunters, "Blocked"],
    ["Open", openRequests, "Waiting"],
    ["Completed", completedRequests, "Done"]
  ];
  const reviewerMetrics = [
    ["Reviewers", reviewerAccounts.length, "Total"],
    ["Active", activeReviewers, "Live accounts"],
    ["Pending", pendingReviewers.length, "Verify"],
    ["Companies", (data.companies ?? []).length, "Listed"],
    ["Assigned", reviewerRequests.length, "Reviews"]
  ];
  const selectedMetrics = roleTab === "hunter" ? hunterMetrics : reviewerMetrics;

  return <>
    {notice && <p className={notice.includes("successfully") ? "form-success admin-notice" : "form-error admin-notice"}>{notice}</p>}
    <section className="admin-role-hero">
      <div>
        <p className="eyebrow">Workspace</p>
        <h2>{roleTab === "hunter" ? "Hunters" : "Reviewers"}</h2>
      </div>
      <div className="admin-role-switch admin-role-switch-top" role="tablist" aria-label="Admin page switch">
        <button className={roleTab === "hunter" ? "active" : ""} type="button" onClick={() => setRoleTab("hunter")}>
          <strong>Hunters</strong>
          <span>{hunters.length} accounts</span>
        </button>
        <button className={roleTab === "reviewer" ? "active" : ""} type="button" onClick={() => setRoleTab("reviewer")}>
          <strong>Reviewers</strong>
          <span>{reviewerAccounts.length} accounts</span>
        </button>
      </div>
    </section>

    <section className="admin-metrics">
      {selectedMetrics.map(([label, value, note]) => <article className="stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </section>

    {roleTab === "hunter" ? <HunterPage hunters={hunters} requests={hunterRequests} packages={data.packages ?? []} busy={busy} run={run} updatePackage={updatePackage} /> : <ReviewerPage reviewers={reviewerAccounts} reviewerProfiles={data.reviewers ?? []} pendingCount={pendingReviewers.length} companies={data.companies ?? []} requests={reviewerRequests} busy={busy} run={run} createCompany={createCompany} />}
  </>;
}

function HunterPage({ hunters, requests, packages, busy, run, updatePackage }: { hunters: UserRow[]; requests: RequestRow[]; packages: PackageRow[]; busy: string; run: AdminRun; updatePackage: (event: React.FormEvent<HTMLFormElement>, item: PackageRow) => Promise<void> }) {
  return <>
    <section className="panel admin-section" id="people">
      <Heading eyebrow="Accounts" title="Hunters" />
      <div className="admin-list-heading"><div><strong>Hunter accounts</strong></div><span>{hunters.length} total</span></div>
      <AccountTable users={hunters} busy={busy} run={run} empty="No Hunters." />
    </section>

    <section className="panel admin-section" id="pricing">
      <Heading eyebrow="Pricing" title="Packages" />
      <div className="pricing-admin-grid">
        {packages.map((item) => <form className="pricing-admin-card" key={item.id} onSubmit={(event) => updatePackage(event, item)}>
          <div><strong>{item.name}</strong><small>Package</small></div>
          <label>Price (GBP)<input name="price" type="number" min="0.5" step="0.01" defaultValue={(item.price_pence / 100).toFixed(2)} /></label>
          <label>Review credits<input name="reviews" type="number" min="1" max="100" defaultValue={item.review_count} /></label>
          <label className="toggle-label"><input name="active" type="checkbox" defaultChecked={item.is_active} /> Available to Hunters</label>
          <button className="button button-primary" disabled={busy === item.id}>{busy === item.id ? "Saving..." : "Save package"}</button>
        </form>)}
      </div>
    </section>

    <RequestsTable title="Resume requests" requests={requests} busy={busy} run={run} mode="hunter" />
  </>;
}

function ReviewerPage({ reviewers, reviewerProfiles, pendingCount, companies, requests, busy, run, createCompany }: { reviewers: UserRow[]; reviewerProfiles: ReviewerRow[]; pendingCount: number; companies: CompanyRow[]; requests: RequestRow[]; busy: string; run: AdminRun; createCompany: (event: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <>
    <section className="panel admin-section" id="people">
      <Heading eyebrow="Accounts" title="Reviewers" />
      <div className="admin-reviewer-grid">
        <div className="admin-role-pane">
          <div className="admin-list-heading"><div><strong>Reviewer accounts</strong></div><span>{reviewers.length} total</span></div>
          <AccountTable users={reviewers} busy={busy} run={run} empty="No Reviewers." />
          <div className="admin-subsection">
            <div className="admin-list-heading"><div><strong>Verification</strong></div><span>{pendingCount} pending</span></div>
            <div className="admin-card-list">
              {reviewerProfiles.length ? reviewerProfiles.map((reviewer) => <article className="admin-person-card" key={reviewer.user_id}>
                <div className="avatar">{(reviewer.full_name || "R").slice(0, 2).toUpperCase()}</div>
                <div className="admin-card-main"><strong>{reviewer.full_name || "Reviewer"}</strong><small>{reviewer.email} - {reviewer.job_title || "Role not supplied"}</small><small>{reviewer.company_name || "Company not supplied"}</small></div>
                <Badge value={reviewer.verification_status} />
                <div className="admin-actions">
                  <button disabled={busy === reviewer.user_id} onClick={() => run("admin_set_reviewer_verification", { selected_user: reviewer.user_id, new_status: "verified" }, reviewer.user_id)}>Verify</button>
                  <button disabled={busy === reviewer.user_id} onClick={() => run("admin_set_reviewer_verification", { selected_user: reviewer.user_id, new_status: "rejected" }, reviewer.user_id)}>Reject</button>
                </div>
              </article>) : <p className="empty-inline">No profiles.</p>}
            </div>
          </div>
        </div>

        <aside className="admin-company-manager">
          <div className="admin-list-heading"><div><strong>Companies</strong></div></div>
          <form className="admin-company-form" onSubmit={createCompany}>
            <label>New company name<input name="companyName" required minLength={2} placeholder="Example: Google" /></label>
            <button className="button button-primary" disabled={busy === "company-create"}>{busy === "company-create" ? "Adding..." : "Add company"}</button>
          </form>
          <div className="admin-card-list">
            {companies.length ? companies.map((company) => {
              const active = company.is_active ?? company.active ?? true;
              return <article className="admin-compact-card" key={company.id}>
                <div><strong>{company.name || "Company"}</strong><small>{company.verified_reviewer_count ?? 0} verified reviewers</small></div>
                <button className="admin-action" disabled={busy === company.id} onClick={() => run("admin_set_company_status", { selected_company: company.id, active: !active }, company.id)}>{active ? "Pause" : "Enable"}</button>
              </article>;
            }) : <p className="empty-inline">No companies.</p>}
          </div>
        </aside>
      </div>
    </section>

    <RequestsTable title="Assigned reviews" requests={requests} busy={busy} run={run} mode="reviewer" />
  </>;
}

function AccountTable({ users, busy, run, empty }: { users: UserRow[]; busy: string; run: AdminRun; empty: string }) {
  if (!users.length) return <p className="empty-inline">{empty}</p>;
  return <div className="admin-table-wrap">
    <table className="admin-table">
      <thead><tr><th>Person</th><th>Status</th><th>Activity</th><th>Joined</th><th>Action</th></tr></thead>
      <tbody>{users.map((user) => <tr key={user.id}>
        <td><strong>{user.full_name || "Unnamed user"}</strong><small>{user.email}</small></td>
        <td><Badge value={user.account_status} /></td>
        <td>{user.request_count ?? 0} requests</td>
        <td>{date(user.created_at)}</td>
        <td><button className="admin-action" disabled={busy === user.id} onClick={() => run("admin_set_account_status", { selected_user: user.id, new_status: user.account_status === "active" ? "suspended" : "active" }, user.id)}>{user.account_status === "active" ? "Suspend" : "Activate"}</button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function RequestsTable({ title, requests, busy, run, mode }: { title: string; requests: RequestRow[]; busy: string; run: AdminRun; mode: RoleTab }) {
  return <section className="panel admin-section" id="requests">
    <Heading eyebrow="Requests" title={title} />
    {requests.length ? <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Request</th><th>Hunter</th><th>Reviewer</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
        <tbody>{requests.map((item) => <tr key={item.id}>
          <td><strong>{item.target_role || "Resume review"}</strong><small>{item.company_name || "General"}</small></td>
          <td>{item.hunter_name || "-"}</td>
          <td>{item.reviewer_name || "Unclaimed"}</td>
          <td><Badge value={item.status} /></td>
          <td>{date(item.created_at)}</td>
          <td>{item.status !== "completed" && <button className="admin-action" disabled={busy === item.id} onClick={() => run("admin_set_request_status", { selected_request: item.id, new_status: item.status === "cancelled" ? "open" : "cancelled" }, item.id)}>{item.status === "cancelled" ? "Reopen" : "Cancel"}</button>}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="empty-inline">{mode === "hunter" ? "No requests." : "No assigned reviews."}</p>}
  </section>;
}

function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{copy && <p>{copy}</p>}</div></div>;
}
