"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type LoginStep = "email" | "otp" | "success";

const OTP_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isInitialized,
    sendOtpToEmail,
    verifyOtp,
    resendOtp,
    resetAuthFlow,
    isOtpPending,
    pendingEmail,
    otpError,
    isSendingOtp,
    isVerifyingOtp,
    clearOtpError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("email");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setStep("success");
      const timer = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  // Sync step with OTP pending state
  useEffect(() => {
    if (isOtpPending && step === "email") {
      setStep("otp");
    }
  }, [isOtpPending, step]);

  // Focus OTP input when entering OTP step
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      await sendOtpToEmail(email);
      setStep("otp");
      setResendCooldown(60); // 60 second cooldown for resend
    } catch {
      setEmailError("Failed to send verification code. Please try again.");
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = useCallback(
    async (otpValue?: string) => {
      const codeToVerify = otpValue || otp;
      if (codeToVerify.length !== OTP_LENGTH) return;

      try {
        await verifyOtp(codeToVerify);
        // Success is handled by isAuthenticated effect
      } catch {
        // Error is handled by otpError state
      }
    },
    [otp, verifyOtp]
  );

  // WebOTP API for mobile autofill
  useEffect(() => {
    if (step !== "otp") return;

    // Check if WebOTP is supported
    if ("OTPCredential" in window) {
      const abortController = new AbortController();

      navigator.credentials
        .get({
          // @ts-expect-error - WebOTP API types not fully supported
          otp: { transport: ["sms"] },
          signal: abortController.signal,
        })
        .then((otpCredential) => {
          if (otpCredential && "code" in otpCredential) {
            const code = (otpCredential as { code: string }).code;
            setOtp(code);
            // Auto-submit if we got a full code
            if (code.length === OTP_LENGTH) {
              handleOtpSubmit(code);
            }
          }
        })
        .catch((err) => {
          // Silently handle abort or unsupported errors
          if (err.name !== "AbortError") {
            console.log("[WebOTP] Not available:", err.message);
          }
        });

      return () => {
        abortController.abort();
      };
    }
  }, [step, handleOtpSubmit]);

  // Handle OTP input change
  const handleOtpChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    clearOtpError();

    // Auto-submit when complete
    if (digits.length === OTP_LENGTH) {
      handleOtpSubmit(digits);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendOtp();
      setResendCooldown(60);
      setOtp("");
    } catch {
      // Error handled by context
    }
  };

  // Go back to email step
  const handleBack = () => {
    resetAuthFlow();
    setStep("email");
    setOtp("");
  };

  // Loading state while SDK initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
          <p className="text-grey-200 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-grey-650">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lava-orange/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-lava-purple/10 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Email Step */}
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm"
            >
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-lava-gradient flex items-center justify-center mb-4 shadow-lg lava-glow">
                  <Image
                    src="/lava-brand-kit/logos/logo-symbol-white.png"
                    alt="Lava"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Welcome to Lava
                </h1>
                <p className="text-grey-200 text-center">
                  Enter your email to get started
                </p>
              </div>

              {/* Login form */}
              <Card variant="glass" className="p-6">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {/* Email input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-grey-200 mb-2"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-200" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(null);
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-grey-550 border border-grey-425 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-grey-200 focus:outline-none focus:border-lava-orange transition-colors"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {emailError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-lava-red/10 border border-lava-red/20 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 text-lava-red flex-shrink-0" />
                      <p className="text-sm text-lava-red">{emailError}</p>
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={isSendingOtp || !email.trim()}
                    className="flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Terms */}
                <p className="text-xs text-grey-200 text-center mt-4">
                  By continuing, you agree to our{" "}
                  <a
                    href="https://lavanet.xyz/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lava-orange hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://lavanet.xyz/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lava-orange hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
              </Card>
            </motion.div>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm"
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-grey-200 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              {/* Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-lava-orange/20 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-lava-orange" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Check your email
                </h1>
                <p className="text-grey-200 text-center">
                  We sent a verification code to{" "}
                  <span className="text-white font-medium">{pendingEmail}</span>
                </p>
              </div>

              {/* OTP form */}
              <Card variant="glass" className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleOtpSubmit();
                  }}
                  className="space-y-4"
                >
                  {/* OTP input */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm text-grey-200 mb-2 text-center"
                    >
                      Enter verification code
                    </label>
                    <input
                      ref={otpInputRef}
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-grey-550 border border-grey-425 rounded-xl px-4 py-4 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-grey-425 placeholder:tracking-[0.5em] focus:outline-none focus:border-lava-orange transition-colors"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={OTP_LENGTH}
                      disabled={isVerifyingOtp}
                    />
                  </div>

                  {/* Error message */}
                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-lava-red/10 border border-lava-red/20 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 text-lava-red flex-shrink-0" />
                      <p className="text-sm text-lava-red">{otpError}</p>
                    </motion.div>
                  )}

                  {/* Verify button */}
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={isVerifyingOtp || otp.length !== OTP_LENGTH}
                    className="flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  {/* Resend code */}
                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-grey-200">
                        Resend code in{" "}
                        <span className="text-white">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSendingOtp}
                        className="text-sm text-lava-orange hover:underline disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>Resend code</span>
                      </button>
                    )}
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-grey-200">Setting up your wallet...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative p-4 text-center">
        <p className="text-xs text-grey-200">
          Secured by{" "}
          <a
            href="https://dynamic.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-grey-100 hover:text-white"
          >
            Dynamic
          </a>
        </p>
      </div>
    </div>
  );
}
