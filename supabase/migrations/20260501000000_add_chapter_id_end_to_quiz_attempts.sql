-- Multi-chapter quiz support: persist the END chapter of a range alongside the
-- existing scalar chapter_id (which now stores the START of the range for
-- multi-chapter attempts). NULL for legacy single-chapter rows.

alter table public.quiz_attempts
  add column if not exists chapter_id_end integer null;

comment on column public.quiz_attempts.chapter_id_end is
  'For multi-chapter quizzes: end of the chapter_id range. NULL for single-chapter attempts.';
