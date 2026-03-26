"use client";

import { useSession, signOut } from "next-auth/react";
import { User } from "lucide-react";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="bg-smu-navy text-white h-14 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold tracking-wide">
        Peer Evaluation System
      </h1>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">Log In</span>
          </div>
        )}
      </div>
    </header>
  );
}
