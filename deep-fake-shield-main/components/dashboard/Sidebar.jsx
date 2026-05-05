"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Image as image_icon, TestTube2, History, Plus, LogOut, FolderOpen, Heart } from "lucide-react";
import { clearSession } from "@/lib/api";

function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Gallery", href: "/dashboard", icon: image_icon },
    { name: "Albums", href: "/dashboard/albums", icon: FolderOpen },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "Analyze", href: "/dashboard/analyze", icon: TestTube2 },
    { name: "History", href: "/dashboard/history", icon: History },
  ];

  const handleLogout = () => {
    clearSession();
    router.push("/auth");
  };

  // Get user initial for avatar
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-700/30 bg-[#060e20]/60 px-4 py-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-10 px-2">
        <span className="block uppercase text-xl font-bold tracking-widest text-blue-100 font-headline">
          Verifai
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">
          Precision Lab
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-[#357df1]/10 text-[#adc6ff] border-r-2 border-[#357df1] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={
                  isActive
                    ? "text-[#adc6ff]"
                    : "group-hover:scale-110 transition-transform"
                }
              />
              <span className="text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 space-y-8">
        {pathname !== "/dashboard/analyze" && (
          <Link
            href={"/dashboard/analyze"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#adc6ff] to-[#357df1] py-3 px-4 font-bold text-[#002e6a] shadow-lg shadow-blue-500/10 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="text-xs uppercase tracking-widest">
              New Analysis
            </span>
          </Link>
        )}

        <div className="flex items-center gap-3 border-t border-slate-700/30 pt-6">
          {/* User avatar with initial */}
          <div className="h-10 w-10 overflow-hidden rounded-full bg-linear-to-br from-[#adc6ff] to-[#357df1] border border-white/10 flex items-center justify-center">
            <span className="text-sm font-black text-[#002e6a]">{initial}</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-white truncate">
              {user?.username || "User"}
            </span>
            <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-semibold">
              {user?.email ? user.email.split("@")[0] : "Authenticated"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-[#eb4141] transition-colors rounded-lg hover:bg-white/5"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
