"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/api";

// Components
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth");
      return;
    }
    setUser(getUser());
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#adc6ff] animate-pulse" />
          <span className="text-[10px] font-black text-[#adc6ff] tracking-[0.2em] uppercase">
            Initializing Verifai…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-body selection:bg-[#adc6ff]/30 selection:text-white antialiased">
      {/* Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Header - Desktop */}
      <Header user={user} />

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen pt-24 px-8 pb-12">{children}</main>
    </div>
  );
}
