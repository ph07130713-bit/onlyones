-- Update budget question labels to KRW scale

update public.quiz_questions
set
  question = 'Budget per item (KRW)?',
  options = '{
    "min": 1,
    "max": 5,
    "labels": {
      "1": "3만원 이하",
      "2": "3–5만원",
      "3": "5–10만원",
      "4": "10–20만원",
      "5": "20만원 이상"
    }
  }'::jsonb
where type = 'scale'
  and question ilike 'Budget per item%';
