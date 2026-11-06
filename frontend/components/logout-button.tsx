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
      className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-hover-bg hover:text-foreground disabled:opacity-50 sm:px-4"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
    </button>
  );
}
