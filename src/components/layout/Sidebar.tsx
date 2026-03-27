"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-smu-navy text-white flex flex-col shrink-0 border-r border-white/5">
      <nav className="flex-1 py-6 stagger-children">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = !item.external && pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200",
                isActive
                  ? "bg-smu-gold/10 text-smu-gold font-medium border-r-2 border-smu-gold"
                  : "text-white/50 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && "text-smu-gold")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-5 border-t border-white/8">
        <p className="text-[11px] text-white/30 leading-relaxed uppercase tracking-widest text-center">
          Singapore Management<br />University
        </p>
      </div>
    </aside>
  );
}
