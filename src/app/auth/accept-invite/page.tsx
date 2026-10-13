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
} from "lucide-react";
import { AuthField, AuthShell, authStyles as s } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { useClerk, useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getWorkspaceSubdomain } from "@/lib/api";

function AcceptInviteContent() {
  const clerk = useClerk();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const signUp = clerk?.client?.signUp;
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get("email") || "";
  const urlName = searchParams.get("name") || "";
  const urlRole = searchParams.get("role") || "Team Member";
  const redirectUrl = searchParams.get("redirect_url") || "/my-onboarding";

  const nameParts = urlName.trim().split(" ");
  const defaultFirstName = nameParts[0] || "";
  const defaultLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [emailAddress, setEmailAddress] = useState(urlEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  useEffect(() => {
    const sub = getWorkspaceSubdomain();
    if (sub) setWorkspaceSlug(sub);
  }, []);

  useEffect(() => {
    if (urlEmail && !emailAddress) setEmailAddress(urlEmail);
    if (defaultFirstName && !firstName) setFirstName(defaultFirstName);
    if (defaultLastName && !lastName) setLastName(defaultLastName);
  }, [urlEmail, defaultFirstName, defaultLastName]);

  // If already logged in, go straight to the onboarding portal
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace(redirectUrl);
    }
  }, [authLoaded, isSignedIn, redirectUrl, router]);

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
          "An account with this email already exists. Please sign in with your existing password to access your onboarding."
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

        // Synchronize account with backend
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

  const companyDisplayName = workspaceSlug
    ? workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1)
    : "EasyHR Workspace";

  if (pendingVerification) {
    return (
      <AuthShell
        eyebrow="Security check"
        title="Verify your email"
        subtitle={`We sent a 6-digit security code to ${emailAddress}. Enter it to activate your account.`}
        asideTitle="Welcome to your new team."
      >
        <form onSubmit={handleVerifyCode} className={s.form}>
          {error && (
            <div className={s.errorBanner}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4e4950" }}>
              Enter 6-digit verification code
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <OtpInput value={code} onChange={setCode} autoFocus disabled={isSubmitting} />
          </div>

          <button
            type="submit"
            className={s.primaryButton}
            disabled={isSubmitting || code.length < 6}
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
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Onboarding invitation"
      title={`Join ${companyDisplayName}`}
      subtitle={`You've been invited as ${urlRole}. Create your password to activate your employee portal.`}
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
          <Building2 size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>
            {companyDisplayName}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
            Position: <strong>{urlRole}</strong>
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

        <AuthField label="Work email">
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            required
            readOnly={Boolean(urlEmail)}
            style={urlEmail ? { background: "#F9FAFB", cursor: "not-allowed" } : {}}
          />
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
