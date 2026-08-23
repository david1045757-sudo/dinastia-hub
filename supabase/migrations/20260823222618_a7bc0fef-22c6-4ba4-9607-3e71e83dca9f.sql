
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ ranks ============
CREATE TABLE public.ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#7dd3fc',
  priority int NOT NULL DEFAULT 0,
  is_staff boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ranks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranks TO authenticated;
GRANT ALL ON public.ranks TO service_role;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

INSERT INTO public.ranks (slug, name, color, priority, is_staff, is_system, permissions) VALUES
 ('usuario','Usuario','#94a3b8',0,false,true, ARRAY['tickets.create','tickets.own']),
 ('soporte','Soporte','#38bdf8',10,true,true, ARRAY['tickets.create','tickets.own','tickets.view_all','tickets.reply','tickets.claim','tickets.close','tickets.internal','staff.shift','staff.activity']),
 ('moderador','Moderador','#22d3ee',20,true,true, ARRAY['tickets.create','tickets.own','tickets.view_all','tickets.reply','tickets.claim','tickets.close','tickets.internal','staff.shift','staff.activity','staff.history_all','news.manage']),
 ('administrador','Administrador','#a78bfa',30,true,true, ARRAY['tickets.create','tickets.own','tickets.view_all','tickets.reply','tickets.claim','tickets.close','tickets.internal','staff.shift','staff.activity','staff.history_all','news.manage','admin.users','admin.servers','admin.logs']),
 ('dueno','Dueño','#facc15',100,true,true, ARRAY['*']);

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ user_ranks ============
CREATE TABLE public.user_ranks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rank_id uuid NOT NULL REFERENCES public.ranks(id) ON DELETE RESTRICT,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_ranks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ranks TO authenticated;
GRANT ALL ON public.user_ranks TO service_role;
ALTER TABLE public.user_ranks ENABLE ROW LEVEL SECURITY;

-- ============ permission function ============
CREATE OR REPLACE FUNCTION public.has_perm(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_ranks ur
    JOIN public.ranks r ON r.id = ur.rank_id
    WHERE ur.user_id = _user_id
      AND (r.permissions @> ARRAY['*'] OR r.permissions @> ARRAY[_perm])
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_ranks ur JOIN public.ranks r ON r.id = ur.rank_id
    WHERE ur.user_id = _user_id AND r.is_staff
  );
$$;

-- ============ new user handler (first user = owner) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_username text;
  v_rank uuid;
  v_first boolean;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text,1,8));
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_first;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, v_username);
  SELECT id INTO v_rank FROM public.ranks WHERE slug = CASE WHEN v_first THEN 'dueno' ELSE 'usuario' END;
  INSERT INTO public.user_ranks (user_id, rank_id) VALUES (NEW.id, v_rank);
  INSERT INTO public.logs (actor_id, action, details)
  VALUES (NEW.id, 'user.register', jsonb_build_object('username', v_username, 'first_user', v_first));
  RETURN NEW;
END; $$;

-- ============ servers ============
CREATE TABLE public.servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  mta_version text NOT NULL DEFAULT 'MTA:SA 1.6',
  players_online int NOT NULL DEFAULT 0,
  max_players int NOT NULL DEFAULT 100,
  is_open boolean NOT NULL DEFAULT true,
  closed_reason text,
  last_heartbeat timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servers TO authenticated;
GRANT ALL ON public.servers TO service_role;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER servers_updated BEFORE UPDATE ON public.servers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.servers (name, address, max_players) VALUES ('DINASTIA RP', 'mtasa://127.0.0.1:22003', 100);

-- ============ tickets ============
CREATE SEQUENCE public.ticket_number_seq START 1001;
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number int NOT NULL DEFAULT nextval('public.ticket_number_seq') UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  mta_identity text NOT NULL,
  status text NOT NULL DEFAULT 'abierto',
  priority text NOT NULL DEFAULT 'normal',
  claimed_by uuid,
  closed_at timestamptz,
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tickets_updated BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.mta_identity !~ '^[A-Za-zÁÉÍÓÚÑáéíóúñ]+_[A-Za-zÁÉÍÓÚÑáéíóúñ]+ [0-9]+$' THEN
    RAISE EXCEPTION 'Formato inválido. Usa: Nombre_Apellido ID (ej: Johan_David 1)';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.mta_identity IS DISTINCT FROM OLD.mta_identity THEN
    RAISE EXCEPTION 'El nombre e ID de MTA no se pueden modificar';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'No permitido';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER tickets_validate BEFORE INSERT OR UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.validate_ticket();

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- ============ shifts ============
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id uuid REFERENCES public.servers(id) ON DELETE SET NULL,
  rank_name text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX shifts_one_active ON public.shifts (user_id) WHERE ended_at IS NULL;

-- ============ mta presence ============
CREATE TABLE public.mta_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mta_identity text NOT NULL,
  username text,
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mta_identity)
);
GRANT SELECT ON public.mta_presence TO authenticated;
GRANT ALL ON public.mta_presence TO service_role;
ALTER TABLE public.mta_presence ENABLE ROW LEVEL SECURITY;

-- ============ notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  kind text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ news ============
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER news_updated BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.news (slug, title, excerpt, body) VALUES
 ('bienvenida','Bienvenido a la web oficial de DINASTIA RP','Ya puedes registrarte, abrir tickets y consultar el estado del servidor.','Damos la bienvenida a la nueva plataforma oficial de DINASTIA RP. Aquí podrás consultar el estado del servidor en tiempo real, abrir tickets de soporte y seguir todas las novedades de la comunidad.');

-- ============ logs ============
CREATE TABLE public.logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.logs TO authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- ============ auth trigger ============
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ policies ============
-- ranks
CREATE POLICY ranks_read_all ON public.ranks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY ranks_manage ON public.ranks FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'admin.ranks')) WITH CHECK (public.has_perm(auth.uid(),'admin.ranks'));

-- profiles
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_perm(auth.uid(),'admin.users')) WITH CHECK (public.has_perm(auth.uid(),'admin.users'));

-- user_ranks
CREATE POLICY user_ranks_read ON public.user_ranks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY user_ranks_manage ON public.user_ranks FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'admin.users')) WITH CHECK (public.has_perm(auth.uid(),'admin.users'));

-- servers
CREATE POLICY servers_read ON public.servers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY servers_manage ON public.servers FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'admin.servers')) WITH CHECK (public.has_perm(auth.uid(),'admin.servers'));

-- tickets
CREATE POLICY tickets_select ON public.tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'tickets.view_all'));
CREATE POLICY tickets_insert_own ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tickets_update_own ON public.tickets FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY tickets_update_staff ON public.tickets FOR UPDATE TO authenticated
  USING (public.has_perm(auth.uid(),'tickets.reply') OR public.has_perm(auth.uid(),'tickets.close'))
  WITH CHECK (public.has_perm(auth.uid(),'tickets.reply') OR public.has_perm(auth.uid(),'tickets.close'));

-- ticket messages
CREATE POLICY tm_select ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    (NOT is_internal AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_perm(auth.uid(),'tickets.view_all'))))
    OR (is_internal AND public.has_perm(auth.uid(),'tickets.internal'))
  );
CREATE POLICY tm_insert ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      (NOT is_internal AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_perm(auth.uid(),'tickets.reply'))))
      OR (is_internal AND public.has_perm(auth.uid(),'tickets.internal'))
    )
  );

-- shifts
CREATE POLICY shifts_select ON public.shifts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'staff.activity'));
CREATE POLICY shifts_insert_own ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_perm(auth.uid(),'staff.shift'));
CREATE POLICY shifts_update ON public.shifts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'admin.users'))
  WITH CHECK (user_id = auth.uid() OR public.has_perm(auth.uid(),'admin.users'));

-- presence
CREATE POLICY presence_select ON public.mta_presence FOR SELECT TO authenticated USING (true);

-- notifications
CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notif_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_insert_staff ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(auth.uid(),'admin.users'));

-- news
CREATE POLICY news_read ON public.news FOR SELECT TO anon, authenticated
  USING (published OR public.has_perm(auth.uid(),'news.manage'));
CREATE POLICY news_manage ON public.news FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'news.manage')) WITH CHECK (public.has_perm(auth.uid(),'news.manage'));

-- logs
CREATE POLICY logs_select ON public.logs FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(),'admin.logs'));
CREATE POLICY logs_insert ON public.logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ============ notification triggers ============
CREATE OR REPLACE FUNCTION public.notify_ticket_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link, kind)
  SELECT ur.user_id, 'Nuevo ticket #' || NEW.number, NEW.subject, '/staff/tickets', 'ticket'
  FROM public.user_ranks ur JOIN public.ranks r ON r.id = ur.rank_id
  WHERE (r.permissions @> ARRAY['*'] OR r.permissions @> ARRAY['tickets.view_all']) AND ur.user_id <> NEW.user_id;
  INSERT INTO public.logs (actor_id, action, details)
  VALUES (NEW.user_id, 'ticket.create', jsonb_build_object('number', NEW.number, 'subject', NEW.subject));
  RETURN NEW;
END; $$;
CREATE TRIGGER tickets_notify AFTER INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_created();

CREATE OR REPLACE FUNCTION public.notify_ticket_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.tickets%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.tickets WHERE id = NEW.ticket_id;
  IF NOT NEW.is_internal AND t.user_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, body, link, kind)
    VALUES (t.user_id, 'Respuesta en tu ticket #' || t.number, left(NEW.body, 120), '/mis-tickets/' || t.id, 'ticket');
  END IF;
  UPDATE public.tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER tm_notify AFTER INSERT ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_message();

CREATE OR REPLACE FUNCTION public.notify_ticket_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link, kind)
    VALUES (NEW.user_id, 'Ticket #' || NEW.number || ' actualizado', 'Nuevo estado: ' || NEW.status, '/mis-tickets/' || NEW.id, 'ticket');
    INSERT INTO public.logs (actor_id, action, details)
    VALUES (auth.uid(), 'ticket.status', jsonb_build_object('number', NEW.number, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER tickets_status_notify AFTER UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_status();

CREATE OR REPLACE FUNCTION public.log_shift()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.logs (actor_id, action, details)
    VALUES (NEW.user_id, 'shift.start', jsonb_build_object('rank', NEW.rank_name));
  ELSIF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    INSERT INTO public.logs (actor_id, action, details)
    VALUES (NEW.user_id, 'shift.end', jsonb_build_object('reason', NEW.end_reason,
      'seconds', EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER shifts_log AFTER INSERT OR UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.log_shift();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
