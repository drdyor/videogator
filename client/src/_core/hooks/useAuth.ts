import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const devBypass =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    localStorage.getItem("dev-bypass-auth") === "true";

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !devBypass,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    if (import.meta.env.DEV) {
      localStorage.removeItem("dev-bypass-auth");
    }
    await supabase.auth.signOut();
    window.location.reload();
  }, []);

  if (devBypass) {
    return {
      user: {
        id: 0,
        open_id: "dev-bypass",
        name: "Dev User",
        image: null,
        role: "admin",
        loginMethod: "dev",
        created_at: new Date(),
        updated_at: new Date(),
      },
      loading: false,
      error: null,
      isAuthenticated: true,
      refresh: async () => ({ data: undefined, error: null, status: "success" as const }),
      logout,
    };
  }

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [meQuery.data, meQuery.error, meQuery.isLoading]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
