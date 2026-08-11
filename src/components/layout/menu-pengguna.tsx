import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSesi } from "@/hooks/use-sesi";
import { emailKeUsername, keluar } from "@/lib/auth";
import { LABEL_PERAN } from "@/lib/format";

export function MenuPengguna() {
  const { session, profil } = useSesi();
  if (!session) return null;

  const nama = profil?.name ?? emailKeUsername(session.user.email);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{nama}</p>
        <p className="text-xs text-muted-foreground">{emailKeUsername(session.user.email)}</p>
      </div>
      {profil ? (
        <Badge variant="secondary" className="hidden md:inline-flex">
          {LABEL_PERAN[profil.role] ?? profil.role}
        </Badge>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        title="Keluar"
        onClick={async () => {
          try {
            await keluar();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Gagal keluar");
          }
        }}
      >
        <LogOut className="size-4" />
        <span className="sr-only">Keluar</span>
      </Button>
    </div>
  );
}
