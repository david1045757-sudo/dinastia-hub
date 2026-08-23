import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Rank = {
  id: string;
  slug: string;
  name: string;
  color: string;
  priority: number;
  is_staff: boolean;
  is_system: boolean;
  permissions: string[];
};

export type Profile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type AuthValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  rank: Rank | null;
  hasPerm: (perm: string) => boolean;
  isStaff: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rank, setRank] = useState<Rank | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  async function loadProfile(userId: string) {
    const [{ data: prof }, { data: ur }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_ranks").select("rank_id, ranks(*)").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);
    setRank(((ur as { ranks?: Rank } | null)?.ranks as Rank) ?? null);
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRank(null);
        queryClient.clear();
        return;
      }
      if (next?.user) {
        setTimeout(() => {
          void loadProfile(next.user.id);
        }, 0);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthValue>(() => {
    const perms = rank?.permissions ?? [];
    const hasPerm = (perm: string) => perms.includes("*") || perms.includes(perm);
    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      rank,
      hasPerm,
      isStaff: Boolean(rank?.is_staff),
      isAdmin:
        hasPerm("admin.users") ||
        hasPerm("admin.servers") ||
        hasPerm("admin.logs") ||
        hasPerm("admin.ranks"),
      refresh: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [loading, session, profile, rank]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
