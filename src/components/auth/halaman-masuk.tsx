import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground">
            EG
          </span>
          <div>
            <CardTitle>Empal Gentong</CardTitle>
            <CardDescription>Panel admin &amp; laporan. Masuk untuk melanjutkan.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={kirim} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={proses}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={proses}
              />
            </div>

            {galat ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {galat}
              </p>
            ) : null}

            <Button type="submit" disabled={proses} className="w-full">
              {proses ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
              {proses ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Lupa password? Hubungi pemilik untuk mengatur ulang.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
