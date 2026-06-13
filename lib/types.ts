export type UserRole = "hunter" | "reviewer";
export type ReviewStatus = "open" | "claimed" | "completed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  company_name: string | null;
  work_email_verified: boolean;
  verification_status?: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  verified_reviewer_count?: number;
};

export type ReviewPackage = {
  id: string;
  name: string;
  review_count: number;
  price_pence: number;
};
