"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { registerUser, ApiAuthError } from "@/lib/api/auth";
import { getStoredAuthToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (getStoredAuthToken()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailTrim = email.trim();

    if (!emailTrim) {
      setError("Email address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({ email: emailTrim, password });
      setSuccess("Account created successfully. You can now sign in.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
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

      {/* Main register content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 bg-[#ff9900] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#232f3e] font-black text-base tracking-tighter">aws</span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">Create account</h1>
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

              {/* Success banner */}
              {success && (
                <div className="mb-5 border border-[#1d8102] bg-[#f2f8fd] rounded-[2px] p-3 flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1d8102] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#16191f] leading-relaxed">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-semibold text-[#16191f] mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                      if (success) setSuccess(null);
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
                <div className="mb-4">
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-semibold text-[#16191f] mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                        if (success) setSuccess(null);
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

                {/* Confirm Password */}
                <div className="mb-6">
                  <label
                    htmlFor="register-confirm-password"
                    className="block text-xs font-semibold text-[#16191f] mb-1"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                        if (success) setSuccess(null);
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
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#545b64] hover:text-[#16191f] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
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
                  disabled={isSubmitting || success !== null}
                  className="w-full py-2 px-4 text-sm font-semibold rounded-[2px] text-white
                    bg-[#ec7211] hover:bg-[#eb5f07] active:bg-[#d45e07]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </form>
              
              <div className="mt-5 text-center text-[11px] text-[#545b64]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#0972d3] hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-8 py-4 border-t border-[#eaeded] bg-[#fafafa] rounded-b-[4px]">
              <p className="text-[11px] text-[#545b64] text-center leading-relaxed">
                By creating an account you agree to the{" "}
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