"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, googleProvider, githubProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signInWithPopup,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  type MultiFactorResolver,
  type AuthError,
  type MultiFactorError
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Phone,
  Calendar,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import StarBackground from "../../components/StarBackground";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auth/MFA State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA Flow State
  const [showMfa, setShowMfa] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("noetic_theme");
      if (t === "dark") setIsDarkMode(true);
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !showMfa) {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, showMfa]);

  useEffect(() => {
    if (isLoaded)
      localStorage.setItem("noetic_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, isLoaded]);

  const resetExtraFields = () => {
    setFullName(""); setDob(""); setPhone("");
    setError(null);
    setShowMfa(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "GitHub sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver) return;
    setMfaLoading(true);
    setError(null);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, otp);
      const mfaAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(mfaAssertion);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: fullName });
        await setDoc(doc(db, "users", user.uid), {
          fullName, dateOfBirth: dob, phoneNumber: phone, email,
          createdAt: new Date().toISOString(),
        });
        router.push("/");
      }
    } catch (err: unknown) {
      const authErr = err as AuthError;
      if (authErr.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err as MultiFactorError);
        setMfaResolver(resolver);
        
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        const phoneInfoOptions = { multiFactorHint: resolver.hints[0], session: resolver.session };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const vId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
        
        setVerificationId(vId);
        setShowMfa(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

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
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-blue-500/30 transition-colors duration-500 ${theme.bgApp}`}>
      {isDarkMode && <StarBackground />}
      <div id="recaptcha-container"></div>
      
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-md ${theme.textSecondary} ${theme.hoverBg} transition-colors bg-opacity-70 backdrop-blur-md`}>
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className={`${theme.bgModule} bg-opacity-95 backdrop-blur-xl border ${theme.borderMain} rounded-2xl shadow-2xl p-8 transition-colors duration-500`}>
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>Neotic</h1>
            <p className={`text-sm mt-1 ${theme.textSecondary}`}>
              {showMfa ? "Two-Factor Authentication" : mode === "signin" ? "Sign in to continue reasoning" : "Create your account"}
            </p>
          </div>

          {!showMfa ? (
            <>
              {/* Auth Mode Toggle */}
              <div className="flex bg-[#F0F4F9] dark:bg-[#131314] rounded-lg p-1 mb-6 border border-[#E3E3E3] dark:border-[#1E1E20]">
                {(["signin", "signup"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setMode(m); resetExtraFields(); }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${mode === m ? "bg-white dark:bg-[#1E1E20] text-[#1F1F1F] dark:text-[#E3E3E3] shadow-sm border border-[#E3E3E3] dark:border-[#333]" : "text-[#444746] dark:text-[#C4C7C5]/70"}`}>
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Social Login */}
              <div className="flex gap-4 mb-6">
                <button onClick={handleGoogleSignIn} disabled={loading} className={`flex-1 flex items-center justify-center py-3 rounded-xl border ${theme.borderMain} ${theme.hoverBg} transition-all`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </button>
                <button onClick={handleGithubSignIn} disabled={loading} className={`flex-1 flex items-center justify-center py-3 rounded-xl border ${theme.borderMain} ${theme.hoverBg} transition-all`}>
                  <svg className={`w-5 h-5 ${theme.textPrimary}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme.borderMain}`}></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className={`px-2 ${theme.bgModule} ${theme.textMuted}`}>Or continue with email</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <>
                    <div className={`relative group ${theme.borderFocus}`}>
                      <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                      <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none transition-all focus:border-blue-500/50`} />
                    </div>
                    <div className={`relative group ${theme.borderFocus}`}>
                      <Calendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                      <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none transition-all focus:border-blue-500/50`} />
                    </div>
                    <div className={`relative group ${theme.borderFocus}`}>
                      <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                      <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none transition-all focus:border-blue-500/50`} />
                    </div>
                  </>
                )}
                <div className={`relative group ${theme.borderFocus}`}>
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none transition-all focus:border-blue-500/50`} />
                </div>
                <div className={`relative group ${theme.borderFocus}`}>
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`w-full ${theme.bgInput} border ${theme.borderMain} rounded-xl pl-10 pr-12 py-3 text-[15px] outline-none transition-all focus:border-blue-500/50`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textPrimary}`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && <div className="text-red-500 text-xs px-2">{error}</div>}
                
                <button type="submit" disabled={loading} className="w-full bg-[#1F1F1F] dark:bg-blue-600 text-white font-medium py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === "signin" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          ) : (
            /* MFA UI */
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500"><ShieldCheck className="w-8 h-8" /></div>
                <p className={`text-sm text-center ${theme.textSecondary}`}>Enter the verification code sent to your phone</p>
              </div>
              <div className={`relative group ${theme.borderFocus}`}>
                <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required className={`w-full text-center tracking-[1em] font-bold ${theme.bgInput} border ${theme.borderMain} rounded-xl py-4 text-xl outline-none transition-all focus:border-blue-500`} />
              </div>
              {error && <div className="text-red-500 text-xs text-center">{error}</div>}
              <button type="submit" disabled={mfaLoading} className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2">
                {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
              </button>
              <button type="button" onClick={() => setShowMfa(false)} className={`w-full text-sm ${theme.textMuted} hover:${theme.textPrimary}`}>Back to Login</button>
            </form>
          )}

          <p className={`text-center text-xs ${theme.textMuted} mt-6`}>
            By continuing you agree to Neotic&apos;s <a href="/privacy" className="underline hover:text-blue-500">Privacy Policy</a>
          </p>
        </div>
        <p className={`text-center text-[11px] font-medium mt-4 ${theme.textMuted} tracking-wide uppercase`}>Neotic AI Reasoning Platform &mdash; Chain-of-Thought</p>
      </div>
    </div>
  );
}
