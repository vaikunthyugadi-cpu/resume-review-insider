"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RatingForm({ requestId, reviewerId }: { requestId: string; reviewerId: string | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const comment = String(form.get("comment"));
    const reportReason = String(form.get("reportReason") ?? "");
    const { error } = await supabase.rpc("submit_rating", {
      selected_request: requestId,
      selected_stars: rating,
      selected_comment: comment
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    if (reportReason && reviewerId) {
      const { error: reportError } = await supabase.from("complaints").insert({
        request_id: requestId,
        hunter_id: user.id,
        reviewer_id: reviewerId,
        category: "quality",
        details: reportReason
      });
      if (reportError) {
        setMessage(`Rating saved, but the report could not be submitted: ${reportError.message}`);
        setLoading(false);
        return;
      }
    }
    router.refresh();
  }

  return <form className="rating-form" onSubmit={submit}>
    <div className="star-picker">{[1,2,3,4,5].map((value) => <button type="button" onClick={() => setRating(value)} className={value <= rating ? "active" : ""} key={value}>★</button>)}</div>
    <label>Comment<textarea name="comment" required placeholder="What was most helpful?" /></label>
    <label>Report an issue (optional)<textarea name="reportReason" placeholder="Describe low-effort, offensive, or misleading feedback." /></label>
    {message && <p className="form-error">{message}</p>}
    <button className="button button-primary button-block" disabled={loading}>{loading ? "Saving..." : "Submit rating"}</button>
  </form>;
}
