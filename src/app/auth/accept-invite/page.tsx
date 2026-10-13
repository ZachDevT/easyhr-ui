"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  LogOut,
} from "lucide-react";
import { AuthField, AuthShell, authStyles as s } from "@/components/auth/AuthShell";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { API_BASE_URL, getWorkspaceSubdomain } from "@/lib/api";

interface InvitationInfo {
  valid: boolean;
  error?: string;
  email?: string;
  name?: string;
  role?: string;
  organizationName?: string;
  subdomain?: string;
  brandColor?: string;
  logoUrl?: string;
}

function AcceptInviteContent() {
  const clerk = useClerk();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user: currentUser } = useUser();
  const signUp = clerk?.client?.signUp;
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get("token") || "";
  const redirectUrl = searchParams.get("redirect_url") || "/my-onboarding";

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [roleTitle, setRoleTitle] = useState("Team Member");
  const [companyName, setCompanyName] = useState("EasyHR Workspace");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // 1. Verify invitation token on load
  useEffect(() => {
    if (!tokenParam) {
      setIsValidating(false);
      setValidationError("An invitation security token is required to set up your account. Please check your invitation email.");
      return;
    }

    let isMounted = true;
    async function verifyToken() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/invitation?token=${encodeURIComponent(tokenParam)}`);
        const data: InvitationInfo = await res.json();

        if (!isMounted) return;

        if (!data.valid) {
          setValidationError(data.error || "This invitation link is invalid or has expired.");
          setInvitation(data);
        } else {
          setInvitation(data);
          setEmailAddress(data.email || "");
          const names = (data.name || "").trim().split(" ");
          setFirstName(names[0] || "");
          setLastName(names.slice(1).join(" ") || "");
          if (data.role) setRoleTitle(data.role);
          if (data.organizationName) setCompanyName(data.organizationName);
        }
      } catch (err) {
        if (!isMounted) return;
        setValidationError("Could not connect to verify your invitation. Please check your connection and refresh.");
      } finally {
        if (isMounted) setIsValidating(false);
      }
    }

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [tokenParam]);

  // If already signed in, check if matching email
  useEffect(() => {
    if (authLoaded && isSignedIn && invitation?.valid && emailAddress) {
      const currentEmail = currentUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
      if (currentEmail === emailAddress.toLowerCase()) {
        // Automatically sync provision with token and enter portal
        clerk.session?.getToken().then((jwt) => {
          if (jwt) {
            fetch(`${API_BASE_URL}/api/v1/auth/provision`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstName,
                lastName,
                email: emailAddress,
                invitationToken: tokenParam,
              }),
            }).finally(() => {
              router.replace(redirectUrl);
            });
          } else {
            router.replace(redirectUrl);
          }
        });
      }
    }
  }, [authLoaded, isSignedIn, invitation, emailAddress, currentUser, clerk.session, firstName, lastName, tokenParam, redirectUrl, router]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please provide both your first name and last name.");
      return;
    }
    if (!emailAddress.trim()) {
      setError("Email address is required.");
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

    setError("");
    setIsSubmitting(true);

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: emailAddress.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Account activation error:", err);
      const clerkErr = err?.errors?.[0];
      if (clerkErr?.code === "form_identifier_exists") {
        setError(
          "An account with this email already exists. Please sign in with your password to access your portal."
        );
      } else {
        setError(
          clerkErr?.longMessage ||
            clerkErr?.message ||
            err?.message ||
            "Could not activate account. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    setError("");

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    if (code.length < 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (result.status === "complete" && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId });

        // Synchronize account with backend, passing the verified invitation token
        try {
          const token = await clerk.session?.getToken();
          if (token) {
            await fetch(`${API_BASE_URL}/api/v1/auth/provision`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: emailAddress.trim(),
                invitationToken: tokenParam,
              }),
            });
          }
        } catch (provErr) {
          console.warn("Auto-provision note:", provErr);
        }

        router.push(redirectUrl);
        return;
      }

      setError("Verification code did not complete setup. Status: " + result.status);
    } catch (err: any) {
      console.error("Verification error:", err);
      const clerkErr = err?.errors?.[0];
      setError(clerkErr?.longMessage || clerkErr?.message || "Invalid verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // State A: Validating token
  if (isValidating) {
    return (
      <AuthShell
        eyebrow="Security verification"
        title="Checking invitation"
        subtitle="Verifying your workspace access link..."
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <RefreshCw
            size={32}
            className="animate-spin"
            style={{ color: "var(--primary, #7c3aed)", margin: "0 auto 16px" }}
          />
          <p style={{ fontSize: 14, color: "var(--text-3, #6b7280)" }}>
            Validating security credentials...
          </p>
        </div>
      </AuthShell>
    );
  }

  // State B: Invalid, expired, or missing token
  if (validationError) {
    const isAlreadyAccepted = validationError.toLowerCase().includes("already been accepted");

    return (
      <AuthShell
        eyebrow="Invitation status"
        title={isAlreadyAccepted ? "Invitation Already Accepted" : "Invalid Invitation Link"}
        subtitle="We could not verify your invitation access link."
      >
        <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: isAlreadyAccepted ? "#EFF6FF" : "#FEE2E2",
              color: isAlreadyAccepted ? "#2563EB" : "#DC2626",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            {isAlreadyAccepted ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
          </div>

          <p style={{ fontSize: 14.5, color: "#374151", lineHeight: 1.5, marginBottom: 24 }}>
            {validationError}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={`/auth/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className={s.primaryButton}
              style={{ justifyContent: "center", textDecoration: "none" }}
            >
              <span>Go to Sign In</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // State C: User is currently signed in under a DIFFERENT email
  if (
    authLoaded &&
    isSignedIn &&
    currentUser?.primaryEmailAddress?.emailAddress &&
    currentUser.primaryEmailAddress.emailAddress.toLowerCase() !== emailAddress.toLowerCase()
  ) {
    return (
      <AuthShell
        eyebrow="Account mismatch"
        title="Different Account Detected"
        subtitle="You are currently signed in with a different account."
      >
        <div style={{ padding: "8px 0 20px" }}>
          <div className={s.errorBanner} style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            <span>
              Signed in as <strong>{currentUser.primaryEmailAddress.emailAddress}</strong>, but this invite is for <strong>{emailAddress}</strong>.
            </span>
          </div>

          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 24 }}>
            To activate this workspace profile, please sign out and continue using the invitation link.
          </p>

          <button
            type="button"
            className={s.primaryButton}
            onClick={() => clerk.signOut().then(() => window.location.reload())}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <LogOut size={16} />
            <span>Sign Out & Continue Invitation</span>
          </button>
        </div>
      </AuthShell>
    );
  }

  // State D: Verification OTP code entry
  if (pendingVerification) {
    return (
      <AuthShell
        eyebrow="Verify email"
        title="Check your inbox"
        subtitle={`We sent a 6-digit code to ${emailAddress}. Enter it below to activate your account.`}
        asideTitle="Welcome to your new team."
      >
        <form onSubmit={handleVerifyCode} className={s.form}>
          {error && (
            <div className={s.errorAlert}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {resendSuccess && (
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #86EFAC",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#15803D",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={16} />
              <span>A new verification code has been sent to your email.</span>
            </div>
          )}

          {/* Unified 6-box OTP Input matching auth/sign-up */}
          <div className={s.code}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoFocus={i === 0}
                value={code[i] || ""}
                disabled={isSubmitting}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const a = code.split("");
                  a[i] = val;
                  setCode(a.join(""));
                  if (val && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLElement).focus();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (p) {
                    setCode(p);
                    const ins = e.currentTarget.parentElement?.querySelectorAll("input");
                    if (ins) (ins[Math.min(p.length, 5)] as HTMLElement).focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !code[i] && e.currentTarget.previousElementSibling) {
                    (e.currentTarget.previousElementSibling as HTMLElement).focus();
                  }
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className={s.primaryButton}
            disabled={isSubmitting || code.length < 6}
            style={{ width: "100%", marginTop: 8 }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Verifying & launching portal…</span>
              </>
            ) : (
              <>
                <span>Complete Activation & Enter Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className={s.switch} style={{ marginTop: 16 }}>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--primary)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
                fontSize: "inherit",
              }}
            >
              <RefreshCw size={13} className={isResending ? "animate-spin" : ""} />
              <span>{isResending ? "Resending..." : "Resend code"}</span>
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  // State E: Registration & password setup form
  return (
    <AuthShell
      eyebrow="Verified invitation"
      title={`Join ${companyName}`}
      subtitle={`You've been invited as ${roleTitle}. Create your password to activate your employee account.`}
      asideTitle="Everything you need on your first day."
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          padding: 16,
          background: "#FAF5FF",
          border: "1.5px solid #EDE9FE",
          borderRadius: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--gradient, linear-gradient(135deg, #A238FF, #FF3EA5))",
            color: "white",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {invitation?.logoUrl ? (
            <img
              src={invitation.logoUrl}
              alt={companyName}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
          ) : (
            <Building2 size={22} />
          )}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>
            {companyName}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
            Position: <strong>{roleTitle}</strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleActivate} className={s.form}>
        {error && (
          <div className={s.errorBanner}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className={s.row}>
          <AuthField label="First name">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </AuthField>
          <AuthField label="Last name">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </AuthField>
        </div>

        <AuthField label="Verified work email">
          <div style={{ position: "relative" }}>
            <input
              type="email"
              value={emailAddress}
              readOnly
              style={{
                background: "#F9FAFB",
                color: "#4B5563",
                cursor: "not-allowed",
                paddingRight: 36,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                display: "grid",
                placeItems: "center",
              }}
              title="Verified by invitation token"
            >
              <Lock size={15} />
            </div>
          </div>
        </AuthField>

        <AuthField label="Create password">
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-4)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </AuthField>

        <AuthField label="Confirm password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </AuthField>

        <button
          type="submit"
          className={s.primaryButton}
          disabled={isSubmitting}
          style={{ marginTop: 8 }}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Setting up your account…</span>
            </>
          ) : (
            <>
              <span>Activate Account & Start Onboarding</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div className={s.switch} style={{ marginTop: 16 }}>
          Already activated?{" "}
          <Link
            href={`/auth/sign-in?email=${encodeURIComponent(emailAddress)}&redirect_url=${encodeURIComponent(redirectUrl)}`}
          >
            Sign in here
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default function AcceptInvite() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading invitation…</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
