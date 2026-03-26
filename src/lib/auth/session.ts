import { getServerSession } from "next-auth";
import { authOptions, UserRole } from "./auth-options";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(role?: UserRole) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (role && session.user.role !== role) {
    redirect("/login");
  }
  return session;
}
