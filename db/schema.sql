-- Execute in the Neon SQL Editor on a development branch/database.
-- Do not apply this demo table to private, production SideMinD message storage.
create table if not exists public.side_demo_messages (
  id bigint generated always as identity primary key,
  author varchar(40) not null check (char_length(author) between 1 and 40),
  body varchar(280) not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists side_demo_messages_newest
  on public.side_demo_messages (created_at desc);

insert into public.side_demo_messages (author, body)
select 'SideMinD', 'SideUp Web alcançou Neon. O encontro continua no Edge.'
where not exists (select 1 from public.side_demo_messages);
