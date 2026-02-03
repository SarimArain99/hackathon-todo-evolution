/**
 * Protected Layout
 *
 * Layout for authenticated pages. Checks if user is authenticated
 * and redirects to sign-in if not.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get all cookies and format as Cookie header
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  // Check if user is authenticated using Better Auth server API
  // Wrap in try-catch to handle database connection errors gracefully
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: {
        cookie: allCookies,
      },
    });
  } catch (error) {
    // If Better Auth fails (e.g., database connection issue),
    // redirect to sign-in page which will handle the error
    console.error("Failed to get session:", error);
    redirect("/sign-in");
  }

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
