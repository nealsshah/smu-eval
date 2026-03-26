import { SidebarItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
  sidebarItems?: SidebarItem[];
}

export function AppShell({ children, sidebarItems }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {sidebarItems && <Sidebar items={sidebarItems} />}
        <main className="flex-1 overflow-auto p-6 bg-smu-surface animate-content-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
