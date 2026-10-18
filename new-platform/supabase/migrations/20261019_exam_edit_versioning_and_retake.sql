CREATE OR REPLACE FUNCTION public.platform_save_exam(p_exam jsonb, p_questions jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_id uuid;
  v_item jsonb;
  v_question_id uuid;
  v_title text;
  v_stage text;
  v_duration integer;
  v_sort integer := 0;
  v_versioned boolean := false;
begin
  v_title := trim(coalesce(p_exam->>'title',''));
  v_stage := coalesce(p_exam->>'stage','');
  v_duration := greatest(1, least(600, coalesce(nullif(p_exam->>'duration_minutes','')::integer,30)));
  if length(v_title) < 1 or length(v_title) > 180 then
    raise exception 'اكتبي اسم امتحان صحيحًا.';
  end if;
  if v_stage not in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة') then
    raise exception 'اختاري مرحلة دراسية صحيحة.';
  end if;
  if jsonb_typeof(coalesce(p_questions,'[]'::jsonb)) <> 'array' then
    raise exception 'قائمة الأسئلة غير صحيحة.';
  end if;

  if nullif(p_exam->>'id','') is not null then
    v_id := (p_exam->>'id')::uuid;
    if exists(select 1 from public.platform_exam_attempts a where a.exam_id = v_id) then
      -- Preserve old questions, answers and grades: edits after student activity create a new exam version.
      update public.platform_exams
        set title = case when title like '%— نسخة سابقة' then title else left(title, 162) || ' — نسخة سابقة' end,
            is_published = false,
            updated_at = now()
        where id = v_id;
      if not found then raise exception 'الامتحان المطلوب غير موجود.'; end if;
      insert into public.platform_exams(title,instructions,stage,course_title,duration_minutes,is_published)
      values(v_title,left(coalesce(p_exam->>'instructions',''),5000),v_stage,left(coalesce(p_exam->>'course_title',''),180),v_duration,coalesce((p_exam->>'is_published')::boolean,false))
      returning id into v_id;
      v_versioned := true;
    else
      update public.platform_exams
        set title = v_title,
            instructions = left(coalesce(p_exam->>'instructions',''),5000),
            stage = v_stage,
            course_title = left(coalesce(p_exam->>'course_title',''),180),
            duration_minutes = v_duration,
            is_published = coalesce((p_exam->>'is_published')::boolean,false),
            updated_at = now()
        where id = v_id;
      if not found then raise exception 'الامتحان المطلوب غير موجود.'; end if;
    end if;
  else
    insert into public.platform_exams(title,instructions,stage,course_title,duration_minutes,is_published)
    values(v_title,left(coalesce(p_exam->>'instructions',''),5000),v_stage,left(coalesce(p_exam->>'course_title',''),180),v_duration,coalesce((p_exam->>'is_published')::boolean,false))
    returning id into v_id;
  end if;

  delete from public.platform_exam_questions where exam_id = v_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_questions,'[]'::jsonb)) loop
    if length(trim(coalesce(v_item->>'prompt',''))) < 1 then
      raise exception 'كل سؤال لازم يكون له نص.';
    end if;
    v_sort := v_sort + 1;
    insert into public.platform_exam_questions(exam_id,question_type,prompt,options,points,media_url,sort_order)
    values(
      v_id,
      coalesce(v_item->>'question_type','single_choice'),
      left(trim(v_item->>'prompt'),10000),
      case when jsonb_typeof(v_item->'options')='array' then v_item->'options' else '[]'::jsonb end,
      greatest(0,least(10000,coalesce(nullif(v_item->>'points','')::numeric,1))),
      nullif(left(coalesce(v_item->>'media_url',''),2000),''),
      v_sort
    ) returning id into v_question_id;
    if v_item ? 'answer_key' and v_item->'answer_key' <> 'null'::jsonb then
      insert into public.platform_exam_answer_keys(question_id,answer_key,scoring_notes)
      values(v_question_id,v_item->'answer_key',left(coalesce(v_item->>'scoring_notes',''),5000));
    end if;
  end loop;
  return jsonb_build_object('id',v_id,'questions_saved',v_sort,'versioned',v_versioned);
end;
$function$;