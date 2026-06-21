import { DashboardShell } from "@/components/dashboard-shell";
import { NewReviewForm } from "@/components/new-review-form";
import { requireProfile } from "@/lib/auth";
import type { Company, ReviewPackage } from "@/lib/types";

export default async function NewReviewPage({
  searchParams
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { supabase, profile } = await requireProfile("hunter");
  const { company } = await searchParams;
  const [{ data, error: companiesError }, { data: packageData, error: packagesError }] = await Promise.all([
    supabase.from("companies").select("id, name, slug, verified_reviewer_count").eq("is_active", true).gt("verified_reviewer_count", 0).order("name"),
    supabase.from("review_packages").select("id, name, review_count, price_pence").eq("is_active", true).order("sort_order")
  ]);
  const companies = (data ?? []) as Company[];
  const packages = (packageData ?? []) as ReviewPackage[];
  const initialCompanyId = companies.some((item) => item.id === company) ? company : undefined;
  const loadError = companiesError || packagesError;

  return (
    <DashboardShell profile={profile} active="new">
      <div className="page-heading"><div><h1>Submit your resume</h1><p>Choose a target company, upload your CV, and enter the review queue.</p></div></div>
      <div className="form-page-grid">
        <section className="panel">
          {loadError
            ? <p className="form-error" role="alert">Submission options could not be loaded. Please refresh and try again.</p>
            : <NewReviewForm companies={companies} packages={packages} initialCompanyId={initialCompanyId} />}
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
