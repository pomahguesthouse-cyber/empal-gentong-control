import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { ambilProfilSaya, type Profil } from "@/lib/auth";

interface SesiState {
  session: Session | null;
  profil: Profil | null;
  memuat: boolean;
  muatUlangProfil: () => void;
}

const KonteksSesi = createContext<SesiState>({
  session: null,
  profil: null,
  memuat: true,
  muatUlangProfil: () => {},
});

export const useSesi = (): SesiState => useContext(KonteksSesi);

export function SesiProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [penanda, setPenanda] = useState(0);

  const muatUlangProfil = useCallback(() => setPenanda((n) => n + 1), []);

  useEffect(() => {
    let hidup = true;
    const { data: langganan } = supabase.auth.onAuthStateChange((_peristiwa, s) => {
      if (hidup) setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!hidup) return;
      setSession(data.session);
      setMemuat(false);
    });
    return () => {
      hidup = false;
      langganan.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfil(null);
      return;
    }
    let hidup = true;
    ambilProfilSaya()
      .then((p) => {
        if (hidup) setProfil(p);
      })
      .catch(() => {
        if (hidup) setProfil(null);
      });
    return () => {
      hidup = false;
    };
  }, [session, penanda]);

  return (
    <KonteksSesi.Provider value={{ session, profil, memuat, muatUlangProfil }}>
      {children}
    </KonteksSesi.Provider>
  );
}
