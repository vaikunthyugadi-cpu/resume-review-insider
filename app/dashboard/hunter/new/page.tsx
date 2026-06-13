import { DashboardShell } from "@/components/dashboard-shell";
import { NewReviewForm } from "@/components/new-review-form";
import { requireProfile } from "@/lib/auth";
import type { Company, ReviewPackage } from "@/lib/types";

export default async function NewReviewPage() {
  const { supabase, profile } = await requireProfile("hunter");
  const { data } = await supabase.from("companies").select("id, name, slug, verified_reviewer_count").eq("is_active", true).gt("verified_reviewer_count", 0).order("name");
  const companies = (data ?? []) as Company[];
  const { data: packageData } = await supabase.from("review_packages").select("id, name, review_count, price_pence").eq("is_active", true).order("sort_order");
  const packages = (packageData ?? []) as ReviewPackage[];

  return (
    <DashboardShell profile={profile} active="new">
      <div className="page-heading"><div><h1>Submit your resume</h1><p>Choose a target company, upload your CV, and enter the review queue.</p></div></div>
      <div className="form-page-grid">
        <section className="panel">
          <NewReviewForm companies={companies} packages={packages} />
        </section>
        <aside className="panel process-panel">
          <h2>What happens next?</h2>
          <ol>
            <li><span>1</span><div><strong>Secure upload</strong><p>Your resume is stored privately and only available to you and the assigned reviewer.</p></div></li>
            <li><span>2</span><div><strong>Reviewer claims it</strong><p>A verified insider at the selected company starts your review.</p></div></li>
            <li><span>3</span><div><strong>Receive feedback</strong><p>Read structured strengths, improvements, and company-specific job tips.</p></div></li>
          </ol>
        </aside>
      </div>
    </DashboardShell>
  );
}
