"use client";

import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="bg-smu-navy text-white h-14 flex items-center justify-between px-6 shrink-0 shadow-lg shadow-smu-navy/20">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-smu-gold rounded-full" />
        <h1 className="font-heading text-lg tracking-wide">
          Peer Evaluation System
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-smu-gold/20 border border-smu-gold/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-smu-gold" />
              </div>
              <span className="text-sm font-medium">{session.user.name}</span>
            </div>
            <div className="w-px h-5 bg-white/15" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-all duration-200 hover:gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">Log in</span>
          </div>
        )}
      </div>
    </header>
  );
}
