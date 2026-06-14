import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RatingForm } from "@/components/rating-form";
import { requireProfile } from "@/lib/auth";

export default async function HunterReviewDetail({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireProfile("hunter");
  const { data } = await supabase
    .from("review_requests")
    .select("id, status, target_role, resume_id, claimed_by, created_at, companies(name), resumes(file_name), review_feedback(strengths, improvements, recommendations, overall_summary), ratings(stars, comment)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const request = data as unknown as {
    id: string; status: string; target_role: string; resume_id: string; claimed_by: string | null; created_at: string;
    companies: { name: string } | null; resumes: { file_name: string } | null;
    review_feedback: { strengths: string; improvements: string; recommendations: string; overall_summary: string }[] | { strengths: string; improvements: string; recommendations: string; overall_summary: string } | null;
    ratings: { stars: number; comment: string }[] | { stars: number; comment: string } | null;
  };
  const feedback = Array.isArray(request.review_feedback) ? request.review_feedback[0] : request.review_feedback;
  const rating = Array.isArray(request.ratings) ? request.ratings[0] : request.ratings;
  const { data: reviewer } = request.claimed_by
    ? await supabase.from("users_profile").select("full_name").eq("id", request.claimed_by).single()
    : { data: null };

  return (
    <DashboardShell profile={profile} active="reviews">
      <div className="page-heading"><div><Link className="back-link" href="/dashboard/hunter">← Back to reviews</Link><h1>{request.companies?.name} review</h1><p>{request.target_role} · {request.resumes?.file_name}</p></div><span className={`status status-${request.status}`}>{request.status === "open" ? "Waiting" : request.status === "claimed" ? "In progress" : "Completed"}</span></div>
      {feedback ? (
        <div className="feedback-grid">
          <section className="panel feedback-main">
            <div className="panel-heading"><div><h2>Your insider review</h2><p>Reviewed by {reviewer?.full_name ?? "a verified insider"}</p></div></div>
            <FeedbackBlock title="Summary" text={feedback.overall_summary} />
            <FeedbackBlock title="What is working" text={feedback.strengths} />
            <FeedbackBlock title="What to improve" text={feedback.improvements} />
            <FeedbackBlock title="Company-specific tips" text={feedback.recommendations} />
          </section>
          <aside className="panel">
            <h2>Rate this review</h2>
            {rating ? <div className="existing-rating"><strong>{"★".repeat(rating.stars)}</strong><p>{rating.comment}</p></div> : <RatingForm requestId={request.id} reviewerId={request.claimed_by} />}
          </aside>
        </div>
      ) : (
        <section className="panel waiting-panel"><span>◷</span><h2>Your review is {request.status === "claimed" ? "in progress" : "waiting to be claimed"}</h2><p>You will see structured feedback here as soon as a verified reviewer completes it.</p></section>
      )}
    </DashboardShell>
  );
}

function FeedbackBlock({ title, text }: { title: string; text: string }) {
  return <div className="feedback-block"><h3>{title}</h3><p>{text}</p></div>;
}
