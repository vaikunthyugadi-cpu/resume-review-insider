"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RatingForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(8);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const comment = String(form.get("comment"));
    const reportReason = String(form.get("reportReason") ?? "");
    const reportCategory = String(form.get("reportCategory") ?? "other");
    const { error } = await supabase.rpc("submit_rating_with_report", {
      selected_request: requestId,
      selected_stars: rating,
      selected_comment: comment,
      selected_report_category: reportCategory,
      selected_report_details: reportReason
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return <form className="rating-form" onSubmit={submit}>
    <div className="score-picker" aria-label="Score this review out of 10">{[1,2,3,4,5,6,7,8,9,10].map((value) => <button type="button" onClick={() => setRating(value)} className={value <= rating ? "active" : ""} key={value} aria-pressed={value === rating}>{value}</button>)}</div>
    <div className="payment-note"><span>£</span><p><strong>Reviewer earnings unlock only for scores above 7/10.</strong> Your score controls whether £1.00 reflects in the Reviewer dashboard.</p></div>
    <label>Comment<textarea name="comment" required placeholder="What was most helpful about the review?" /></label>
    <div className="field-grid"><label>Issue type<select name="reportCategory" defaultValue="low_effort"><option value="low_effort">Low-effort feedback</option><option value="misleading">Misleading advice</option><option value="offensive">Offensive content</option><option value="late">Late delivery</option><option value="other">Other</option></select></label><label>Report an issue (optional)<textarea name="reportReason" placeholder="Describe the issue for the admin team." /></label></div>
    {message && <p className="form-error" role="alert">{message}</p>}
    <button className="button button-primary button-block" disabled={loading}>{loading ? "Saving..." : "Submit score"}</button>
  </form>;
}
