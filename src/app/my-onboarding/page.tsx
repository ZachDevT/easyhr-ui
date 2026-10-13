"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Sparkles,
  UserCheck,
  Heart,
  DollarSign,
  FileText,
  ArrowRight,
  ExternalLink,
  LogOut,
  Upload,
  Coffee,
  Film,
  Music,
  ShieldCheck,
  Loader2,
  Building,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useCompany } from "@/context/CompanyContext";
import { EasyHRMark } from "@/components/marketing/EasyHRLogo";
import { Avatar } from "@/components/ui/Avatar";
import { OnboardingPortalSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

interface EmployeeMe {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  personalPhone?: string;
  status: string;
  department?: string;
  division?: string;
  location?: string;
  manager?: string;
  jobTitle?: string;
  startDate?: string;
  avatar?: string;
  companyName?: string;
  birthDate?: string;
  bio?: string;
  avatarUrl?: string;
  shirtSize?: string;
  favoriteFood?: string;
  favoriteMovies?: string;
  favoriteMusic?: string;
  coffeeTea?: string;
  funFact?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  administrativeArea?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  paymentMethod?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  handbookSignedAt?: string;
}

interface OnboardingSettings {
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeVideoUrl: string;
  welcomeVideoRequired: boolean;
  requireBioAndAvatar: boolean;
  requireCultureFavorites: boolean;
  requireDirectDeposit: boolean;
  requireHandbook: boolean;
  handbookTitle: string;
  handbookUrl: string;
  handbookContent: string;
}

export default function MyOnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { company, refresh } = useCompany();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employee, setEmployee] = useState<EmployeeMe | null>(null);

  // Settings configured dynamically by HR Admin
  const [settings, setSettings] = useState<OnboardingSettings>({
    welcomeTitle: "Welcome to the Team",
    welcomeMessage: "We are excited to have you join our team. Let's get your profile set up.",
    welcomeVideoUrl: "",
    welcomeVideoRequired: false,
    requireBioAndAvatar: true,
    requireCultureFavorites: true,
    requireDirectDeposit: true,
    requireHandbook: true,
    handbookTitle: "Employee Handbook & Code of Conduct",
    handbookUrl: "",
    handbookContent: "Welcome to our organization! As a member of our team, we uphold high standards of integrity, excellence, and mutual respect. Please review and acknowledge our policies.",
  });

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedStepKeys, setCompletedStepKeys] = useState<string[]>([]);

  // Video acknowledgment state (if video is required)
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);

  // Step: Profile & Bio
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [administrativeArea, setAdministrativeArea] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step: Culture & Favorites
  const [shirtSize, setShirtSize] = useState("L");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [favoriteMovies, setFavoriteMovies] = useState("");
  const [favoriteMusic, setFavoriteMusic] = useState("");
  const [coffeeTea, setCoffeeTea] = useState("Coffee");
  const [funFact, setFunFact] = useState("");

  // Step: Direct Deposit & Emergency Contact
  const [paymentMethod, setPaymentMethod] = useState("Direct Deposit");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Step: Handbook & Sign-off
  const [handbookAgreed, setHandbookAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial employee profile & HR onboarding settings
  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken();
        if (!token) return;

        // 1. Fetch HR settings
        const settingsRes = await fetch(`${API_BASE_URL}/api/v1/onboarding/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const cfg = await settingsRes.json();
          setSettings(cfg);
        }

        // 2. Fetch employee profile
        const empRes = await fetch(`${API_BASE_URL}/api/v1/employees/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (empRes.ok) {
          const data: EmployeeMe = await empRes.json();
          setEmployee(data);

          // If employee is already active, immediately route to dashboard
          if (data.status === "active") {
            router.replace("/dashboard");
            return;
          }

          // Prepopulate form fields
          setPersonalEmail(data.personalEmail || clerkUser?.primaryEmailAddress?.emailAddress || "");
          setPersonalPhone(data.personalPhone || "");
          setBirthDate(data.birthDate || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatarUrl || data.avatar || clerkUser?.imageUrl || "");
          setAddressLine1(data.addressLine1 || "");
          setAddressLine2(data.addressLine2 || "");
          setCity(data.city || "");
          setAdministrativeArea(data.administrativeArea || "");
          setPostalCode(data.postalCode || "");

          if (data.shirtSize) setShirtSize(data.shirtSize);
          if (data.favoriteFood) setFavoriteFood(data.favoriteFood);
          if (data.favoriteMovies) setFavoriteMovies(data.favoriteMovies);
          if (data.favoriteMusic) setFavoriteMusic(data.favoriteMusic);
          if (data.coffeeTea) setCoffeeTea(data.coffeeTea);
          if (data.funFact) setFunFact(data.funFact);

          if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
          if (data.bankName) setBankName(data.bankName);
          if (data.bankRoutingNumber) setRoutingNumber(data.bankRoutingNumber);
          if (data.bankAccountNumber) setAccountNumber(data.bankAccountNumber);
          if (data.emergencyContactName) setEmergencyName(data.emergencyContactName);
          if (data.emergencyContactRelationship) setEmergencyRel(data.emergencyContactRelationship);
          if (data.emergencyContactPhone) setEmergencyPhone(data.emergencyContactPhone);

          const fullName = `${data.firstName} ${data.lastName}`.trim();
          setSignatureName(fullName);

          if (data.handbookSignedAt) {
            setHandbookAgreed(true);
          }
        }
      } catch (err) {
        console.error("Failed to load onboarding portal data", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [getToken, clerkUser, router]);

  // Dynamically constructed steps based on HR settings
  const dynamicSteps = useMemo(() => {
    const list = [
      { key: "welcome", label: "Welcome", icon: Sparkles },
      { key: "profile", label: "Profile & Bio", icon: UserCheck },
    ];
    if (settings.requireCultureFavorites) {
      list.push({ key: "culture", label: "Culture & Favorites", icon: Heart });
    }
    if (settings.requireDirectDeposit) {
      list.push({ key: "payment", label: "Direct Deposit", icon: DollarSign });
    }
    if (settings.requireHandbook) {
      list.push({ key: "handbook", label: "Handbook Sign-off", icon: FileText });
    }
    return list;
  }, [settings]);

  const currentStep = dynamicSteps[activeStepIndex] || dynamicSteps[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === dynamicSteps.length - 1;

  // Handle local avatar file picker
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File too large", "Please select an image smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Intermediate step save
  const handleNextStep = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Save progress to backend
      await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalEmail: personalEmail || undefined,
          personalPhone: personalPhone || undefined,
          birthDate: birthDate || undefined,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
          shirtSize: shirtSize || undefined,
          favoriteFood: favoriteFood || undefined,
          favoriteMovies: favoriteMovies || undefined,
          favoriteMusic: favoriteMusic || undefined,
          coffeeTea: coffeeTea || undefined,
          funFact: funFact || undefined,
          addressLine1: addressLine1 || undefined,
          addressLine2: addressLine2 || undefined,
          city: city || undefined,
          administrativeArea: administrativeArea || undefined,
          postalCode: postalCode || undefined,
          emergencyContactName: emergencyName || undefined,
          emergencyContactRelationship: emergencyRel || undefined,
          emergencyContactPhone: emergencyPhone || undefined,
          paymentMethod: paymentMethod || undefined,
          bankName: bankName || undefined,
          bankRoutingNumber: routingNumber || undefined,
          bankAccountNumber: accountNumber || undefined,
        }),
      });

      if (!completedStepKeys.includes(currentStep.key)) {
        setCompletedStepKeys((prev) => [...prev, currentStep.key]);
      }

      setActiveStepIndex((prev) => Math.min(prev + 1, dynamicSteps.length - 1));
    } catch (err: any) {
      console.error("Step progress save error", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Final onboarding submission & automatic redirect to dashboard
  const handleCompleteOnboarding = async () => {
    if (settings.requireHandbook && !handbookAgreed) {
      toast.warning("Handbook agreement required", "Please acknowledge and digitally sign the employee handbook.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // 1. Submit complete profile with handbook sign-off timestamp
      await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalEmail: personalEmail || undefined,
          personalPhone: personalPhone || undefined,
          birthDate: birthDate || undefined,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
          shirtSize: shirtSize || undefined,
          favoriteFood: favoriteFood || undefined,
          favoriteMovies: favoriteMovies || undefined,
          favoriteMusic: favoriteMusic || undefined,
          coffeeTea: coffeeTea || undefined,
          funFact: funFact || undefined,
          addressLine1: addressLine1 || undefined,
          addressLine2: addressLine2 || undefined,
          city: city || undefined,
          administrativeArea: administrativeArea || undefined,
          postalCode: postalCode || undefined,
          emergencyContactName: emergencyName || undefined,
          emergencyContactRelationship: emergencyRel || undefined,
          emergencyContactPhone: emergencyPhone || undefined,
          paymentMethod: paymentMethod || undefined,
          bankName: bankName || undefined,
          bankRoutingNumber: routingNumber || undefined,
          bankAccountNumber: accountNumber || undefined,
          handbookSignedAt: new Date().toISOString(),
        }),
      });

      // 2. Activate employee record
      if (employee?.id) {
        await fetch(`${API_BASE_URL}/api/v1/employees/${employee.id}/activate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      try {
        await refresh();
      } catch {}

      toast.success("Welcome to the team!", "Onboarding completed. Taking you to your dashboard...");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error("Completion failed", err.message || "Failed to finalize onboarding.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <OnboardingPortalSkeleton />;
  }

  const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.trim() || "Team Member" : "Team Member";
  const roleName = employee?.jobTitle || "Team Member";
  const departmentName = employee?.department || "General";
  const locationName = employee?.location || "Headquarters";

  const videoData = settings.welcomeVideoUrl ? getVideoEmbedUrl(settings.welcomeVideoUrl) : null;
  const canProceedFromWelcome = !settings.welcomeVideoRequired || videoAcknowledged;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#FBFBFC",
        color: "#18181B",
      }}
    >
      {/* Sleek Minimal Header */}
      <header
        style={{
          height: 60,
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "white",
          borderBottom: "1px solid #ECECEF",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name || "Company"}
              style={{ height: 28, maxWidth: 120, objectFit: "contain" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
              <EasyHRMark size={24} />
              <span>{company?.name || "EasyHR"}</span>
            </div>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#F4F4F6",
              color: "#52525B",
            }}
          >
            Employee Onboarding
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name={employeeName} size="sm" src={avatarUrl || employee?.avatar || clerkUser?.imageUrl} />
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#18181B", lineHeight: 1.2 }}>{employeeName}</span>
              <span style={{ fontSize: 11, color: "#71717A" }}>{employee?.workEmail || clerkUser?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
            className="row gap-6 align-center"
            style={{
              background: "transparent",
              border: "1px solid #E4E4E7",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#52525B",
              cursor: "pointer",
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 20px 60px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 660 }}>
          {/* Apple-inspired Segmented Stepper */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F4F4F6",
              padding: 4,
              borderRadius: 14,
              marginBottom: 28,
              gap: 4,
            }}
          >
            {dynamicSteps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              const isCompleted = completedStepKeys.includes(step.key) || idx < activeStepIndex;
              const StepIcon = step.icon;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => {
                    if (isCompleted || idx <= activeStepIndex) {
                      setActiveStepIndex(idx);
                    }
                  }}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive ? "#FFFFFF" : "transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    color: isActive ? "#18181B" : isCompleted ? "#059669" : "#71717A",
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    cursor: isCompleted || idx <= activeStepIndex ? "pointer" : "default",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isCompleted && !isActive ? (
                    <Check size={13} strokeWidth={2.5} style={{ color: "#059669" }} />
                  ) : (
                    <StepIcon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                  )}
                  <span style={{ whiteSpace: "nowrap" }}>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step Card Container */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              border: "1px solid #ECECEF",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
              padding: "32px 36px",
            }}
          >
            {/* STEP 1: Welcome & Leadership Video */}
            {currentStep.key === "welcome" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 750, margin: 0, color: "#18181B" }}>
                    {settings.welcomeTitle || `Welcome, ${employee?.firstName || "there"}!`}
                  </h1>
                  <p style={{ fontSize: 14, color: "#71717A", margin: "6px 0 0", lineHeight: 1.5 }}>
                    {settings.welcomeMessage || "We are excited to have you join our team. Let's walk through a few details to get you ready."}
                  </p>
                </div>

                {/* Team & Placement Summary Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                    background: "#FBFBFC",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid #ECECEF",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#71717A", textTransform: "uppercase", fontWeight: 600 }}>Position</div>
                      <div style={{ fontSize: 13, fontWeight: 650, color: "#18181B" }}>{roleName}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F5F3FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#71717A", textTransform: "uppercase", fontWeight: 600 }}>Department</div>
                      <div style={{ fontSize: 13, fontWeight: 650, color: "#18181B" }}>{departmentName} &bull; {locationName}</div>
                    </div>
                  </div>
                </div>

                {/* Video Player (if URL is set by HR) */}
                {videoData && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#52525B" }}>
                        Leadership Welcome Message
                      </span>
                      {settings.welcomeVideoRequired ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 6 }}>
                          Required to Watch
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#71717A" }}>
                          Optional
                        </span>
                      )}
                    </div>

                    {videoData.type === "iframe" && (
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 14, border: "1px solid #ECECEF" }}>
                        <iframe
                          src={videoData.embedUrl}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {videoData.type === "video" && (
                      <video
                        src={videoData.embedUrl}
                        controls
                        style={{ width: "100%", maxHeight: 320, borderRadius: 14, border: "1px solid #ECECEF", background: "#000" }}
                      />
                    )}

                    {videoData.type === "link" && (
                      <a
                        href={videoData.embedUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "#F5F3FF",
                          color: "#7C3AED",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>Watch Welcome Video ({videoData.embedUrl})</span>
                      </a>
                    )}

                    {settings.welcomeVideoRequired && (
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 4 }}>
                        <input
                          type="checkbox"
                          checked={videoAcknowledged}
                          onChange={(e) => setVideoAcknowledged(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "#7C3AED", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>
                          I have watched the leadership welcome video
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Profile & Bio */}
            {currentStep.key === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 750, margin: 0, color: "#18181B" }}>
                    Personal Profile & Bio
                  </h1>
                  <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
                    Help your new teammates get to know you and ensure your contact records are current.
                  </p>
                </div>

                {/* Avatar Photo Picker */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, padding: 14, background: "#FBFBFC", borderRadius: 14, border: "1px solid #ECECEF" }}>
                  <Avatar name={employeeName} size="xl" src={avatarUrl} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#18181B" }}>Profile Picture</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 8,
                          background: "#FFFFFF",
                          border: "1px solid #D4D4D8",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#18181B",
                          cursor: "pointer",
                        }}
                      >
                        <Upload size={13} />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: "#71717A" }}>PNG, JPG or WebP up to 5MB</span>
                  </div>
                </div>

                {/* Birthday & Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Date of Birth</label>
                    <input
                      type="date"
                      className="input"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Personal Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={personalPhone}
                      onChange={(e) => setPersonalPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Personal Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Personal Email</label>
                  <input
                    type="email"
                    className="input"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{ fontSize: 13 }}
                  />
                </div>

                {/* Bio */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>About You / Bio</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A brief intro about yourself, your background, or what excites you about this role..."
                    style={{ fontSize: 13, resize: "vertical" }}
                  />
                </div>

                {/* Residential Address */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#52525B", textTransform: "uppercase" }}>Residential Address</span>
                  <input
                    type="text"
                    className="input"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street Address Line 1"
                    style={{ fontSize: 13 }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                    <input
                      type="text"
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      style={{ fontSize: 13 }}
                    />
                    <input
                      type="text"
                      className="input"
                      value={administrativeArea}
                      onChange={(e) => setAdministrativeArea(e.target.value)}
                      placeholder="State / Region"
                      style={{ fontSize: 13 }}
                    />
                    <input
                      type="text"
                      className="input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal Code"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Culture & Favorites */}
            {currentStep.key === "culture" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 750, margin: 0, color: "#18181B" }}>
                    Team Culture & Favorites
                  </h1>
                  <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
                    A few fun details for team lunches, company gear, and welcoming you aboard.
                  </p>
                </div>

                {/* T-Shirt Size */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Company T-Shirt Size</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((sz) => {
                      const isSel = shirtSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setShirtSize(sz)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: isSel ? "2px solid #7C3AED" : "1px solid #E4E4E7",
                            background: isSel ? "#F5F3FF" : "#FFFFFF",
                            color: isSel ? "#7C3AED" : "#18181B",
                            fontWeight: isSel ? 700 : 500,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Coffee vs Tea */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Coffee vs Tea</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {["Coffee", "Tea", "Both", "Neither"].map((opt) => {
                      const isSel = coffeeTea === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCoffeeTea(opt)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: isSel ? "2px solid #7C3AED" : "1px solid #E4E4E7",
                            background: isSel ? "#F5F3FF" : "#FFFFFF",
                            color: isSel ? "#7C3AED" : "#18181B",
                            fontWeight: isSel ? 700 : 500,
                            fontSize: 13,
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Food & Entertainment */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Favorite Food</label>
                    <input
                      type="text"
                      className="input"
                      value={favoriteFood}
                      onChange={(e) => setFavoriteFood(e.target.value)}
                      placeholder="E.g. Tacos, Ramen, Pizza, Sushi..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Favorite Movies / Shows</label>
                    <input
                      type="text"
                      className="input"
                      value={favoriteMovies}
                      onChange={(e) => setFavoriteMovies(e.target.value)}
                      placeholder="E.g. Inception, The Office, Ted Lasso..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Favorite Music / Genres</label>
                    <input
                      type="text"
                      className="input"
                      value={favoriteMusic}
                      onChange={(e) => setFavoriteMusic(e.target.value)}
                      placeholder="E.g. Indie, Jazz, Hip Hop, Rock..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Fun Fact or Superpower</label>
                    <input
                      type="text"
                      className="input"
                      value={funFact}
                      onChange={(e) => setFunFact(e.target.value)}
                      placeholder="E.g. Can solve a Rubik's cube in 60s..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Direct Deposit & Emergency Contact */}
            {currentStep.key === "payment" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 750, margin: 0, color: "#18181B" }}>
                    Payroll & Direct Deposit
                  </h1>
                  <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
                    Configure how your compensation is disbursed and register emergency details.
                  </p>
                </div>

                {/* Payment Method Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Disbursement Method</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Direct Deposit", "Paper Check", "Wire Transfer"].map((method) => {
                      const isSel = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: isSel ? "2px solid #7C3AED" : "1px solid #E4E4E7",
                            background: isSel ? "#F5F3FF" : "#FFFFFF",
                            color: isSel ? "#7C3AED" : "#18181B",
                            fontWeight: isSel ? 700 : 500,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bank Account Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Bank / Institution Name</label>
                    <input
                      type="text"
                      className="input"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="E.g. Chase, Bank of America, Wells Fargo..."
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Routing / Transit Number</label>
                      <input
                        type="text"
                        className="input"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="9-digit routing"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Account Number</label>
                      <input
                        type="text"
                        className="input"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account number"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#52525B", textTransform: "uppercase" }}>Emergency Contact</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input
                      type="text"
                      className="input"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Contact Full Name"
                      style={{ fontSize: 13 }}
                    />
                    <input
                      type="text"
                      className="input"
                      value={emergencyRel}
                      onChange={(e) => setEmergencyRel(e.target.value)}
                      placeholder="Relationship (e.g. Spouse, Parent)"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <input
                    type="tel"
                    className="input"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Emergency Phone Number"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Handbook Review & Digital Sign-off */}
            {currentStep.key === "handbook" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 750, margin: 0, color: "#18181B" }}>
                    {settings.handbookTitle || "Employee Handbook & Policies"}
                  </h1>
                  <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
                    Please review our standard conduct guidelines and confirm your digital sign-off.
                  </p>
                </div>

                {settings.handbookUrl && (
                  <div>
                    <a
                      href={settings.handbookUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: "#EFF6FF",
                        color: "#2563EB",
                        fontSize: 12,
                        fontWeight: 650,
                        textDecoration: "none",
                      }}
                    >
                      <FileText size={14} />
                      <span>Read Full Document in New Tab</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}

                {/* Policy Summary Scroll Box */}
                <div
                  style={{
                    background: "#FBFBFC",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #ECECEF",
                    maxHeight: 180,
                    overflowY: "auto",
                    fontSize: 13,
                    color: "#52525B",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {settings.handbookContent ||
                    "Welcome to our team! As an employee, you agree to treat colleagues with dignity and respect, preserve confidentiality, maintain standard work integrity, and follow company safety and operational policies."}
                </div>

                {/* Digital Signature */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
                      Digital Signature (Full Legal Name)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Type your full legal name"
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={handbookAgreed}
                      onChange={(e) => setHandbookAgreed(e.target.checked)}
                      style={{ width: 16, height: 16, marginTop: 2, accentColor: "#7C3AED", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, color: "#3F3F46", lineHeight: 1.4 }}>
                      I confirm that I have reviewed the policies above and agree to comply with company guidelines.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 24,
                marginTop: 24,
                borderTop: "1px solid #ECECEF",
              }}
            >
              <div>
                {!isFirstStep && (
                  <button
                    type="button"
                    onClick={() => setActiveStepIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={isSaving}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#71717A",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                )}
              </div>

              <div>
                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSaving || (currentStep.key === "welcome" && !canProceedFromWelcome)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: currentStep.key === "welcome" && !canProceedFromWelcome ? "#D4D4D8" : "var(--gradient, #7C3AED)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 22px",
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: currentStep.key === "welcome" && !canProceedFromWelcome || isSaving ? "not-allowed" : "pointer",
                      boxShadow: currentStep.key === "welcome" && !canProceedFromWelcome ? "none" : "0 4px 12px rgba(124, 58, 237, 0.25)",
                    }}
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <span>Continue</span>}
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteOnboarding}
                    disabled={isSaving || (settings.requireHandbook && !handbookAgreed)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: settings.requireHandbook && !handbookAgreed ? "#D4D4D8" : "var(--gradient, #7C3AED)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: settings.requireHandbook && !handbookAgreed || isSaving ? "not-allowed" : "pointer",
                      boxShadow: settings.requireHandbook && !handbookAgreed ? "none" : "0 4px 14px rgba(124, 58, 237, 0.3)",
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Finalizing...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Onboarding</span>
                        <Check size={15} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
