-- Allow administrators to create or reactivate reviewer companies from the admin console.

create or replace function public.admin_create_company(p_company_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean_name text;
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
  if clean_name is null then
    raise exception 'Company name is required.';
  end if;

  clean_slug := public.slugify_company(clean_name);

  select id into selected_company
  from public.companies
  where slug = clean_slug
  limit 1;

  if selected_company is not null then
    update public.companies
    set name = clean_name,
        is_active = true
    where id = selected_company;

    return selected_company;
  end if;

  insert into public.companies (name, slug, is_active)
  values (clean_name, clean_slug, true)
  returning id into selected_company;

  return selected_company;
end;
$function$;

grant execute on function public.admin_create_company(text) to authenticated;
