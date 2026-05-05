"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { clearSession } from "@/lib/api";

function Header({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/auth");
  };

  return (
    <header className="fixed top-0 right-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between bg-[#0b1326]/80 px-8 backdrop-blur-md font-headline">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="uppercase text-sm font-black text-white tracking-[0.2em]">
          Verifai
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 text-[#adc6ff]">
        {/* User info */}
        {user && (
          <span className="text-xs font-bold text-slate-400">
            {user.username}
          </span>
        )}

        {/* Profile */}
        <button className="opacity-80 hover:opacity-100 transition-opacity">
          <User size={20} />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="opacity-80 hover:opacity-100 transition-opacity text-[#eb4141]"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-800/50 to-transparent"></div>
    </header>
  );
}

export default Header;
