/**
 * Zenith Dashboard - Server Entry
 * Handles authentication and system handshakes.
 */

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "./dashboard-shell";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: { cookie: allCookies },
    });
  } catch (error) {
    redirect("/sign-in");
  }

  if (!session) redirect("/sign-in");

  return (
    <DashboardShell user={session.user}>
      <DashboardClient />
    </DashboardShell>
  );
}