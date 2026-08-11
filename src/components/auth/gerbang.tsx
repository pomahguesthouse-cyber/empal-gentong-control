import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSesi } from "@/hooks/use-sesi";
import { bolehBuka, keluar } from "@/lib/auth";

// Dipasang di dalam cangkang aplikasi. Sesi sudah dipastikan ada oleh Cangkang,
// jadi di sini tinggal memeriksa profil dan peran.
export function Gerbang({ children }: { children: ReactNode }) {
  const { profil } = useSesi();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!profil) {
    return (
      <PesanTertahan
        judul="Akun belum ditautkan"
        pesan="Anda berhasil masuk, tetapi akun ini belum terhubung ke data pengguna mana pun. Minta pemilik menautkannya lewat menu User & hak akses."
      />
    );
  }

  if (!profil.is_active) {
    return (
      <PesanTertahan
        judul="Akun dinonaktifkan"
        pesan="Akun Anda sudah tidak aktif. Hubungi pemilik bila ini keliru."
      />
    );
  }

  if (!bolehBuka(profil.role, path)) {
    return (
      <PesanTertahan
        judul="Tidak punya akses"
        pesan="Peran Anda tidak diizinkan membuka halaman ini. Gunakan menu di samping untuk berpindah."
        tampilkanKeluar={false}
      />
    );
  }

  return <>{children}</>;
}

function PesanTertahan({
  judul,
  pesan,
  tampilkanKeluar = true,
}: {
  judul: string;
  pesan: string;
  tampilkanKeluar?: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">{judul}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{pesan}</p>
        {tampilkanKeluar ? (
          <Button variant="outline" className="mt-6" onClick={() => void keluar()}>
            Keluar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
