# ResumeReview

Production Next.js marketplace connecting job seekers (Hunters) with verified company insiders (Reviewers).

## Features

- Supabase email authentication with separate Hunter and Reviewer accounts
- Role-based dashboards and authorization
- Private PDF, DOC, and DOCX resume storage
- Company-specific review queues
- Atomic review claiming with a 48-hour deadline
- Structured reviewer feedback
- Hunter ratings and complaint reporting
- Responsive navy-and-mint ResumeReview design

## Setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
2. Run `supabase/migrations/202606130001_resume_review.sql` in the Supabase SQL editor.
3. Install dependencies with `npm install`.
4. Start locally with `npm run dev`.

## Deployment

Connect the repository to Vercel and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Set the Supabase Site URL to the production Vercel domain and add `/auth/callback` to the redirect allow list.

Package purchases currently use the existing Supabase demo purchase function and correctly add review credits. Connect a payment provider before accepting real charges.
