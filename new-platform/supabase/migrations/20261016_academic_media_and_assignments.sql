-- Private storage for academic source audio/video and assignment files on the isolated platform project.
alter table public.platform_assignments add column if not exists resource_path text;
alter table public.platform_assignments add column if not exists resource_name text;
alter table public.platform_assignment_submissions add column if not exists attachment_name text;
alter table public.platform_exam_answers add column if not exists answer_audio_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-academic-media',
  'platform-academic-media',
  false,
  52428800,
  array[
    'audio/mpeg','audio/mp3','audio/mp4','audio/aac','audio/wav','audio/webm','audio/ogg',
    'video/mp4','video/quicktime','video/webm','video/x-m4v',
    'application/pdf','image/jpeg','image/png','image/webp','image/heic',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage access is mediated by server-created signed upload/download URLs. No public objects.
