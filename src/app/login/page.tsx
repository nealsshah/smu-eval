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
    <div className="flex flex-col min-h-screen bg-smu-navy relative overflow-hidden">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Gold accent line at top */}
      <div className="h-1 bg-gradient-to-r from-smu-gold via-smu-gold to-transparent shrink-0" />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md animate-fade-up">
          {/* Branding above card */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-1 h-8 bg-smu-gold rounded-full" />
              <span className="text-white/40 text-xs uppercase tracking-[0.2em] font-medium">
                Singapore Management University
              </span>
            </div>
            <h1 className="font-heading text-4xl text-white tracking-tight">
              Peer Evaluation
            </h1>
            <p className="text-white/40 text-sm mt-2">
              Rate and review your team members
            </p>
          </div>

          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-white/20 relative z-10">
        &copy; {new Date().getFullYear()} SMU Peer Evaluation System
      </footer>
    </div>
  );
}
