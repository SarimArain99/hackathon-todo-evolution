/**
 * Assistant page — server entry.
 *
 * Protected by the (protected) layout, same as the dashboard. The page
 * loads the session, then renders the shared shell (with the Assistant
 * nav item active) and the chat client, which loads history from
 * /api/chat.
 */

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "../dashboard/dashboard-shell";
import ChatClient from "./chat-client";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
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
    <DashboardShell
      user={session.user}
      title="Assistant"
      subtitle="Ask about your tasks, or ask the Assistant to add one for you."
      activeNav="chat"
    >
      <ChatClient />
    </DashboardShell>
  );
}
