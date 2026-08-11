import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { masuk } from "@/lib/auth";

export function HalamanMasuk() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  const kirim = async (e: FormEvent) => {
    e.preventDefault();
    setGalat(null);
    if (!username.trim() || !password) {
      setGalat("Username dan password wajib diisi");
      return;
    }
    setProses(true);
    try {
      await masuk(username, password);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setProses(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Latar foto. scale-110 menutupi tepi yang menjadi transparan akibat blur. */}
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center blur-md"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      {/* Overlay hitam agar teks tetap terbaca di atas foto yang ramai */}
      <div aria-hidden className="absolute inset-0 bg-black/65" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground">
              EG
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Empal Gentong</h1>
              <p className="mt-1 text-sm text-white/70">Panel admin &amp; laporan. Masuk untuk melanjutkan.</p>
            </div>
          </div>

          <form onSubmit={kirim} className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="username" className="text-white/90">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={proses}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-white/40"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-white/90">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={proses}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-white/40"
              />
            </div>

            {galat ? (
              <p className="rounded-md border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {galat}
              </p>
            ) : null}

            <Button type="submit" disabled={proses} className="w-full">
              {proses ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
              {proses ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-white/60">
            Lupa password? Hubungi pemilik untuk mengatur ulang.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Rumah Makan Empal Gentong &middot; Sistem kasir &amp; laporan
        </p>
      </div>
    </div>
  );
}
