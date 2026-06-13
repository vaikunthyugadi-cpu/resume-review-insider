"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReviewerReviewForm({ requestId, status, reviewerId, currentUserId }: { requestId: string; status: string; reviewerId: string | null; currentUserId: string }) {
  const router = useRouter();
  const [claimed, setClaimed] = useState(status === "claimed" && reviewerId === currentUserId);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function claim() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_review", { selected_request: requestId });
    if (error || !data) {
      setMessage(error?.message ?? "This review was already claimed by another reviewer.");
      setLoading(false);
      return;
    }
    setClaimed(true);
    setLoading(false);
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.rpc("complete_review", {
      selected_request: requestId,
      feedback_strengths: String(form.get("strengths")),
      feedback_improvements: String(form.get("improvements")),
      feedback_recommendations: String(form.get("jobTips")),
      feedback_summary: String(form.get("summary"))
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  if (!claimed) return <div className="claim-panel"><p className="eyebrow">Available review</p><h2>Claim this candidate</h2><p>Starting locks the request to your account for 48 hours. No other reviewer can work on it.</p>{message && <p className="form-error">{message}</p>}<button className="button button-primary button-block" onClick={claim} disabled={loading}>{loading ? "Claiming..." : "Start review"}</button></div>;

  return <form className="review-form" onSubmit={submit}><div><p className="eyebrow">Structured feedback</p><h2>Help this candidate improve</h2><p>Be specific, constructive, and relevant to the company’s hiring expectations.</p></div><label>Overall summary<textarea name="summary" required minLength={30} placeholder="Give the candidate a concise overview..." /></label><label>What is working<textarea name="strengths" required minLength={30} placeholder="Call out credible strengths and effective sections..." /></label><label>What should improve<textarea name="improvements" required minLength={30} placeholder="Give clear edits and explain why they matter..." /></label><label>Company-specific job tips<textarea name="jobTips" required minLength={30} placeholder="Share practical application or interview context..." /></label><div className="payment-note"><span>£</span><p><strong>£1.00 estimated earning</strong> will be recorded when this review is completed.</p></div>{message && <p className="form-error">{message}</p>}<button className="button button-primary button-block" disabled={loading}>{loading ? "Submitting..." : "Submit completed review"}</button></form>;
}
