
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_created() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_shift() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_perm(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.has_perm(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
