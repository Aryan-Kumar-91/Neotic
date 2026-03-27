"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  User, Phone, Calendar, Sun, Moon
} from "lucide-react";
import StarBackground from "../../components/StarBackground";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    try {
      const t = localStorage.getItem("noetic_theme");
      if (t === "dark") setIsDarkMode(true);
    } catch {}
    setIsLoaded(true);
  }, []);

  // Sync theme
  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, isLoaded]);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign-up only fields
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetExtraFields = () => {
    setFullName(""); setDob(""); setPhone("");
    setError(null); setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              date_of_birth: dob,
              phone_number: phone,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage("Account created! Check your email for a confirmation link.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Strict Design System Colors matching main app
  const theme = {
    bgApp: isDarkMode ? "bg-[#131314]" : "bg-[#FFFFFF]",
    bgModule: isDarkMode ? "bg-[#1E1E20]" : "bg-[#F0F4F9]",
    bgInput: isDarkMode ? "bg-[#1E1E20]" : "bg-transparent",
    
    textPrimary: isDarkMode ? "text-[#E3E3E3]" : "text-[#1F1F1F]",
    textSecondary: isDarkMode ? "text-[#C4C7C5]" : "text-[#444746]",
    textMuted: isDarkMode ? "text-[#C4C7C5]/60" : "text-[#444746]/60",
    
    borderMain: isDarkMode ? "border-[#1E1E20]" : "border-[#E3E3E3]",
    borderFocus: isDarkMode ? "focus-within:border-blue-500/40" : "focus-within:border-blue-500/30",
    
    hoverBg: isDarkMode ? "hover:bg-[#1E1E20]/80" : "hover:bg-[#E3E3E3]/50",
    activeBg: isDarkMode ? "active:bg-[#1E1E20]" : "active:bg-[#E3E3E3]",
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-blue-500/30 transition-colors duration-500 ${theme.bgApp}`}>
      {isDarkMode && <StarBackground />}
      
      {/* Theme Toggle Button positioned at top right */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className={`p-2 rounded-md ${theme.textSecondary} ${theme.hoverBg} transition-colors bg-opacity-70 backdrop-blur-md`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className={`${theme.bgModule} bg-opacity-95 backdrop-blur-xl border ${theme.borderMain} rounded-2xl shadow-2xl p-8 transition-colors duration-500`}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>Neotic</h1>
            <p className={`text-sm mt-1 ${theme.textSecondary}`}>
              {mode === "signin" ? "Sign in to continue reasoning" : "Create your account"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-[#F0F4F9] dark:bg-[#131314] rounded-lg p-1 mb-6 border border-[#E3E3E3] dark:border-[#1E1E20] transition-colors duration-500">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); resetExtraFields(); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === m
                    ? "bg-white dark:bg-[#1E1E20] text-[#1F1F1F] dark:text-[#E3E3E3] shadow-sm border border-[#E3E3E3] dark:border-[#333]"
                    : "text-[#444746] dark:text-[#C4C7C5]/70 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ── Sign-up only fields ─────────────────────────────── */}
            {mode === "signup" && (
              <>
                {/* Full Name */}
                <div className={`relative group ${theme.borderFocus} transition-colors duration-300`}>
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-blue-500/70 transition-colors z-10`} />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'} outline-none transition-all duration-200 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]`}
                  />
                </div>

                {/* Date of Birth */}
                <div className={`relative group ${theme.borderFocus} transition-colors duration-300`}>
                  <Calendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-blue-500/70 transition-colors z-10 pointer-events-none`} />
                  <input
                    type="date"
                    placeholder="Date of birth"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'} outline-none transition-all duration-200 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] ${isDarkMode ? '[color-scheme:dark]' : ''}`}
                  />
                </div>

                {/* Phone */}
                <div className={`relative group ${theme.borderFocus} transition-colors duration-300`}>
                  <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-blue-500/70 transition-colors z-10`} />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    pattern="[+]?[0-9\s\-()]{7,20}"
                    title="Enter a valid phone number"
                    className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'} outline-none transition-all duration-200 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]`}
                  />
                </div>
              </>
            )}

            {/* ── Shared fields ───────────────────────────────────── */}
            {/* Email */}
            <div className={`relative group ${theme.borderFocus} transition-colors duration-300`}>
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-blue-500/70 transition-colors z-10`} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'} outline-none transition-all duration-200 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]`}
              />
            </div>

            {/* Password */}
            <div className={`relative group ${theme.borderFocus} transition-colors duration-300`}>
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-blue-500/70 transition-colors z-10`} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-12 py-3 text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'} outline-none transition-all duration-200 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textPrimary} transition-colors z-10`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-[13px] px-4 py-3 rounded-xl mt-2">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] px-4 py-3 rounded-xl mt-2">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F1F1F] hover:bg-[#333] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white/70" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>
          </form>

          <p className={`text-center text-xs ${theme.textMuted} mt-6`}>
            By continuing you agree to Neotic&apos;s{" "}
            <a href="/privacy" className={`underline hover:text-blue-500 transition-colors`}>
              Privacy Policy
            </a>
          </p>
        </div>

        <p className={`text-center text-[11px] font-medium mt-4 ${theme.textMuted} tracking-wide uppercase`}>
          Neotic AI Reasoning Platform &mdash; Chain-of-Thought
        </p>
      </div>
    </div>
  );
}
