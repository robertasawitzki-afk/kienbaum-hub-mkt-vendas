import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "cp" | "socio" | "head_produto" | "consultora" | "staff";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  isSocio: boolean;
  canAccessGestao: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  rolesLoading: true,
  hasAccess: false,
  isAdmin: false,
  isSocio: false,
  canAccessGestao: false,
  hasRole: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    setRolesLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setRolesLoading(false);
      });
  }, [session?.user?.id]);

  const isAdmin = roles.includes("admin");
  const isSocio = roles.includes("socio");
  const canAccessGestao = isAdmin || isSocio;
  // Autenticado não basta — só quem recebeu um papel (via convite do admin) tem acesso ao hub.
  const hasAccess = roles.length > 0;

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        roles,
        rolesLoading,
        hasAccess,
        isAdmin,
        isSocio,
        canAccessGestao,
        hasRole: (r) => roles.includes(r),
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
