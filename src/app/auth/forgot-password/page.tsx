"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthField, AuthShell, authStyles as s } from "@/components/auth/AuthShell";
import { useClerk, useAuth } from "@clerk/nextjs";

export default function ForgotPassword() {
  const clerk = useClerk();
  const signIn = clerk?.client?.signIn;
  const isLoaded = !!signIn;
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [authLoaded, isSignedIn, router]);

  const [step, setStep] = useState<"email" | "verify">("email");
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (!emailAddress.trim()) {
      setError("Please enter your work email.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await (signIn as any).create({
        strategy: "reset_password_email_code",
        identifier: emailAddress.trim(),
      });
      setStep("verify");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const clerkErr = err?.errors?.[0];
      if (clerkErr?.code === "form_identifier_not_found") {
        setError("No account found with this email. Please check your email or sign up.");
      } else {
        setError(clerkErr?.longMessage || clerkErr?.message || err?.message || "Could not send reset code. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (!code.trim() || code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });

      if (result.status === "complete") {
        setSuccess(true);
        if (result.createdSessionId) {
          await clerk.setActive({ session: result.createdSessionId });
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setError("Password reset requires additional verification. Please contact support.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      const clerkErr = err?.errors?.[0];
      setError(clerkErr?.longMessage || clerkErr?.message || err?.message || "Failed to reset password. Please verify the code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signIn) return;
    try {
      setError("");
      setCode("");
      await (signIn as any).create({
        strategy: "reset_password_email_code",
        identifier: emailAddress.trim(),
      });
    } catch {
      setError("Could not resend code. Please try again in a few moments.");
    }
  };

  if (step === "verify") {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="Create new password"
        subtitle={`Enter the 6-digit code sent to ${emailAddress} and choose a new secure password.`}
        asideTitle="Secure access without slowing people down."
      >
        <div style={{ width: 50, height: 50, borderRadius: 13, background: "var(--primary-tint)", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: 22 }}>
          <KeyRound size={24} />
        </div>

        {error && (
          <div className={s.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 14px", color: "#15803D", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckCircle2 size={18} />
            <div>Password updated successfully! Signing you in...</div>
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <AuthField label="6-Digit Reset Code">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </AuthField>

          <AuthField label="New password">
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#686268", display: "grid", placeItems: "center", padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </AuthField>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 20 }}>
            <span style={{ color: "var(--text-4)" }}>Didn't receive code?</span>
            <button type="button" onClick={handleResend} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", padding: 0 }}>
              Resend code
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={s.primaryButton}
            style={{ width: "100%", opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Updating password...
              </>
            ) : (
              <>
                Update password & Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className={s.switch} style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setStep("email")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "inherit" }}
          >
            <ArrowLeft size={13} style={{ verticalAlign: "middle" }} /> Back to change email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter your work email and we’ll send you a secure 6-digit recovery code."
      asideTitle="Secure access without slowing people down."
    >
      <div style={{ width: 50, height: 50, borderRadius: 13, background: "var(--primary-tint)", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: 22 }}>
        <Mail size={24} />
      </div>

      {error && (
        <div className={s.errorAlert}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSendCode}>
        <AuthField label="Work email">
          <input
            type="email"
            placeholder="you@company.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            required
          />
        </AuthField>

        <button
          type="submit"
          disabled={isSubmitting}
          className={s.primaryButton}
          style={{ width: "100%", marginTop: 8, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending reset code...
            </>
          ) : (
            <>
              Send recovery code <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className={s.switch} style={{ marginTop: 24 }}>
        <Link href="/auth/sign-in">
          <ArrowLeft size={13} style={{ verticalAlign: "middle" }} /> Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
