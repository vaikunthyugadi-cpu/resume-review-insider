-- Keep reviewer accounts tied to an existing company and activate them after email confirmation.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  selected_role text;
  selected_company_id uuid;
  supplied_company text;
begin
  selected_role := case when new.raw_user_meta_data ->> 'user_type' = 'reviewer' then 'reviewer' else 'hunter' end;

  insert into public.users_profile (id, full_name, email, user_type)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'), coalesce(new.email, ''), selected_role)
  on conflict (id) do nothing;

  if selected_role = 'reviewer' then
    begin
      selected_company_id := nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid;
    exception when invalid_text_representation then
      selected_company_id := null;
    end;

    if selected_company_id is not null and not exists (
      select 1 from public.companies where id = selected_company_id and is_active = true
    ) then
      selected_company_id := null;
    end if;

    supplied_company := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
    if selected_company_id is null then
      supplied_company := coalesce(supplied_company, 'Unspecified company');
      select id into selected_company_id
      from public.companies
      where slug = public.slugify_company(supplied_company)
      limit 1;

      if selected_company_id is null then
        insert into public.companies (name, slug)
        values (supplied_company, public.slugify_company(supplied_company))
        returning id into selected_company_id;
      end if;
    else
      select name into supplied_company from public.companies where id = selected_company_id;
    end if;

    insert into public.reviewer_profiles (
      user_id, work_email, company_id, company_name, job_title, verification_status, verified_at
    ) values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'work_email'), ''), new.email),
      selected_company_id,
      supplied_company,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'job_title'), ''), 'Employee'),
      case when new.email_confirmed_at is not null then 'verified' else 'pending' end,
      case when new.email_confirmed_at is not null then now() else null end
    ) on conflict (user_id) do nothing;
  else
    insert into public.hunter_profiles (user_id) values (new.id) on conflict (user_id) do nothing;
    insert into public.hunter_wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  end if;

  return new;
end;
$function$;

create or replace function public.verify_reviewer_after_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.reviewer_profiles
    set verification_status = 'verified', verified_at = coalesce(verified_at, now()), updated_at = now()
    where user_id = new.id and verification_status = 'pending';
  end if;
  return new;
end;
$function$;

drop trigger if exists verify_reviewer_after_email_confirmation on auth.users;
create trigger verify_reviewer_after_email_confirmation
after update of email_confirmed_at on auth.users
for each row execute function public.verify_reviewer_after_email_confirmation();
