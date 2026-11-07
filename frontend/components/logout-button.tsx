"use client";

import { signOut } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={isLoggingOut ? "Logging out…" : "Log out"}
      className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-surface px-2.5 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-hover-bg hover:text-foreground disabled:opacity-50 sm:px-4"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      {/* Icon-only on small screens: the "Log out" label is ~60px the
          header cannot spare below the sm breakpoint. */}
      <span className="hidden sm:inline">{isLoggingOut ? "Logging out…" : "Log out"}</span>
    </button>
  );
}
