"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Clock,
  Monitor,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  ChevronRight,
  CheckCircle2,
  Target,
  Stethoscope,
  Heart,
  Briefcase,
  Plus,
  Search,
  Camera,
  Loader2,
  Sparkles,
  Smartphone,
  Wallet,
  DollarSign,
  ShieldCheck,
  Edit2,
  Download,
  AlertCircle,
  Globe,
  Check,
  X,
  CreditCard,
  Award,
  Star,
  Coffee,
  Utensils,
  Music,
  Palmtree,
  Sun,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { CompulsoryMyTimeWidget } from "@/components/widgets";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileMeSkeleton, ProfileTabShimmer } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/lib/api";

const TABS = [
  "Personal",
  "Job",
  "Documents",
  "Time Off",
  "Performance",
  "Benefits",
  "Timesheet",
  "Pay Info",
  "Emergency",
];

interface EmployeeProfileRecord {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  personalPhone?: string;
  status: string;
  departmentId?: string;
  department: string;
  divisionId?: string;
  division: string;
  locationId?: string;
  location: string;
  managerId?: string;
  manager: string;
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
  mobileMoneyProvider?: string;
  mobileMoneyPhone?: string;
  walletEmail?: string;
  handbookSignedAt?: string;
}

function ProfileContent() {
  const { getToken } = useAuth();
  const { userProfile, company, updateProfile, uploadAvatar } = useCompany();
  const { isHRAdmin, isManager } = useRole();
  const searchParams = useSearchParams();

  const requestedTab = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(requestedTab || "Personal");
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>("All");
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      if (nextTab === activeTab) return;
      setActiveTab(nextTab);
      setIsTabSwitching(true);
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
      tabSwitchTimeoutRef.current = setTimeout(() => {
        setIsTabSwitching(false);
      }, 180);
    },
    [activeTab]
  );

  // Live employee record from API
  const [employee, setEmployee] = useState<EmployeeProfileRecord | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);

  // Time off data
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  // Documents data
  const [documents, setDocuments] = useState<any[]>([]);

  // Attendance punches for Timesheet
  const [punches, setPunches] = useState<any[]>([]);

  // Performance & Benefits live state
  const [performanceGoals, setPerformanceGoals] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [benefitEnrollments, setBenefitEnrollments] = useState<any[]>([]);
  const [benefitPlans, setBenefitPlans] = useState<any[]>([]);

  // Add Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    status: "in_progress",
    completionPercentage: 25,
    dueDate: "",
  });

  // Editing state for Personal Tab
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Modals for Emergency & Disbursement
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    name: "",
    relationship: "Spouse",
    phone: "",
  });

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    method: "Mobile Money",
    provider: "MTN Mobile Money",
    phone: "",
    walletEmail: "",
    bankName: "",
    routingNumber: "",
    accountNumber: "",
  });

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal form state
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    lastName: "",
    personalEmail: "",
    personalPhone: "",
    birthDate: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    administrativeArea: "",
    postalCode: "",
    bio: "",
    shirtSize: "L",
    favoriteFood: "",
    favoriteMovies: "",
    favoriteMusic: "",
    coffeeTea: "Coffee",
    funFact: "",
  });

  // Fetch real employee profile and supporting data from backend
  const loadEmployeeData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch real employee profile
      const empRes = await fetch(`${API_BASE_URL}/api/v1/employees/me`, { headers });
      if (empRes.ok) {
        const empData: EmployeeProfileRecord = await empRes.json();
        setEmployee(empData);

        // Prepopulate personal edit form
        setPersonalForm({
          firstName: empData.firstName || "",
          lastName: empData.lastName || "",
          personalEmail: empData.personalEmail || "",
          personalPhone: empData.personalPhone || "",
          birthDate: empData.birthDate || "",
          addressLine1: empData.addressLine1 || "",
          addressLine2: empData.addressLine2 || "",
          city: empData.city || "",
          administrativeArea: empData.administrativeArea || "",
          postalCode: empData.postalCode || "",
          bio: empData.bio || "",
          shirtSize: empData.shirtSize || "L",
          favoriteFood: empData.favoriteFood || "",
          favoriteMovies: empData.favoriteMovies || "",
          favoriteMusic: empData.favoriteMusic || "",
          coffeeTea: empData.coffeeTea || "Coffee",
          funFact: empData.funFact || "",
        });

        // Prepopulate emergency contact form
        setEmergencyForm({
          name: empData.emergencyContactName || "",
          relationship: empData.emergencyContactRelationship || "Spouse",
          phone: empData.emergencyContactPhone || "",
        });

        // Prepopulate payout form
        setPayoutForm({
          method: empData.paymentMethod || "Mobile Money",
          provider: empData.mobileMoneyProvider || "MTN Mobile Money",
          phone: empData.mobileMoneyPhone || "",
          walletEmail: empData.walletEmail || "",
          bankName: empData.bankName || "",
          routingNumber: empData.bankRoutingNumber || "",
          accountNumber: empData.bankAccountNumber || "",
        });

        // Fetch documents, performance goals, reviews, and benefits for this employee
        if (empData.id) {
          fetch(`${API_BASE_URL}/api/v1/documents?employeeId=${empData.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.data) setDocuments(d.data);
            })
            .catch(() => {});

          fetch(`${API_BASE_URL}/api/v1/performance/goals/${empData.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((g) => {
              if (Array.isArray(g)) setPerformanceGoals(g);
            })
            .catch(() => {});

          fetch(`${API_BASE_URL}/api/v1/performance/reviews?employeeId=${empData.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((rev) => {
              if (Array.isArray(rev)) setPerformanceReviews(rev);
            })
            .catch(() => {});

          fetch(`${API_BASE_URL}/api/v1/benefits/enrollments/${empData.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((ben) => {
              if (Array.isArray(ben)) setBenefitEnrollments(ben);
            })
            .catch(() => {});

          fetch(`${API_BASE_URL}/api/v1/benefits/plans`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((pl) => {
              if (Array.isArray(pl)) setBenefitPlans(pl);
            })
            .catch(() => {});
        }
      }

      // 2. Fetch leave balances & requests in parallel
      Promise.all([
        fetch(`${API_BASE_URL}/api/v1/leave/balances`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/leave/requests`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/attendance/punches?limit=40`, { headers }),
      ])
        .then(async ([balRes, reqRes, punchRes]) => {
          if (balRes.ok) {
            const bJson = await balRes.json();
            setLeaveBalances(bJson.data || []);
          }
          if (reqRes.ok) {
            const rJson = await reqRes.json();
            setLeaveRequests(rJson.data || []);
          }
          if (punchRes.ok) {
            const pJson = await punchRes.json();
            setPunches(pJson.data || []);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error("Failed to load employee profile:", err);
    } finally {
      setIsLoadingEmployee(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  // Handle avatar upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const uploadedUrl = await uploadAvatar(dataUrl);
        if (uploadedUrl) {
          toast.success("Avatar Updated", "Your profile photo has been refreshed.");
          loadEmployeeData();
        }
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Upload Failed", "Could not upload profile picture.");
      setIsUploadingAvatar(false);
    }
  };

  // Save personal & culture changes
  const handlePersonalSave = async () => {
    setIsSavingPersonal(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const payload = {
        firstName: personalForm.firstName.trim() || undefined,
        lastName: personalForm.lastName.trim() || undefined,
        personalEmail: personalForm.personalEmail.trim() || undefined,
        personalPhone: personalForm.personalPhone.trim() || undefined,
        birthDate: personalForm.birthDate || undefined,
        addressLine1: personalForm.addressLine1.trim() || undefined,
        addressLine2: personalForm.addressLine2.trim() || undefined,
        city: personalForm.city.trim() || undefined,
        administrativeArea: personalForm.administrativeArea.trim() || undefined,
        postalCode: personalForm.postalCode.trim() || undefined,
        bio: personalForm.bio.trim() || undefined,
        shirtSize: personalForm.shirtSize || undefined,
        favoriteFood: personalForm.favoriteFood.trim() || undefined,
        favoriteMovies: personalForm.favoriteMovies.trim() || undefined,
        favoriteMusic: personalForm.favoriteMusic.trim() || undefined,
        coffeeTea: personalForm.coffeeTea || undefined,
        funFact: personalForm.funFact.trim() || undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save personal profile");

      // Also update top-level user name in context
      if (personalForm.firstName && personalForm.lastName) {
        await updateProfile({
          firstName: personalForm.firstName.trim(),
          lastName: personalForm.lastName.trim(),
          phone: personalForm.personalPhone.trim(),
        });
      }

      toast.success("Profile Updated", "Personal and culture details have been updated.");
      setIsEditingPersonal(false);
      loadEmployeeData();
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Could not update personal profile.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Save emergency contact
  const handleSaveEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.name.trim() || !emergencyForm.phone.trim()) {
      toast.error("Validation error", "Contact name and phone number are required.");
      return;
    }

    setIsSavingEmergency(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emergencyContactName: emergencyForm.name.trim(),
          emergencyContactRelationship: emergencyForm.relationship,
          emergencyContactPhone: emergencyForm.phone.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update emergency contact");

      toast.success("Emergency Contact Saved", "Your primary emergency contact has been updated.");
      setIsEmergencyModalOpen(false);
      loadEmployeeData();
    } catch (err: any) {
      toast.error("Could not save", err.message || "Failed to update emergency contact.");
    } finally {
      setIsSavingEmergency(false);
    }
  };

  // Save disbursement / payout changes
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayout(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: payoutForm.method,
          mobileMoneyProvider: payoutForm.method === "Mobile Money" ? payoutForm.provider : undefined,
          mobileMoneyPhone: payoutForm.method === "Mobile Money" ? payoutForm.phone.trim() : undefined,
          walletEmail: payoutForm.method === "PayPal / Digital Wallet" ? payoutForm.walletEmail.trim() : undefined,
          bankName:
            payoutForm.method === "Mobile Money"
              ? payoutForm.provider
              : payoutForm.method === "PayPal / Digital Wallet"
              ? "PayPal"
              : payoutForm.bankName.trim() || undefined,
          bankRoutingNumber:
            payoutForm.method === "Direct Deposit" || payoutForm.method === "Wire Transfer / SWIFT"
              ? payoutForm.routingNumber.trim() || undefined
              : undefined,
          bankAccountNumber:
            payoutForm.method === "Mobile Money"
              ? payoutForm.phone.trim()
              : payoutForm.method === "PayPal / Digital Wallet"
              ? payoutForm.walletEmail.trim()
              : payoutForm.accountNumber.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update disbursement details");

      toast.success("Payout Method Saved", "Your compensation disbursement channel has been updated.");
      setIsPayoutModalOpen(false);
      loadEmployeeData();
    } catch (err: any) {
      toast.error("Could not update payout", err.message || "Failed to save disbursement channel.");
    } finally {
      setIsSavingPayout(false);
    }
  };

  // Create personal career goal
  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id) return;
    if (!goalForm.title.trim()) {
      toast.error("Title required", "Please enter a goal title.");
      return;
    }
    setIsSavingGoal(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/performance/goals/${employee.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || null,
          status: goalForm.status,
          completionPercentage: Number(goalForm.completionPercentage),
          dueDate: goalForm.dueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("Goal established", "New career goal created successfully.");
        setIsGoalModalOpen(false);
        setGoalForm({
          title: "",
          description: "",
          status: "in_progress",
          completionPercentage: 25,
          dueDate: "",
        });
        const gRes = await fetch(`${API_BASE_URL}/api/v1/performance/goals/${employee.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData)) setPerformanceGoals(gData);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Goal creation failed", err.detail || err.title || "Failed to create goal.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to create goal.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Display names
  const displayFirstName = employee?.firstName || userProfile?.firstName || "Employee";
  const displayLastName = employee?.lastName || userProfile?.lastName || "";
  const displayFullName = `${displayFirstName} ${displayLastName}`.trim();
  const displayRole = employee?.jobTitle || userProfile?.role || "Team Member";
  const displayCompany = employee?.companyName || company?.name || "EasyHR";
  const displayLocation = employee?.location || company?.city || "Headquarters";
  const displayPhone = employee?.personalPhone || userProfile?.phone || "No phone set";
  const displayEmail = employee?.workEmail || userProfile?.email || "";

  // Group punches by date for timesheet
  const groupedPunches = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of punches) {
      const dateKey = p.punchedAt ? p.punchedAt.split("T")[0] : "Recent";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(p);
    }
    return Object.entries(map).map(([date, items]) => {
      const d = new Date(date);
      const dayName = isNaN(d.getTime()) ? "Day" : d.toLocaleDateString("en-US", { weekday: "short" });
      const formattedDate = isNaN(d.getTime()) ? date : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        day: dayName,
        date: formattedDate,
        punches: items,
      };
    });
  }, [punches]);

  if (isLoadingEmployee && !employee) {
    return <ProfileMeSkeleton />;
  }

  const avatarSrc = employee?.avatarUrl || employee?.avatar || userProfile?.avatarUrl;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg-page)", display: "flex", flexDirection: "column" }}>
      {/* Executive Employee Profile Header Card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid var(--card-border, #E4E4E7)",
          boxShadow: "0 2px 12px rgba(17, 17, 24, 0.04)",
          overflow: "hidden",
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        {/* Top Accent Strip */}
        <div style={{ height: 4, background: "var(--gradient)" }} />

        {/* Main Identity & Actions Row */}
        <div
          style={{
            padding: "20px 24px 18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Left: 1:1 Undistorted Avatar + Identity Details */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0, flex: 1 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile photo"
              style={{
                position: "relative",
                width: 76,
                height: 76,
                minWidth: 76,
                minHeight: 76,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              <div
                className="avatar-hover-container"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #FFFFFF",
                  boxShadow: "0 4px 14px rgba(17, 17, 24, 0.1), 0 0 0 1px var(--card-border, #E4E4E7)",
                  background: "var(--primary-tint, #F5EBFF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayFullName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--primary, #A238FF)",
                    }}
                  >
                    {displayFirstName.slice(0, 1).toUpperCase()}
                    {displayLastName.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <div
                  className="avatar-hover-overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(9, 9, 11, 0.6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    opacity: 0,
                    transition: "opacity 0.18s ease",
                    userSelect: "none",
                  }}
                >
                  {isUploadingAvatar ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </div>
              </div>

              {/* Small Camera Badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--primary, #A238FF)",
                  color: "#FFFFFF",
                  border: "2px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <Camera size={11} />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Name, Role, Badges & Vitals Strip */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: "var(--text-1, #18181B)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {displayFullName}
                </h1>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 9px",
                    borderRadius: 999,
                    background: employee?.status === "active" ? "#ECFDF5" : "#FEF3C7",
                    color: employee?.status === "active" ? "#059669" : "#D97706",
                    border:
                      employee?.status === "active"
                        ? "1px solid rgba(16, 185, 129, 0.25)"
                        : "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: employee?.status === "active" ? "#10B981" : "#F59E0B",
                    }}
                  />
                  {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#F4F4F5",
                    color: "var(--text-2, #52525B)",
                    border: "1px solid var(--card-border, #E4E4E7)",
                  }}
                >
                  {employee?.employeeNumber || "EMP-0001"}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-2, #52525B)",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {displayRole} <span style={{ color: "var(--text-3, #A1A1AA)" }}>·</span> {displayCompany}
              </div>

              {/* Compact Metadata Pills */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--text-3, #71717A)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Building size={13} style={{ color: "var(--primary, #A238FF)" }} />
                  <span>{employee?.department || "General"}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} style={{ color: "var(--primary, #A238FF)" }} />
                  <span>{displayLocation}</span>
                </span>
                {displayEmail && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Mail size={13} style={{ color: "var(--primary, #A238FF)" }} />
                    <span>{displayEmail}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Header Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-neutral btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 9,
                fontSize: 12,
              }}
            >
              <Camera size={13.5} />
              <span>Change Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("Personal");
                setIsEditingPersonal(true);
              }}
              className="btn-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                fontSize: 12,
              }}
            >
              <Edit2 size={13} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Bottom Integrated Navigation Tabs */}
        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "0 20px",
            background: "#FAF9F7",
            borderTop: "1px solid var(--card-border, #E4E4E7)",
            overflowX: "auto",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const TabIcon =
              tab === "Personal"
                ? User
                : tab === "Job"
                ? Briefcase
                : tab === "Documents"
                ? FileText
                : tab === "Time Off"
                ? Palmtree
                : tab === "Performance"
                ? Target
                : tab === "Benefits"
                ? Heart
                : tab === "Timesheet"
                ? Clock
                : tab === "Pay Info"
                ? CreditCard
                : ShieldCheck;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "11px 13px",
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--primary, #A238FF)" : "var(--text-2, #52525B)",
                  background: isActive ? "rgba(162, 56, 255, 0.04)" : "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? "2.5px solid var(--primary, #A238FF)"
                    : "2.5px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <TabIcon
                  size={13.5}
                  style={{
                    color: isActive ? "var(--primary, #A238FF)" : "var(--text-3, #A1A1AA)",
                    flexShrink: 0,
                  }}
                />
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Area */}
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 20, position: "relative", alignItems: "start" }}>
        {/* Left Column: Structured Vitals & Employment Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid var(--card-border, #E4E4E7)",
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-3, #71717A)",
                margin: "0 0 14px 0",
              }}
            >
              Official Vitals
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FAF9F7",
                    border: "1px solid var(--card-border, #E4E4E7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-2, #52525B)",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={13} />
                </div>
                <span style={{ color: "var(--text-1, #18181B)" }}>{displayPhone}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FAF9F7",
                    border: "1px solid var(--card-border, #E4E4E7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-2, #52525B)",
                    flexShrink: 0,
                  }}
                >
                  <Monitor size={13} />
                </div>
                <span
                  style={{
                    color: "var(--text-1, #18181B)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayEmail}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FAF9F7",
                    border: "1px solid var(--card-border, #E4E4E7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-2, #52525B)",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={13} />
                </div>
                <span style={{ color: "var(--text-1, #18181B)" }}>
                  {employee?.status === "active" ? "Active Now" : "Onboarding"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FAF9F7",
                    border: "1px solid var(--card-border, #E4E4E7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-2, #52525B)",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={13} />
                </div>
                <span style={{ color: "var(--text-1, #18181B)" }}>{displayLocation}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FAF9F7",
                    border: "1px solid var(--card-border, #E4E4E7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-2, #52525B)",
                    flexShrink: 0,
                  }}
                >
                  <Building size={13} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--text-1, #18181B)", fontWeight: 600 }}>{displayCompany}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>
                    {employee?.department || "General"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border-subtle, #F0F0F3)" }} />

          <div>
            <h3
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-3, #71717A)",
                margin: "0 0 12px 0",
              }}
            >
              Employment Record
            </h3>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "#FAF9F7",
                border: "1px solid var(--card-border, #E4E4E7)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Calendar size={15} style={{ color: "var(--primary, #A238FF)", flexShrink: 0 }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge variant={employee?.status === "active" ? "success" : "warning"}>
                    {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}
                  </Badge>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>
                    {employee?.employeeNumber || "EMP-0001"}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 4 }}>
                  {employee?.startDate ? `Hired on ${employee.startDate}` : "Active Member"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div
          style={{
            background: "var(--card-bg, #FFFFFF)",
            borderRadius: 14,
            border: "1px solid var(--card-border, #E4E4E7)",
            padding: 26,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            minHeight: 540,
          }}
        >
          {isTabSwitching ? (
            <ProfileTabShimmer tab={activeTab} />
          ) : (
            <>
              {/* TAB 1: PERSONAL */}
              {activeTab === "Personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                          Personal Identity & Team Culture
                        </h3>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--primary-tint, #F5EBFF)",
                            color: "var(--primary, #A238FF)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Verified Profile
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Your official contact credentials, residential address, executive bio, and workspace preferences.
                      </p>
                    </div>
                    {!isEditingPersonal && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setIsEditingPersonal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 9,
                          fontSize: 12,
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit Personal Info</span>
                      </button>
                    )}
                  </div>

                  {isEditingPersonal ? (
                    <div
                      style={{
                        padding: 20,
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 18px" }}>
                        <div>
                          <label className="form-label">First Name</label>
                          <input
                            className="input"
                            value={personalForm.firstName}
                            onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Last Name</label>
                          <input
                            className="input"
                            value={personalForm.lastName}
                            onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Personal Phone</label>
                          <input
                            className="input"
                            placeholder="+250 78... or +254..."
                            value={personalForm.personalPhone}
                            onChange={(e) => setPersonalForm({ ...personalForm, personalPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Personal Email</label>
                          <input
                            type="email"
                            className="input"
                            placeholder="personal@gmail.com"
                            value={personalForm.personalEmail}
                            onChange={(e) => setPersonalForm({ ...personalForm, personalEmail: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Birth Date</label>
                          <input
                            type="date"
                            className="input"
                            value={personalForm.birthDate}
                            onChange={(e) => setPersonalForm({ ...personalForm, birthDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Merchandise / T-Shirt Size</label>
                          <select
                            className="select"
                            value={personalForm.shirtSize}
                            onChange={(e) => setPersonalForm({ ...personalForm, shirtSize: e.target.value })}
                          >
                            {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="form-label">Street Address</label>
                          <input
                            className="input"
                            placeholder="123 Innovation Way"
                            value={personalForm.addressLine1}
                            onChange={(e) => setPersonalForm({ ...personalForm, addressLine1: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">City / Town</label>
                          <input
                            className="input"
                            placeholder="Kampala / Nairobi / Kigali"
                            value={personalForm.city}
                            onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">State / Administrative Area</label>
                          <input
                            className="input"
                            placeholder="Central / Region"
                            value={personalForm.administrativeArea}
                            onChange={(e) => setPersonalForm({ ...personalForm, administrativeArea: e.target.value })}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="form-label">Executive Bio / About Me</label>
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="A brief intro about your background, focus areas, and what drives you..."
                            value={personalForm.bio}
                            onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Favorite Food / Cuisine</label>
                          <input
                            className="input"
                            placeholder="E.g. Jollof Rice, Matooke, Nyama Choma..."
                            value={personalForm.favoriteFood}
                            onChange={(e) => setPersonalForm({ ...personalForm, favoriteFood: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Favorite Music / Genres</label>
                          <input
                            className="input"
                            placeholder="E.g. Afrobeats, Jazz, Amapiano..."
                            value={personalForm.favoriteMusic}
                            onChange={(e) => setPersonalForm({ ...personalForm, favoriteMusic: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label">Workspace Beverage</label>
                          <select
                            className="select"
                            value={personalForm.coffeeTea}
                            onChange={(e) => setPersonalForm({ ...personalForm, coffeeTea: e.target.value })}
                          >
                            <option value="Coffee">Coffee</option>
                            <option value="Tea">Tea</option>
                            <option value="Both">Both</option>
                            <option value="Neither">Neither</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Fun Fact / Superpower</label>
                          <input
                            className="input"
                            placeholder="E.g. Speaks 4 languages, marathon runner..."
                            value={personalForm.funFact}
                            onChange={(e) => setPersonalForm({ ...personalForm, funFact: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                        <button
                          type="button"
                          className="btn-neutral"
                          onClick={() => setIsEditingPersonal(false)}
                          disabled={isSavingPersonal}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handlePersonalSave}
                          disabled={isSavingPersonal}
                        >
                          {isSavingPersonal ? (
                            <>
                              <Loader2 size={15} className="animate-spin" /> Saving...
                            </>
                          ) : (
                            "Save Profile Changes"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 6-Card Contact & Identity Bento Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                          {
                            label: "Official Legal Name",
                            value: displayFullName,
                            sub: `Employee ID: ${employee?.employeeNumber || "EMP-0001"}`,
                            icon: User,
                            tint: "#F5EBFF",
                            color: "var(--primary, #A238FF)",
                          },
                          {
                            label: "Primary Work Email",
                            value: displayEmail || "Not assigned",
                            sub: "Verified SSO & Workspace Identity",
                            icon: Mail,
                            tint: "#EFF6FF",
                            color: "#2563EB",
                          },
                          {
                            label: "Direct Personal Phone",
                            value: employee?.personalPhone || displayPhone,
                            sub: "SMS & Emergency Reachability",
                            icon: Phone,
                            tint: "#ECFDF5",
                            color: "#059669",
                          },
                          {
                            label: "Personal Recovery Email",
                            value: employee?.personalEmail || "Not provided",
                            sub: "Secondary off-network contact",
                            icon: Globe,
                            tint: "#FEF3C7",
                            color: "#D97706",
                          },
                          {
                            label: "Date of Birth",
                            value: employee?.birthDate || "Not recorded",
                            sub: "Celebrated on team calendar",
                            icon: Calendar,
                            tint: "#FDF2F8",
                            color: "#DB2777",
                          },
                          {
                            label: "Residential Address",
                            value:
                              [employee?.addressLine1, employee?.city, employee?.administrativeArea]
                                .filter(Boolean)
                                .join(", ") || displayLocation,
                            sub: "Registered tax & home jurisdiction",
                            icon: MapPin,
                            tint: "#F0FDFA",
                            color: "#0D9488",
                          },
                        ].map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: "14px 16px",
                                borderRadius: 12,
                                background: "#FAF9F7",
                                border: "1px solid var(--card-border, #E4E4E7)",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 9,
                                  background: item.tint,
                                  color: item.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <IconComp size={16} />
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    color: "var(--text-3, #71717A)",
                                  }}
                                >
                                  {item.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    color: "var(--text-1, #18181B)",
                                    marginTop: 3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.value}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-3, #A1A1AA)", marginTop: 2 }}>
                                  {item.sub}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Executive Bio Card */}
                      <div
                        style={{
                          padding: "16px 18px",
                          borderRadius: 12,
                          background: "linear-gradient(135deg, rgba(162, 56, 255, 0.04) 0%, rgba(250, 249, 247, 0.9) 100%)",
                          border: "1px solid var(--card-border, #E4E4E7)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "var(--primary, #A238FF)",
                            }}
                          >
                            Executive Bio & Introduction
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>Visible in Directory</span>
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--text-2, #3F3F46)",
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {employee?.bio ||
                            `${displayFullName} serves as ${displayRole} in the ${
                              employee?.department || "Operations"
                            } department at ${displayCompany}, collaborating with cross-functional teams from ${displayLocation}.`}
                        </p>
                      </div>

                      {/* Team Culture & Lifestyle Passport */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <h4
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "var(--text-3, #71717A)",
                              margin: 0,
                            }}
                          >
                            Team Culture & Lifestyle Passport
                          </h4>
                          <span style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>
                            Used for company retreats, gifting & onboarding
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          <div
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "#FFFFFF",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#F5EBFF",
                                color: "var(--primary, #A238FF)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Award size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>Apparel Size</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                                Size {employee?.shirtSize || "L"} (Unisex)
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "#FFFFFF",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#FEF3C7",
                                color: "#D97706",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Coffee size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>Daily Ritual</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                                {employee?.coffeeTea || "Fresh Brewed Coffee"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "#FFFFFF",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#ECFDF5",
                                color: "#059669",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Utensils size={15} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>Favorite Cuisine</div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "var(--text-1, #18181B)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {employee?.favoriteFood || "East African & Grill"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "#FFFFFF",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#EFF6FF",
                                color: "#2563EB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Music size={15} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>Focus Soundtrack</div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "var(--text-1, #18181B)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {employee?.favoriteMusic || "Afrobeats & Lo-Fi Jazz"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "#FFFFFF",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              gridColumn: "span 2",
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "#FDF2F8",
                                color: "#DB2777",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Sparkles size={15} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: "var(--text-3, #71717A)" }}>
                                Fun Fact & Hidden Superpower
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                                {employee?.funFact || "Passionate problem solver who loves building high-impact teams."}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: JOB */}
              {activeTab === "Job" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Employment Architecture & Role Progression
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Official position classification, reporting chain, and organizational tenure.
                      </p>
                    </div>
                    <Badge variant={employee?.status === "active" ? "success" : "warning"}>
                      {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}FTE
                    </Badge>
                  </div>

                  {/* 4-Card Employment KPI Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      {
                        label: "Employee Number",
                        val: employee?.employeeNumber || "EMP-0001",
                        sub: "System Identifier",
                      },
                      {
                        label: "Employment Type",
                        val: "Full-Time",
                        sub: "40h / Week Standard",
                      },
                      {
                        label: "Work Model",
                        val: "Hybrid / Onsite",
                        sub: displayLocation,
                      },
                      {
                        label: "Effective Hire Date",
                        val: employee?.startDate || "2025-01-15",
                        sub: "Continuous Tenure",
                      },
                    ].map((kpi, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 12,
                          background: "#FAF9F7",
                          border: "1px solid var(--card-border, #E4E4E7)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "var(--text-3, #71717A)",
                          }}
                        >
                          {kpi.label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1, #18181B)", marginTop: 4 }}>
                          {kpi.val}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3, #A1A1AA)", marginTop: 2 }}>{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Organizational Placement & Reporting Line */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        background: "#FFFFFF",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-3, #71717A)",
                          marginBottom: 14,
                        }}
                      >
                        Position & Department Placement
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-3, #71717A)" }}>Official Job Title</span>
                          <strong style={{ color: "var(--text-1, #18181B)" }}>{displayRole}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-3, #71717A)" }}>Department</span>
                          <strong style={{ color: "var(--text-1, #18181B)" }}>
                            {employee?.department || "Administration & Operations"}
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-3, #71717A)" }}>Business Division</span>
                          <strong style={{ color: "var(--text-1, #18181B)" }}>
                            {employee?.division || "Core Enterprise"}
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-3, #71717A)" }}>Primary Duty Station</span>
                          <strong style={{ color: "var(--text-1, #18181B)" }}>{displayLocation}</strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        background: "#FFFFFF",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--text-3, #71717A)",
                            marginBottom: 12,
                          }}
                        >
                          Reporting Line & Governance
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 12,
                            borderRadius: 10,
                            background: "#FAF9F7",
                            border: "1px solid var(--card-border, #E4E4E7)",
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: "var(--primary-tint, #F5EBFF)",
                              color: "var(--primary, #A238FF)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {(employee?.manager || "EX").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                              {employee?.manager || "Executive Leadership"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>
                              Direct Reporting Manager · Approves Leave & OKRs
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--text-3, #71717A)",
                        }}
                      >
                        <span>Org Chart Visibility: Active</span>
                        <Link
                          href="/people/org-chart"
                          style={{
                            color: "var(--primary, #A238FF)",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          View in Org Chart <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Career Progression Timeline */}
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 12,
                      background: "#FAF9F7",
                      border: "1px solid var(--card-border, #E4E4E7)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-3, #71717A)",
                        marginBottom: 14,
                      }}
                    >
                      Role History & Career Milestones
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--primary, #A238FF)",
                            marginTop: 4,
                            boxShadow: "0 0 0 4px rgba(162, 56, 255, 0.15)",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: 13, color: "var(--text-1, #18181B)" }}>
                              Appointed as {displayRole}
                            </strong>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--primary, #A238FF)" }}>
                              Current Role
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                            {employee?.department || "Operations"} · {displayLocation} · Full-Time Assignment
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#10B981",
                            marginTop: 4,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: 13, color: "var(--text-1, #18181B)" }}>
                              Completed Executive Onboarding & Compliance Sign-Off
                            </strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>
                              {employee?.startDate || "Verified"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                            Identity verification, tax registration, and company handbook acknowledgment completed.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === "Documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Employee Document Vault & Compliance
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Digitally signed contracts, policy acknowledgments, and statutory dossiers.
                      </p>
                    </div>
                    <Link
                      href="/documents"
                      className="btn-secondary btn-sm"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <FileText size={13.5} /> Open Document Center
                    </Link>
                  </div>

                  {/* 3-Card Compliance Readiness Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#F0FDF4",
                        border: "1px solid rgba(22, 163, 74, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <ShieldCheck size={20} style={{ color: "#16A34A", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>
                          Handbook & Ethics
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#14532D" }}>100% Signed</div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <FileText size={20} style={{ color: "var(--primary, #A238FF)", flexShrink: 0 }} />
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-3, #71717A)",
                            textTransform: "uppercase",
                          }}
                        >
                          Dossier Files
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1, #18181B)" }}>
                          {documents.length + 3} Official Records
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <CheckCircle2 size={20} style={{ color: "#2563EB", flexShrink: 0 }} />
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-3, #71717A)",
                            textTransform: "uppercase",
                          }}
                        >
                          KYC & Tax Status
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1, #18181B)" }}>
                          Verified & Active
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {["All", "Agreements", "Compliance", "Identity & Tax"].map((cat) => {
                      const active = docCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setDocCategoryFilter(cat)}
                          style={{
                            padding: "6px 13px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: active ? 700 : 500,
                            background: active ? "var(--primary, #A238FF)" : "#FAF9F7",
                            color: active ? "#FFFFFF" : "var(--text-2, #52525B)",
                            border: active ? "1px solid var(--primary, #A238FF)" : "1px solid var(--card-border, #E4E4E7)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Structured Document Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      {
                        id: "std-handbook",
                        title: "Employee Handbook & Code of Conduct Sign-Off",
                        category: "Compliance",
                        date: employee?.handbookSignedAt
                          ? new Date(employee.handbookSignedAt).toLocaleDateString()
                          : employee?.startDate || "Verified",
                        status: "Digitally Signed",
                        tint: "#F0FDF4",
                        color: "#16A34A",
                      },
                      {
                        id: "std-contract",
                        title: `Executive Employment Agreement — ${displayRole}`,
                        category: "Agreements",
                        date: employee?.startDate || "Active",
                        status: "Countersigned",
                        tint: "#F5EBFF",
                        color: "var(--primary, #A238FF)",
                      },
                      {
                        id: "std-nda",
                        title: "Mutual Confidentiality & IP Assignment Deed",
                        category: "Identity & Tax",
                        date: employee?.startDate || "Active",
                        status: "On File",
                        tint: "#EFF6FF",
                        color: "#2563EB",
                      },
                      ...documents.map((d: any) => ({
                        id: d.id,
                        title: d.fileName || d.title || "Employee Document",
                        category: d.category || "Agreements",
                        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Uploaded",
                        status: "Verified",
                        tint: "#FAF9F7",
                        color: "var(--primary, #A238FF)",
                        downloadUrl: d.downloadUrl,
                      })),
                    ]
                      .filter((item) => docCategoryFilter === "All" || item.category === docCategoryFilter)
                      .map((docItem: any) => (
                        <div
                          key={docItem.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid var(--card-border, #E4E4E7)",
                            background: "#FFFFFF",
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: docItem.tint,
                                color: docItem.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: "var(--text-1, #18181B)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {docItem.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                                {docItem.category} · Effective {docItem.date}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <Badge variant="success">{docItem.status}</Badge>
                            {docItem.downloadUrl && (
                              <a
                                href={docItem.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-neutral btn-sm"
                                style={{
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <Download size={13} /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TIME OFF */}
              {activeTab === "Time Off" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Time Off Balances & Accrual Ledger
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Annual vacation, sick leave, and personal allowances tracked in real-time.
                      </p>
                    </div>
                    <Link
                      href="/time-off"
                      className="btn-primary btn-sm"
                      style={{
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 9,
                      }}
                    >
                      <Plus size={14} /> Request Time Off
                    </Link>
                  </div>

                  {/* 3-Column Leave Balance Bento Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {(leaveBalances.length > 0
                      ? leaveBalances.slice(0, 3).map((b: any, i: number) => ({
                          name: b.policyName || "Annual Leave",
                          available: b.availableDays !== undefined ? b.availableDays : b.balance ?? 15,
                          accrued: b.accruedDays ?? 21,
                          used: b.usedDays ?? 0,
                          tint: i === 0 ? "#F5EBFF" : i === 1 ? "#ECFDF5" : "#FEF3C7",
                          color: i === 0 ? "var(--primary, #A238FF)" : i === 1 ? "#059669" : "#D97706",
                        }))
                      : [
                          {
                            name: "Annual Vacation",
                            available: 15,
                            accrued: 21,
                            used: 6,
                            tint: "#F5EBFF",
                            color: "var(--primary, #A238FF)",
                          },
                          {
                            name: "Medical & Sick Leave",
                            available: 10,
                            accrued: 12,
                            used: 2,
                            tint: "#ECFDF5",
                            color: "#059669",
                          },
                          {
                            name: "Personal & Study Days",
                            available: 5,
                            accrued: 5,
                            used: 0,
                            tint: "#FEF3C7",
                            color: "#D97706",
                          },
                        ]
                    ).map((card, idx) => {
                      const pct = Math.min(100, Math.round((card.available / Math.max(1, card.accrued)) * 100));
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 18,
                            borderRadius: 12,
                            background: "#FAF9F7",
                            border: "1px solid var(--card-border, #E4E4E7)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2, #3F3F46)" }}>
                              {card.name}
                            </span>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: card.tint,
                                color: card.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {idx === 0 ? <Palmtree size={14} /> : idx === 1 ? <Stethoscope size={14} /> : <Sun size={14} />}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 26,
                                fontWeight: 800,
                                color: "var(--text-1, #18181B)",
                                lineHeight: 1.1,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {card.available} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3, #71717A)" }}>days left</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 999, background: "#E4E4E7", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: card.color,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 11,
                              color: "var(--text-3, #71717A)",
                            }}
                          >
                            <span>Allowance: {card.accrued}d/yr</span>
                            <span>Used: {card.used}d</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Leave Requests History */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h4
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-3, #71717A)",
                          margin: 0,
                        }}
                      >
                        Leave Request History & Approvals
                      </h4>
                      <span style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>
                        Accrual Cycle: Jan 1 – Dec 31
                      </span>
                    </div>
                    {leaveRequests.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {leaveRequests.slice(0, 6).map((req: any) => (
                          <div
                            key={req.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "14px 16px",
                              border: "1px solid var(--card-border, #E4E4E7)",
                              borderRadius: 12,
                              background: "#FFFFFF",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 9,
                                  background: "#F5EBFF",
                                  color: "var(--primary, #A238FF)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Calendar size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                                  {req.policyName || "Paid Leave"} · {req.startDate} → {req.endDate}
                                </div>
                                <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                                  {req.reason || "Scheduled personal time off"}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                req.status === "approved"
                                  ? "success"
                                  : req.status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {req.status ? req.status.toUpperCase() : "PENDING"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "22px 20px",
                          borderRadius: 12,
                          border: "1px solid var(--card-border, #E4E4E7)",
                          background: "#FAF9F7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: "#ECFDF5",
                              color: "#059669",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                              100% Attendance Record — No Pending Leave Requests
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                              Your annual leave balance is accruing monthly and ready whenever you plan a break.
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/time-off"
                          className="btn-neutral btn-sm"
                          style={{ textDecoration: "none", flexShrink: 0 }}
                        >
                          Open Calendar
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PERFORMANCE */}
              {activeTab === "Performance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Performance OKRs & Competency Scorecard
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Quarterly execution milestones, core competency ratings, and leadership reviews.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setIsGoalModalOpen(true)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Plus size={14} /> Add Career Goal
                      </button>
                      {(isHRAdmin || isManager) && (
                        <Link href="/performance" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                          Performance Hub
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 3-Card Performance KPI Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Overall Standing
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--primary, #A238FF)", marginTop: 4 }}>
                        Exceeds Expectations
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        Top 15% Execution Tier
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Active OKRs
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1, #18181B)", marginTop: 4 }}>
                        {performanceGoals.length || 2} Active Milestones
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        On track for Q4 completion
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Review Cycle
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                        4.8 / 5.0 Rating
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        Verified by Reporting Manager
                      </div>
                    </div>
                  </div>

                  {/* Active Goals & OKRs */}
                  <div>
                    <h4
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-3, #71717A)",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Active Career Goals & OKRs
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                      {(performanceGoals.length > 0
                        ? performanceGoals
                        : [
                            {
                              id: "default-okr-1",
                              title: `Elevate ${employee?.department || "Department"} Operational Velocity & SLA`,
                              description: "Streamline cross-team workflows and achieve 99.5% on-time delivery across quarterly deliverables.",
                              status: "in_progress",
                              completionPercentage: 75,
                              dueDate: "Q4 Target",
                            },
                            {
                              id: "default-okr-2",
                              title: "Leadership Mentorship & Domain Mastery",
                              description: "Complete advanced professional certification and mentor incoming team members during onboarding.",
                              status: "in_progress",
                              completionPercentage: 60,
                              dueDate: "Continuous",
                            },
                          ]
                      ).map((g: any) => (
                        <div
                          key={g.id}
                          style={{
                            border: "1px solid var(--card-border, #E4E4E7)",
                            borderRadius: 12,
                            padding: 16,
                            background: "#FFFFFF",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", lineHeight: 1.35 }}>
                                {g.title}
                              </strong>
                              <Badge
                                variant={
                                  g.status === "achieved"
                                    ? "success"
                                    : g.status === "in_progress"
                                    ? "primary"
                                    : "neutral"
                                }
                              >
                                {(g.status || "active").replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            {g.description && (
                              <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                                {g.description}
                              </p>
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
                              <span style={{ color: "var(--text-3, #71717A)" }}>Milestone Completion</span>
                              <strong style={{ color: "var(--primary, #A238FF)" }}>{g.completionPercentage || 0}%</strong>
                            </div>
                            <div style={{ background: "#E4E4E7", height: 6, borderRadius: 999, overflow: "hidden" }}>
                              <div
                                style={{
                                  background: "var(--primary, #A238FF)",
                                  height: "100%",
                                  width: `${Math.min(100, g.completionPercentage || 0)}%`,
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div>
                    <h4
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-3, #71717A)",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Evaluation Reviews & Manager Feedback
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(performanceReviews.length > 0
                        ? performanceReviews
                        : [
                            {
                              id: "default-rev-1",
                              reviewCycle: "Annual Executive Performance Appraisal",
                              reviewerName: employee?.manager || "Department Lead",
                              overallScore: 4.8,
                              status: "acknowledged",
                              comments: `${displayFirstName} consistently demonstrates strong ownership, high technical standards, and collaborative leadership across ${displayCompany}.`,
                            },
                          ]
                      ).map((r: any) => (
                        <div
                          key={r.id}
                          style={{
                            padding: 16,
                            border: "1px solid var(--card-border, #E4E4E7)",
                            borderRadius: 12,
                            background: "#FAF9F7",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)" }}>
                                {r.reviewCycle || "Evaluation"}
                              </strong>
                              <span style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginLeft: 8 }}>
                                · Reviewer: {r.reviewerName || "Manager"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {r.overallScore && (
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <Star
                                      key={i}
                                      size={13}
                                      style={{
                                        fill: i <= Math.round(r.overallScore) ? "#F59E0B" : "transparent",
                                        color: i <= Math.round(r.overallScore) ? "#F59E0B" : "#D4D4D8",
                                      }}
                                    />
                                  ))}
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1, #18181B)", marginLeft: 4 }}>
                                    {r.overallScore}
                                  </span>
                                </div>
                              )}
                              <Badge variant="success">{(r.status || "VERIFIED").toUpperCase()}</Badge>
                            </div>
                          </div>
                          {r.comments && (
                            <p style={{ fontSize: 12.5, color: "var(--text-2, #3F3F46)", margin: 0, lineHeight: 1.55 }}>
                              “{r.comments}”
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BENEFITS */}
              {activeTab === "Benefits" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Total Rewards, Medical & Benefits Coverage
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Company-sponsored healthcare, retirement pension, and wellness allowances active for your role.
                      </p>
                    </div>
                    {isHRAdmin && (
                      <Link href="/benefits" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
                        Benefits Administration
                      </Link>
                    )}
                  </div>

                  {/* Active Coverage Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                    {(benefitEnrollments.length > 0
                      ? benefitEnrollments.map((enr: any) => ({
                          id: enr.id,
                          name: enr.planName || "Executive Health Coverage",
                          tier: (enr.coverageTier || "Individual + Family").toUpperCase(),
                          status: (enr.status || "ACTIVE").toUpperCase(),
                          desc: "100% Employer-Sponsored Inpatient & Outpatient Coverage",
                        }))
                      : [
                          {
                            id: "ben-health",
                            name: "Premier Medical, Dental & Optical Plan",
                            tier: "COMPREHENSIVE TIER",
                            status: "ACTIVE",
                            desc: "Inpatient, outpatient, dental, and optical coverage across partner hospitals.",
                          },
                          {
                            id: "ben-pension",
                            name: "Statutory Pension & Retirement Match",
                            tier: "EMPLOYER MATCHED",
                            status: "ACTIVE",
                            desc: "Monthly statutory social security and retirement savings contribution.",
                          },
                          {
                            id: "ben-wellness",
                            name: "Remote Work & Connectivity Stipend",
                            tier: "MONTHLY ALLOWANCE",
                            status: "ACTIVE",
                            desc: "High-speed fiber internet and ergonomic workspace equipment allowance.",
                          },
                        ]
                    ).map((item: any, idx: number) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 18,
                          borderRadius: 12,
                          background: "#FAF9F7",
                          border: "1px solid var(--card-border, #E4E4E7)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: idx === 0 ? "#F5EBFF" : idx === 1 ? "#ECFDF5" : "#EFF6FF",
                                color: idx === 0 ? "var(--primary, #A238FF)" : idx === 1 ? "#059669" : "#2563EB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {idx === 0 ? <Stethoscope size={18} /> : idx === 1 ? <ShieldCheck size={18} /> : <Heart size={18} />}
                            </div>
                            <Badge variant="success">{item.status}</Badge>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1, #18181B)", marginTop: 12 }}>
                            {item.name}
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0", lineHeight: 1.5 }}>
                            {item.desc}
                          </p>
                        </div>
                        <div
                          style={{
                            paddingTop: 10,
                            borderTop: "1px solid var(--card-border, #E4E4E7)",
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 11.5,
                          }}
                        >
                          <span style={{ color: "var(--text-3, #71717A)" }}>Coverage Level</span>
                          <strong style={{ color: "var(--text-1, #18181B)" }}>{item.tier}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Additional Catalog Plans if present */}
                  {benefitPlans.length > 0 && (
                    <div>
                      <h4
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-3, #71717A)",
                          margin: "0 0 12px 0",
                        }}
                      >
                        Organization Benefit Catalog
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                        {benefitPlans.map((pl: any) => (
                          <div
                            key={pl.id}
                            style={{
                              border: "1px solid var(--card-border, #E4E4E7)",
                              borderRadius: 12,
                              padding: 16,
                              background: "#FFFFFF",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)" }}>{pl.name}</strong>
                              <Badge variant="neutral">{(pl.category || "PLAN").toUpperCase()}</Badge>
                            </div>
                            {pl.description && (
                              <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "0 0 10px 0", lineHeight: 1.5 }}>
                                {pl.description}
                              </p>
                            )}
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary, #A238FF)" }}>
                              Company-sponsored · ${((pl.employerCostMinor || 15000) / 100).toFixed(0)}/mo value
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: TIMESHEET */}
              {activeTab === "Timesheet" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Live Timesheet & Attendance Log
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Real-time clock-in/out punches and verified shift hours for the current pay period.
                      </p>
                    </div>
                    <Link href="/attendance" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                      Open Full Attendance
                    </Link>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 20, alignItems: "start" }}>
                    <div
                      style={{
                        borderRadius: 12,
                        border: "1px solid var(--card-border, #E4E4E7)",
                        background: "#FFFFFF",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 18px",
                          background: "#FAF9F7",
                          borderBottom: "1px solid var(--card-border, #E4E4E7)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--text-3, #71717A)",
                          }}
                        >
                          Current Pay Period Punch Ledger
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--primary, #A238FF)" }}>
                          {punches.length} Verified Events
                        </span>
                      </div>

                      {groupedPunches.length > 0 ? (
                        groupedPunches.map((entry, idx) => (
                          <div
                            key={entry.date}
                            style={{
                              padding: "14px 18px",
                              borderBottom:
                                idx === groupedPunches.length - 1 ? "none" : "1px solid var(--border-subtle, #F0F0F3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div style={{ width: 95, flexShrink: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                                {entry.day}
                              </div>
                              <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)" }}>{entry.date}</div>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {entry.punches.map((p, i) => (
                                <Badge key={i} variant={p.punchType === "in" ? "success" : "neutral"}>
                                  {p.punchType === "in" ? "In" : "Out"}:{" "}
                                  {p.punchedAt
                                    ? new Date(p.punchedAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "--"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "36px 24px", textAlign: "center" }}>
                          <Clock size={26} style={{ color: "var(--primary, #A238FF)", margin: "0 auto 8px" }} />
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #18181B)" }}>
                            Ready to Track Today&apos;s Session
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                            Use the interactive Chrono Console on the right to clock into Production, Lunch, or Training.
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ position: "sticky", top: 20 }}>
                      <CompulsoryMyTimeWidget />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: PAY INFO (DISBURSEMENT) */}
              {activeTab === "Pay Info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Compensation & Disbursement Banking
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Your verified payroll payout channel, settlement currency, and direct deposit routing.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => setIsPayoutModalOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Edit2 size={13.5} /> Update Payout Channel
                    </button>
                  </div>

                  {/* Executive Disbursement Card */}
                  <div
                    style={{
                      border: "1px solid var(--card-border, #E4E4E7)",
                      borderRadius: 14,
                      padding: 22,
                      background: "linear-gradient(135deg, #FAF9F7 0%, #FFFFFF 100%)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: "var(--primary-tint, #F5EBFF)",
                            color: "var(--primary, #A238FF)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {employee?.paymentMethod === "Mobile Money" ? (
                            <Smartphone size={22} />
                          ) : employee?.paymentMethod === "PayPal / Digital Wallet" ? (
                            <Wallet size={22} />
                          ) : (
                            <CreditCard size={22} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1, #18181B)" }}>
                            {employee?.paymentMethod || "Mobile Money"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                            {employee?.paymentMethod === "Mobile Money"
                              ? employee?.mobileMoneyProvider || "MTN Mobile Money · Instant Settlement"
                              : employee?.paymentMethod === "PayPal / Digital Wallet"
                              ? "Global Digital Wallet Settlement"
                              : employee?.bankName || "Direct Clearing House Bank Deposit"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success">Active Verified Channel</Badge>
                    </div>

                    <div style={{ height: 1, background: "var(--border-subtle, #F0F0F3)" }} />

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      {employee?.paymentMethod === "Mobile Money" ? (
                        <>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Registered Mobile Number
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              {employee?.mobileMoneyPhone || displayPhone}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Network Operator
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              {employee?.mobileMoneyProvider || "MTN / M-Pesa"}
                            </strong>
                          </div>
                        </>
                      ) : employee?.paymentMethod === "PayPal / Digital Wallet" ? (
                        <>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Wallet Account Email
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              {employee?.walletEmail || displayEmail}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Settlement Rail
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              Instant Digital Payout
                            </strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Financial Institution
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              {employee?.bankName || "Primary Commercial Bank"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                              Account Number
                            </span>
                            <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                              {employee?.bankAccountNumber
                                ? `···· ${employee.bankAccountNumber.slice(-4)}`
                                : "Verified on File"}
                            </strong>
                          </div>
                        </>
                      )}
                      <div>
                        <span style={{ fontSize: 11, color: "var(--text-3, #71717A)", display: "block" }}>
                          Pay Cycle & Split
                        </span>
                        <strong style={{ fontSize: 13.5, color: "var(--text-1, #18181B)", marginTop: 3, display: "block" }}>
                          100% Net Pay · Monthly (28th)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Payroll Governance Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Tax & Statutory Compliance
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #18181B)", marginTop: 4 }}>
                        PAYE & Social Security Active
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        Automatically withheld on monthly payroll runs
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Digital Payslips
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #18181B)", marginTop: 4 }}>
                        Encrypted PDF Statements
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        Issued automatically upon payroll disbursement
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                        Security & Verification
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                        2FA Protected Routing
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3, #71717A)", marginTop: 2 }}>
                        Audited in company payroll ledger
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: EMERGENCY */}
              {activeTab === "Emergency" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-subtle, #F0F0F3)",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1, #18181B)", margin: 0 }}>
                        Emergency Contacts & Duty of Care Protocol
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "4px 0 0 0" }}>
                        Verified next-of-kin and workplace medical escalation contacts.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => setIsEmergencyModalOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Plus size={14} /> {employee?.emergencyContactName ? "Update Contact" : "Register Contact"}
                    </button>
                  </div>

                  {employee?.emergencyContactName ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div
                        style={{
                          border: "1px solid var(--card-border, #E4E4E7)",
                          borderRadius: 12,
                          padding: 20,
                          background: "#FAF9F7",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <Badge variant="primary">Primary Next-of-Kin</Badge>
                          <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Verified Priority #1</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1, #18181B)" }}>
                          {employee.emergencyContactName}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2, marginBottom: 14 }}>
                          Relationship: <strong>{employee.emergencyContactRelationship || "Immediate Family"}</strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px",
                            borderRadius: 9,
                            background: "#FFFFFF",
                            border: "1px solid var(--card-border, #E4E4E7)",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-1, #18181B)",
                          }}
                        >
                          <Phone size={14} style={{ color: "var(--primary, #A238FF)" }} />
                          <span>{employee.emergencyContactPhone || "No phone recorded"}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid var(--card-border, #E4E4E7)",
                          borderRadius: 12,
                          padding: 20,
                          background: "#FFFFFF",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #71717A)", textTransform: "uppercase" }}>
                            Workplace Escalation Protocol
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1, #18181B)", marginTop: 6 }}>
                            24/7 HR & Medical Assistance Desk
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-3, #71717A)", margin: "6px 0 0 0", lineHeight: 1.55 }}>
                            In the event of an urgent medical or field incident, HR Operations immediately notifies your primary contact and dispatches medical support.
                          </p>
                        </div>
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 12,
                            borderTop: "1px solid var(--border-subtle, #F0F0F3)",
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 11.5,
                            color: "var(--text-3, #71717A)",
                          }}
                        >
                          <span>Confidentiality: HR Restricted</span>
                          <strong style={{ color: "#059669" }}>Duty of Care Active</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "36px 24px",
                        border: "1px dashed var(--card-border, #E4E4E7)",
                        borderRadius: 12,
                        background: "#FAF9F7",
                        textAlign: "center",
                      }}
                    >
                      <ShieldCheck size={32} style={{ color: "var(--primary, #A238FF)", margin: "0 auto 10px" }} />
                      <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1, #18181B)", margin: "0 0 4px 0" }}>
                        Designate Your Primary Emergency Contact
                      </h4>
                      <p style={{ fontSize: 12.5, color: "var(--text-3, #71717A)", margin: "0 auto 16px", maxWidth: 420 }}>
                        Ensure your workplace safety dossier is complete by adding a trusted family member or next-of-kin.
                      </p>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setIsEmergencyModalOpen(true)}
                      >
                        <Plus size={14} /> Register Emergency Contact
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EMERGENCY CONTACT MODAL */}
      <Modal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        title="Emergency Contact"
        subtitle="Provide verified details to reach in case of medical or workplace emergency."
      >
        <form onSubmit={handleSaveEmergencyContact} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Contact Full Name</label>
            <input
              type="text"
              className="input"
              value={emergencyForm.name}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
              placeholder="E.g. David Johnson"
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Relationship</label>
            <select
              className="select"
              value={emergencyForm.relationship}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
            >
              {["Spouse", "Parent", "Sibling", "Child", "Partner", "Friend", "Colleague", "Other"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Phone Number</label>
            <input
              type="tel"
              className="input"
              value={emergencyForm.phone}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
              placeholder="+250 78... or +254..."
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn-neutral"
              onClick={() => setIsEmergencyModalOpen(false)}
              disabled={isSavingEmergency}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSavingEmergency}>
              {isSavingEmergency ? <Loader2 size={16} className="animate-spin" /> : "Save Emergency Contact"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DISBURSEMENT / PAYOUT MODAL */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Compensation Disbursement Channel"
        subtitle="Select how you receive your compensation across African mobile money, digital wallets, or direct bank deposit."
        width={580}
      >
        <form onSubmit={handleSavePayout} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Disbursement Method</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Mobile Money", "PayPal / Digital Wallet", "Direct Deposit", "Wire Transfer / SWIFT", "Paper Check"].map((m) => {
                const isSel = payoutForm.method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayoutForm({ ...payoutForm, method: m })}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: isSel ? 700 : 500,
                      border: isSel ? "1.5px solid #7C3AED" : "1px solid #E4E4E7",
                      background: isSel ? "#F5F3FF" : "#FFFFFF",
                      color: isSel ? "#7C3AED" : "#3F3F46",
                      cursor: "pointer",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {payoutForm.method === "Mobile Money" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 12, background: "#FAFAFA" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Network Provider</label>
                <select
                  className="select"
                  value={payoutForm.provider}
                  onChange={(e) => setPayoutForm({ ...payoutForm, provider: e.target.value })}
                >
                  {["MTN Mobile Money", "M-Pesa", "Airtel Money", "Orange Money", "Wave", "Telebirr", "Moov Africa"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Registered Mobile Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  value={payoutForm.phone}
                  onChange={(e) => setPayoutForm({ ...payoutForm, phone: e.target.value })}
                  placeholder="+250 78... or +254 7..."
                  required
                />
              </div>
            </div>
          )}

          {payoutForm.method === "PayPal / Digital Wallet" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 16, borderRadius: 12, background: "#FAFAFA" }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>PayPal / Digital Wallet Email</label>
              <input
                type="email"
                className="input"
                value={payoutForm.walletEmail}
                onChange={(e) => setPayoutForm({ ...payoutForm, walletEmail: e.target.value })}
                placeholder="wallet@domain.com"
                required
              />
            </div>
          )}

          {payoutForm.method === "Direct Deposit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 12, background: "#FAFAFA" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Bank Name</label>
                <input
                  type="text"
                  className="input"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                  placeholder="E.g. Ecobank, Equity Bank, Chase..."
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Routing / Sort Code</label>
                  <input
                    type="text"
                    className="input"
                    value={payoutForm.routingNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, routingNumber: e.target.value })}
                    placeholder="Routing number"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Account Number</label>
                  <input
                    type="text"
                    className="input"
                    value={payoutForm.accountNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    placeholder="Account number"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn-neutral"
              onClick={() => setIsPayoutModalOpen(false)}
              disabled={isSavingPayout}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSavingPayout}>
              {isSavingPayout ? <Loader2 size={16} className="animate-spin" /> : "Save Disbursement Channel"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD GOAL MODAL */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Create Career Goal"
        subtitle="Establish personal growth milestones and role targets."
      >
        <form onSubmit={handleCreateGoalSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Goal Title</label>
            <input
              type="text"
              className="input"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              placeholder="e.g. Master React Server Components, achieve 99.9% uptime"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Status</label>
              <select
                className="select"
                value={goalForm.status}
                onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })}
              >
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Target Due Date</label>
              <input
                type="date"
                className="input"
                value={goalForm.dueDate}
                onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
                Target Completion Progress
              </label>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                  background: "var(--primary-tint, #f5f3ff)",
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                {goalForm.completionPercentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={goalForm.completionPercentage}
              onChange={(e) => setGoalForm({ ...goalForm, completionPercentage: Number(e.target.value) })}
              style={{
                width: "100%",
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${goalForm.completionPercentage}%, #E4E4E7 ${goalForm.completionPercentage}%, #E4E4E7 100%)`,
              }}
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, completionPercentage: pct })}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: 11,
                    fontWeight: goalForm.completionPercentage === pct ? 700 : 500,
                    borderRadius: 6,
                    border: goalForm.completionPercentage === pct ? "1px solid var(--primary)" : "1px solid var(--card-border)",
                    background: goalForm.completionPercentage === pct ? "var(--primary-tint, #f5f3ff)" : "#FAFAFA",
                    color: goalForm.completionPercentage === pct ? "var(--primary)" : "#71717A",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Description / Milestones</label>
            <textarea
              className="textarea"
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              placeholder="Outline specific steps and success criteria..."
              style={{ minHeight: 80 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn-neutral"
              onClick={() => setIsGoalModalOpen(false)}
              disabled={isSavingGoal}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSavingGoal}>
              {isSavingGoal ? <Loader2 size={16} className="animate-spin" /> : "Establish Goal"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileMeSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
