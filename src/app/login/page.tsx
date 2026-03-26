import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    const role = session.user.role;
    if (role === "student") redirect("/student/dashboard");
    if (role === "professor") redirect("/professor/dashboard");
    if (role === "admin") redirect("/admin/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-smu-surface">
      {/* Top Nav */}
      <header className="bg-smu-navy text-white h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-semibold tracking-wide">
          Peer Evaluation System
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm">Log In</span>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4">
        <LoginForm />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-muted-foreground">
        &copy; SMU Peer Evaluation System
      </footer>
    </div>
  );
}
