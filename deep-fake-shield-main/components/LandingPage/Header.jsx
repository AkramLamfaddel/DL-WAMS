"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { name: "Platform", href: "#hero" },
  { name: "Features", href: "#features" },
  { name: "Security", href: "#trust" },
];

const Header = () => {
  const [activeHash, setActiveHash] = useState("#hero");

  // Simple intersection observer or scroll listener could go here,
  // but for now, we'll update based on clicks.
  useEffect(() => {
    const handleHashChange = () =>
      setActiveHash(window.location.hash || "#hero");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl transition-all duration-300 ease-out border-b border-white/5">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto font-manrope tracking-tight">
        {/* Logo Section */}
        <Link
          href="/"
          className="text-xl uppercase font-bold tracking-[0.2em] text-[#adc6ff] hover:opacity-80 transition-opacity"
        >
          Verifai
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = activeHash === link.href;

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActiveHash(link.href)}
                className={`text-[13px] uppercase tracking-widest transition-all duration-300 ease-out pb-1 border-b-2 ${
                  isActive
                    ? "text-[#adc6ff] font-bold border-[#357df1]"
                    : "text-slate-400 font-medium border-transparent hover:text-white"
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/auth">
            <button className="text-slate-400 text-sm font-bold uppercase tracking-tighter hover:text-white transition-all px-4 py-2">
              Login
            </button>
          </Link>

          <Link href="/dashboard">
            <button className="bg-linear-to-br from-[#357df1] to-[#adc6ff] text-[#0b1326] text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(53,125,241,0.3)] active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
