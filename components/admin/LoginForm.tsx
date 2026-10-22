"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { loginAction, type AdminResult } from "@/lib/admin/actions";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(loginAction, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-medium text-forest-900" htmlFor="admin-password">
        Admin password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="h-12 w-full rounded-xl border border-forest-200 bg-white px-4 text-base outline-none focus:border-forest-500 focus:ring-2 focus:ring-leaf-300"
      />
      {state && !state.ok && (
        <p role="alert" className="text-sm font-medium text-crit-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
        Sign in
      </Button>
    </form>
  );
}
