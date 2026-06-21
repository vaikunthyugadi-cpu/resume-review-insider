"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Company, ReviewPackage } from "@/lib/types";

export function NewReviewForm({ companies, packages }: { companies: Company[]; packages: ReviewPackage[] }) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!file) return setMessage("Choose a PDF, DOC, or DOCX resume.");
    if (file.size > 10 * 1024 * 1024) return setMessage("Resume files must be 10 MB or smaller.");
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) return setMessage("Only PDF, DOC, and DOCX files are supported.");
    if (!selectedPackage) return setMessage("No active review packages are available.");
    if (!companies.length) return setMessage("No companies are currently accepting reviews.");

    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });
    if (uploadError) {
      setMessage(uploadError.message);
      setLoading(false);
      return;
    }
    const { data: resume, error: resumeError } = await supabase.from("resumes").insert({
      user_id: user.id,
      title: String(form.get("targetRole")),
      file_name: file.name,
      file_path: path,
      mime_type: file.type,
      size_bytes: file.size
    }).select("id").single();
    if (resumeError || !resume) {
      await supabase.storage.from("resumes").remove([path]);
      setMessage(resumeError?.message ?? "Could not save resume metadata.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.rpc("purchase_and_create_review_request", {
      p_package_id: selectedPackage.id,
      p_resume_id: resume.id,
      p_company_id: String(form.get("companyId")),
      p_target_role: String(form.get("targetRole"))
    });
    if (error) {
      await Promise.all([
        supabase.from("resumes").delete().eq("id", resume.id),
        supabase.storage.from("resumes").remove([path])
      ]);
      setMessage(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard/hunter");
    router.refresh();
  }

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="field-grid">
        <label>Target company<select name="companyId" required defaultValue=""><option value="" disabled>Select a company</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
        <label>Target role<input name="targetRole" required placeholder="e.g. Product Manager" /></label>
      </div>
      <fieldset>
        <legend>Choose a review package</legend>
        <div className="package-picker">
          {packages.map((item, index) => <button className={selectedPackage?.id === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setSelectedPackage(item)}><span>{item.name}</span><strong>£{(item.price_pence / 100).toFixed(2)}</strong><small>{item.review_count} review {item.review_count === 1 ? "credit" : "credits"}</small>{index === 1 && <i>Popular</i>}</button>)}
        </div>
      </fieldset>
      <label className="upload-box">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setMessage("");
          }}
        />
        <span className="upload-icon">↑</span>
        <strong>{file ? file.name : "Upload your resume"}</strong>
        <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, DOC, or DOCX · Maximum 10 MB"}</small>
      </label>
      <div className="payment-note"><span>i</span><p><strong>Secure demo purchase.</strong> The package and request are saved together, so a failed submission will not consume credits.</p></div>
      {message && <p className="form-error" role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={loading || !selectedPackage || !companies.length}>{loading ? "Submitting securely..." : selectedPackage ? `Purchase and submit · £${(selectedPackage.price_pence / 100).toFixed(2)}` : "No packages available"}</button>
    </form>
  );
}
