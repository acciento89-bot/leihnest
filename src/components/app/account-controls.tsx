"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AccountControls({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-5">
      <p className="truncate text-xs text-[var(--muted)]" title={email}>
        {email}
      </p>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="mt-3 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--surface-soft)] disabled:opacity-60"
      >
        {busy ? "Wird abgemeldet…" : "Abmelden"}
      </button>
    </div>
  );
}
