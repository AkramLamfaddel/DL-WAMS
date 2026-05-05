"use client";

import React, { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Fingerprint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  LockKeyhole,
  FileText,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { login, register, saveSession, isAuthenticated } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [isChecking, setIsChecking] = useState(true); // New state to prevent flash

  useEffect(() => {
    // Check if the token exists in localStorage
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      setIsChecking(false); // Only show the page if NOT authenticated
    }
  }, [router]);

  // Form state
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // ── Login ──
        const data = await login(form.username, form.password);
        saveSession(data.user, data.token);
        router.push("/dashboard");
      } else {
        // ── Register ──
        if (form.password !== form.password_confirm) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        const data = await register({
          username: form.username,
          email: form.email,
          password: form.password,
          password_confirm: form.password_confirm,
          first_name: form.first_name,
          last_name: form.last_name,
        });
        saveSession(data.user, data.token);
        router.push("/dashboard");
      }
    } catch (err) {
      if (err.data?.errors) {
        const msgs = Object.entries(err.data.errors).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
        );
        setError(msgs.join(" | "));
      } else if (err.data?.message) {
        setError(err.data.message);
      } else {
        setError(
          isLogin
            ? "Invalid credentials or service unavailable."
            : "Registration failed. Service may be unavailable."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#adc6ff]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-sans selection:bg-[#adc6ff]/30 selection:text-white antialiased overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#adc6ff]/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4edea3]/5 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(173,198,255,0.05)_0%,transparent_70%)]"></div>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-105 space-y-8">
          {/* Branding Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#adc6ff] to-[#357df1] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Fingerprint
                  className="text-[#002e6a]"
                  size={32}
                  strokeWidth={2}
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl uppercase font-bold tracking-tight text-white font-headline">
                Verifai
              </h1>
              <p className="text-[#c6c6cd] text-sm font-medium opacity-80 mt-2">
                {isLogin
                  ? "Welcome back! Please log in to your account."
                  : "Create an account to get started."}
              </p>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-[#222a3d]/60 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-8">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-[#eb4141]/10 border border-[#eb4141]/20 rounded-xl text-sm text-[#ff8a8a]">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Register-only fields */}
              {!isLogin && (
                <>
                  {/* First Name / Last Name row */}
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label
                        className="block text-xs font-semibold text-[#c6c6cd] ml-1"
                        htmlFor="first_name"
                      >
                        First Name
                      </label>
                      <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                        <User
                          className="absolute left-4 text-[#909097]"
                          size={18}
                        />
                        <input
                          className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                          id="first_name"
                          placeholder="First name"
                          type="text"
                          value={form.first_name}
                          onChange={set("first_name")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className="block text-xs font-semibold text-[#c6c6cd] ml-1"
                        htmlFor="last_name"
                      >
                        Last Name
                      </label>
                      <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                        <User
                          className="absolute left-4 text-[#909097]"
                          size={18}
                        />
                        <input
                          className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                          id="last_name"
                          placeholder="Last name"
                          type="text"
                          value={form.last_name}
                          onChange={set("last_name")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label
                      className="block text-xs font-semibold text-[#c6c6cd] ml-1"
                      htmlFor="email"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                      <Mail
                        className="absolute left-4 text-[#909097]"
                        size={18}
                      />
                      <input
                        className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                        id="email"
                        placeholder="email@example.com"
                        type="email"
                        required
                        value={form.email}
                        onChange={set("email")}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Username */}
              <div className="space-y-2 group">
                <label
                  className="block text-xs font-semibold text-[#c6c6cd] ml-1"
                  htmlFor="username"
                >
                  Username
                </label>
                <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                  <User
                    className="absolute left-4 text-[#909097]"
                    size={18}
                  />
                  <input
                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                    id="username"
                    placeholder="Enter your username"
                    type="text"
                    required
                    autoFocus
                    value={form.username}
                    onChange={set("username")}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="block text-xs font-semibold text-[#c6c6cd]"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-xs font-medium text-[#adc6ff]/70 hover:text-[#adc6ff] transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                  <Lock
                    className="absolute left-4 text-[#909097]"
                    size={18}
                  />
                  <input
                    className="w-full bg-transparent border-none py-4 pl-12 pr-12 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                    id="password"
                    placeholder="••••••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={set("password")}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#45464d] hover:text-[#c6c6cd] transition-colors"
                    type="button"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register Only) */}
              {!isLogin && (
                <div className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                  <label
                    className="block text-xs font-semibold text-[#c6c6cd] ml-1"
                    htmlFor="password_confirm"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center bg-[#060e20] rounded-xl border border-[#45464d]/30 transition-all duration-300 focus-within:border-[#adc6ff]/40">
                    <Lock
                      className="absolute left-4 text-[#909097]"
                      size={18}
                    />
                    <input
                      className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#dae2fd] placeholder:text-[#45464d]/60 focus:ring-0 text-sm focus:outline-none"
                      id="password_confirm"
                      placeholder="Repeat password"
                      type="password"
                      required
                      minLength={6}
                      value={form.password_confirm}
                      onChange={set("password_confirm")}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center py-4 bg-linear-to-br from-[#adc6ff] to-[#357df1] text-[#002e6a] font-bold rounded-xl overflow-hidden shadow-xl transition-all active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <span className="relative z-10 text-sm font-bold">
                    {isLogin ? "Sign In" : "Create Account"}
                  </span>
                )}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            {/* Switch Mode Section */}
            <div className="pt-2 text-center">
              <button
                onClick={toggleMode}
                className="text-sm font-medium text-[#c6c6cd] hover:text-white transition-all flex items-center justify-center gap-2 w-full group"
              >
                <span>
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </span>
                <span className="text-[#adc6ff] flex items-center gap-1 group-hover:gap-2 transition-all">
                  {isLogin ? "Sign up" : "Log in"}
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="text-center">
            <p className="text-[11px] text-[#45464d] font-medium tracking-wide">
              Securely encrypted by Verifai Security
            </p>
            <div className="mt-8 flex justify-center gap-6 opacity-20">
              <ShieldCheck size={16} />
              <LockKeyhole size={16} />
              <FileText size={16} />
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Status Indicator */}
      <div className="fixed bottom-8 left-8 hidden lg:block z-20">
        <div className="flex items-center gap-3 bg-[#131b2e]/40 border border-[#45464d]/20 p-3 px-4 rounded-2xl backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]"></div>
          <div className="text-[10px] font-bold text-white uppercase tracking-wider">
            System Online
          </div>
        </div>
      </div>
    </div>
  );
}
