-- Allow active administrators to permanently delete unused companies while
-- preserving reviewer and review history for companies already in use.

create or replace function public.admin_delete_company(selected_company uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  company_name text;
begin
  if not exists (
    select 1
    from public.users_profile
    where id = auth.uid()
      and is_admin = true
      and account_status = 'active'
  ) then
    raise exception 'Only active administrators can delete companies.';
  end if;

  select name
  into company_name
  from public.companies
  where id = selected_company
  for update;

  if company_name is null then
    raise exception 'Company not found.';
  end if;

  if exists (
    select 1
    from public.reviewer_profiles
    where company_id = selected_company
  ) then
    raise exception 'This company has reviewer accounts. Pause it instead of deleting it.';
  end if;

  if exists (
    select 1
    from public.review_requests
    where company_id = selected_company
  ) then
    raise exception 'This company has review history. Pause it instead of deleting it.';
  end if;

  begin
    delete from public.companies
    where id = selected_company;
  exception
    when foreign_key_violation then
      raise exception 'This company is linked to platform records and cannot be deleted. Pause it instead.';
  end;

  return true;
end;
$function$;

grant execute on function public.admin_delete_company(uuid) to authenticated;
