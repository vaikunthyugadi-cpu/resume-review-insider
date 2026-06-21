-- Keep multi-step Hunter actions atomic so partial failures do not leave
-- purchases, credits, ratings, or reports in an inconsistent state.

create or replace function public.purchase_and_create_review_request(
  p_package_id uuid,
  p_resume_id uuid,
  p_company_id uuid,
  p_target_role text
)
returns public.review_requests
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  created public.review_requests;
begin
  perform public.purchase_package_demo(p_package_id);
  created := public.create_review_request(p_resume_id, p_company_id, p_target_role);
  return created;
end;
$function$;

grant execute on function public.purchase_and_create_review_request(uuid, uuid, uuid, text) to authenticated;

create or replace function public.submit_rating_with_report(
  selected_request uuid,
  selected_stars integer,
  selected_comment text,
  selected_report_category text default null,
  selected_report_details text default null
)
returns public.ratings
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  selected public.review_requests;
  created public.ratings;
  report_category text;
begin
  select *
  into selected
  from public.review_requests
  where id = selected_request
    and hunter_id = v_user_id
    and status = 'completed'
  for update;

  if selected.id is null or selected.claimed_by is null then
    raise exception 'Completed review not found';
  end if;

  created := public.submit_rating(selected_request, selected_stars, selected_comment);

  if nullif(trim(selected_report_details), '') is not null then
    report_category := coalesce(nullif(trim(selected_report_category), ''), 'other');
    if report_category not in ('low_effort', 'offensive', 'misleading', 'late', 'other') then
      raise exception 'Invalid report category';
    end if;

    insert into public.complaints (
      request_id,
      hunter_id,
      reviewer_id,
      category,
      details
    ) values (
      selected.id,
      v_user_id,
      selected.claimed_by,
      report_category,
      trim(selected_report_details)
    );
  end if;

  return created;
end;
$function$;

grant execute on function public.submit_rating_with_report(uuid, integer, text, text, text) to authenticated;
