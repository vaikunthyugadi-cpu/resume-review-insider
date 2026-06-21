-- Give companies a verified email domain source and make reviewer queue
-- notifications follow the lifecycle of the request they describe.

alter table public.companies
add column if not exists contact_email text;

alter table public.companies
drop constraint if exists companies_contact_email_format;

alter table public.companies
add constraint companies_contact_email_format
check (
  contact_email is null
  or contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

create unique index if not exists companies_contact_email_unique
on public.companies (lower(contact_email))
where contact_email is not null;

drop function if exists public.admin_create_company(text);

create or replace function public.admin_create_company(
  p_company_name text,
  p_company_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean_name text;
  clean_email text;
  clean_slug text;
  selected_company uuid;
begin
  if not exists (
    select 1
    from public.users_profile
    where id = auth.uid()
      and is_admin = true
      and account_status = 'active'
  ) then
    raise exception 'Only active administrators can create companies.';
  end if;

  clean_name := nullif(trim(p_company_name), '');
  clean_email := lower(nullif(trim(p_company_email), ''));

  if clean_name is null then
    raise exception 'Company name is required.';
  end if;

  if clean_email is null
    or clean_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception 'Enter a valid company email address.';
  end if;

  clean_slug := public.slugify_company(clean_name);

  select id into selected_company
  from public.companies
  where slug = clean_slug
  limit 1;

  if selected_company is not null then
    update public.companies
    set name = clean_name,
        contact_email = clean_email,
        is_active = true
    where id = selected_company;

    return selected_company;
  end if;

  insert into public.companies (name, slug, contact_email, is_active)
  values (clean_name, clean_slug, clean_email, true)
  returning id into selected_company;

  return selected_company;
end;
$function$;

grant execute on function public.admin_create_company(text, text) to authenticated;

create or replace function public.create_review_request(
  selected_resume uuid,
  selected_company uuid,
  requested_role text
)
returns public.review_requests
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  created public.review_requests;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.resumes
    where id = selected_resume
      and user_id = v_user_id
  ) then
    raise exception 'Resume not found';
  end if;

  if not exists (
    select 1
    from public.companies
    where id = selected_company
      and is_active = true
      and verified_reviewer_count > 0
  ) then
    raise exception 'Company is not currently available';
  end if;

  update public.hunter_wallets
  set review_credits = review_credits - 1,
      updated_at = now()
  where user_id = v_user_id
    and review_credits > 0;

  if not found then
    raise exception 'No review credits available';
  end if;

  begin
    insert into public.review_requests (
      hunter_id,
      resume_id,
      company_id,
      target_role
    ) values (
      v_user_id,
      selected_resume,
      selected_company,
      trim(requested_role)
    )
    returning * into created;
  exception
    when others then
      update public.hunter_wallets
      set review_credits = review_credits + 1,
          updated_at = now()
      where user_id = v_user_id;
      raise;
  end;

  insert into public.notifications (user_id, title, message, link)
  select
    rp.user_id,
    'New resume request',
    'A new resume is waiting for ' || c.name || '.',
    '/dashboard/reviewer/reviews/' || created.id::text
  from public.reviewer_profiles rp
  join public.companies c on c.id = rp.company_id
  where rp.company_id = selected_company
    and rp.verification_status = 'verified';

  return created;
end;
$function$;

grant execute on function public.create_review_request(uuid, uuid, text) to authenticated;

create or replace function public.claim_review(selected_request uuid)
returns public.review_requests
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  reviewer_company uuid;
  claimed public.review_requests;
begin
  perform public.release_expired_reviews();

  select company_id into reviewer_company
  from public.reviewer_profiles
  where user_id = v_user_id
    and verification_status = 'verified';

  if reviewer_company is null then
    raise exception 'Verified reviewer account required';
  end if;

  update public.review_requests
  set status = 'claimed',
      claimed_by = v_user_id,
      claimed_at = now(),
      due_at = now() + interval '48 hours',
      updated_at = now()
  where id = selected_request
    and company_id = reviewer_company
    and status = 'open'
  returning * into claimed;

  if claimed.id is null then
    raise exception 'Review is no longer available';
  end if;

  delete from public.notifications
  where title = 'New resume request'
    and link = '/dashboard/reviewer/reviews/' || claimed.id::text;

  insert into public.notifications (user_id, title, message, link)
  values (
    claimed.hunter_id,
    'Reviewer assigned',
    'A company insider has started your review.',
    '/dashboard/hunter'
  );

  return claimed;
end;
$function$;

grant execute on function public.claim_review(uuid) to authenticated;

-- Remove legacy generic queue alerts only when their company has no open work.
delete from public.notifications n
using public.reviewer_profiles rp
where n.user_id = rp.user_id
  and n.title = 'New resume request'
  and n.link = '/dashboard/reviewer'
  and not exists (
    select 1
    from public.review_requests rr
    where rr.company_id = rp.company_id
      and rr.status = 'open'
  );
