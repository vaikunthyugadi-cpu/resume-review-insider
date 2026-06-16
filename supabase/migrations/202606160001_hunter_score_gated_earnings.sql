alter table public.ratings drop constraint if exists ratings_stars_check;
alter table public.ratings
  add constraint ratings_stars_check check (stars >= 1 and stars <= 10);

create unique index if not exists reviewer_earnings_request_unique
  on public.reviewer_earnings(request_id);

create or replace function public.complete_review(
  selected_request uuid,
  feedback_strengths text,
  feedback_improvements text,
  feedback_recommendations text,
  feedback_summary text
)
returns public.review_feedback
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  selected public.review_requests;
  feedback public.review_feedback;
begin
  select * into selected
  from public.review_requests
  where id = selected_request
    and status = 'claimed'
    and claimed_by = v_user_id
  for update;

  if selected.id is null then
    raise exception 'Claimed review not found';
  end if;

  insert into public.review_feedback (
    request_id,
    reviewer_id,
    strengths,
    improvements,
    recommendations,
    overall_summary
  ) values (
    selected.id,
    v_user_id,
    trim(feedback_strengths),
    trim(feedback_improvements),
    trim(feedback_recommendations),
    trim(feedback_summary)
  ) returning * into feedback;

  update public.review_requests
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = selected.id;

  insert into public.notifications (user_id, title, message, link)
  values (
    selected.hunter_id,
    'Your review is ready',
    'Your company-specific resume feedback is ready. Score the review to release reviewer earnings when the score is above 7/10.',
    '/dashboard/hunter'
  );

  return feedback;
end;
$function$;

create or replace function public.submit_rating(
  selected_request uuid,
  selected_stars integer,
  selected_comment text default null::text
)
returns public.ratings
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  selected public.review_requests;
  created public.ratings;
begin
  if selected_stars < 1 or selected_stars > 10 then
    raise exception 'Score must be between 1 and 10';
  end if;

  select * into selected
  from public.review_requests
  where id = selected_request
    and hunter_id = v_user_id
    and status = 'completed'
  for update;

  if selected.id is null or selected.claimed_by is null then
    raise exception 'Completed review not found';
  end if;

  insert into public.ratings (
    request_id,
    hunter_id,
    reviewer_id,
    stars,
    comment
  ) values (
    selected.id,
    v_user_id,
    selected.claimed_by,
    selected_stars,
    nullif(trim(selected_comment), '')
  ) returning * into created;

  if selected_stars > 7 then
    insert into public.reviewer_earnings (reviewer_id, request_id, amount_pence)
    values (selected.claimed_by, selected.id, 100)
    on conflict (request_id) do nothing;

    insert into public.notifications (user_id, title, message, link)
    values (
      selected.claimed_by,
      'Earning unlocked',
      'The Hunter scored your review above 7/10. £1.00 has been added to your earnings.',
      '/dashboard/reviewer'
    );
  else
    insert into public.notifications (user_id, title, message, link)
    values (
      selected.claimed_by,
      'Hunter score received',
      'The Hunter scored your review. Earnings unlock only for scores above 7/10.',
      '/dashboard/reviewer'
    );
  end if;

  return created;
end;
$function$;
