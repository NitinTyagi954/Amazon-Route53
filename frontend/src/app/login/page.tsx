"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginUser, ApiAuthError } from "@/lib/api/auth";
import { setStoredAuthToken, getStoredAuthToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (getStoredAuthToken()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser({ email: email.trim(), password });
      setStoredAuthToken(result.token, true);
      router.push("/");
    } catch (err: any) {
      if (err instanceof ApiAuthError) {
        setError(err.message);
      } else {
        setError(err?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsDemoSubmitting(true);
    try {
      const result = await loginUser({ email: "demo@route53.local", password: "Demo@12345" });
      setStoredAuthToken(result.token, true);
      router.push("/");
    } catch (err: any) {
      if (err instanceof ApiAuthError) {
        setError(err.message);
      } else {
        setError(err?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#232f3e] flex flex-col">
      {/* AWS-style top bar */}
      <div className="bg-[#232f3e] border-b border-[#37475a] px-6 py-3 flex items-center gap-3">
        {/* AWS logo area */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ff9900] rounded-sm flex items-center justify-center">
            <span className="text-[#232f3e] font-black text-xs tracking-tighter">aws</span>
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">
            AWS Management Console
          </span>
        </div>
      </div>

      {/* Main login content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 bg-[#ff9900] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#232f3e] font-black text-base tracking-tighter">aws</span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
            <p className="text-sm text-[#aab7b8]">Route 53 Management Console</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[4px] shadow-xl">
            {/* Card header stripe */}
            <div className="h-1 bg-[#ff9900] rounded-t-[4px]" />

            <div className="px-8 py-7">
              {/* Error banner */}
              {error && (
                <div className="mb-5 border border-[#d13212] bg-[#fdf3f1] rounded-[2px] p-3 flex gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#d13212] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#16191f] leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-[#16191f] mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isSubmitting}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-sm border border-[#879596] rounded-[2px] outline-none
                      focus:ring-2 focus:ring-[#0972d3] focus:border-[#0972d3]
                      text-[#16191f] placeholder-gray-400 transition-colors
                      disabled:bg-[#f2f3f3] disabled:cursor-not-allowed"
                    aria-required="true"
                  />
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#16191f] mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={isSubmitting}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 text-sm border border-[#879596] rounded-[2px] outline-none
                        focus:ring-2 focus:ring-[#0972d3] focus:border-[#0972d3]
                        text-[#16191f] placeholder-gray-400 transition-colors
                        disabled:bg-[#f2f3f3] disabled:cursor-not-allowed"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#545b64] hover:text-[#16191f] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 text-sm font-semibold rounded-[2px] text-white
                    bg-[#ec7211] hover:bg-[#eb5f07] active:bg-[#d45e07]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                {/* Demo Login */}
                <div className="mt-4 pt-4 border-t border-[#eaeded]">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isSubmitting || isDemoSubmitting}
                    className="w-full py-2 px-4 text-sm font-semibold rounded-[2px] text-[#16191f]
                      bg-white border border-[#545b64] hover:bg-[#fafafa] active:bg-[#f2f3f3]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-colors flex items-center justify-center gap-2"
                  >
                    {isDemoSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isDemoSubmitting ? "Signing in to demo..." : "Try Demo Account"}
                  </button>
                </div>
              </form>
              
              <div className="mt-5 text-center text-[11px] text-[#545b64]">
                Don't have an account?{" "}
                <Link href="/register" className="text-[#0972d3] hover:underline font-medium">
                  Create account
                </Link>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-8 py-4 border-t border-[#eaeded] bg-[#fafafa] rounded-b-[4px]">
              <p className="text-[11px] text-[#545b64] text-center leading-relaxed">
                By signing in you agree to the{" "}
                <span className="text-[#0972d3]">AWS Customer Agreement</span>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-[#aab7b8] mt-6">
            &copy; {new Date().getFullYear()}, Amazon Web Services, Inc. or its affiliates.
          </p>
        </div>
      </div>
    </div>
  );
}
