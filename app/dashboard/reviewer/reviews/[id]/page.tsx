import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ReviewerReviewForm } from "@/components/reviewer-review-form";
import { requireProfile } from "@/lib/auth";

export default async function ReviewerReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireProfile("reviewer");
  const { data } = await supabase
    .from("review_requests")
    .select("id, status, target_role, resume_id, hunter_id, claimed_by, created_at, resumes(file_name, file_path), review_feedback(strengths, improvements, recommendations, overall_summary)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const request = data as unknown as {
    id: string; status: string; target_role: string; resume_id: string; hunter_id: string; claimed_by: string | null; created_at: string;
    resumes: { file_name: string; file_path: string } | null;
    review_feedback: { strengths: string; improvements: string; recommendations: string; overall_summary: string }[] | null;
  };
  const feedback = request.review_feedback?.[0];
  const { data: hunter } = await supabase.from("users_profile").select("full_name").eq("id", request.hunter_id).single();
  let resumeUrl = "";
  if (request.claimed_by === user.id && request.resumes) {
    const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(request.resumes.file_path, 600);
    resumeUrl = signed?.signedUrl ?? "";
  }

  return (
    <DashboardShell profile={profile} active="queue">
      <div className="page-heading"><div><Link className="back-link" href="/dashboard/reviewer">← Back to queue</Link><h1>{hunter?.full_name ?? "Candidate"}’s review</h1><p>{request.target_role} · Submitted {new Date(request.created_at).toLocaleDateString()}</p></div><span className={`status status-${request.status}`}>{request.status === "open" ? "Available" : request.status === "claimed" ? "In progress" : "Completed"}</span></div>
      <section className="review-workspace">
        <aside className="panel resume-card">
          <span className="file-icon">CV</span><h2>{request.resumes?.file_name}</h2>
          {resumeUrl ? <a className="button button-secondary button-block" href={resumeUrl} target="_blank" rel="noreferrer">Open private resume</a> : <p>Claim this review to securely access the resume.</p>}
          <div className="privacy-note"><strong>Private document</strong><span>Do not download, share, or retain candidate resumes outside this review.</span></div>
        </aside>
        <section className="panel">
          {feedback ? <div className="completed-feedback"><h2>Review submitted</h2><p>Your feedback is now visible to the Hunter.</p><h3>Summary</h3><p>{feedback.overall_summary}</p><h3>Strengths</h3><p>{feedback.strengths}</p><h3>Improvements</h3><p>{feedback.improvements}</p><h3>Job tips</h3><p>{feedback.recommendations}</p></div> : <ReviewerReviewForm requestId={request.id} status={request.status} reviewerId={request.claimed_by} currentUserId={user.id} />}
        </section>
      </section>
    </DashboardShell>
  );
}
