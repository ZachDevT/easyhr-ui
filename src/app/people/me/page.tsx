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
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { CompulsoryMyTimeWidget } from "@/components/widgets";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileMeSkeleton } from "@/components/ui/Skeleton";
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

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg-page)", display: "flex", flexDirection: "column" }}>
      {/* Hero Banner Header */}
      <div style={{ margin: "0 0 20px 0" }}>
        <PageHeader
          variant="card"
          title={displayFullName}
          subtitle={`${displayRole} · ${displayCompany}`}
          icon={
            <div
              className="avatar-hover-container"
              style={{
                position: "relative",
                width: 100,
                height: 100,
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.25)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change photo"
            >
              <Avatar
                name={displayFullName}
                src={employee?.avatarUrl || employee?.avatar || userProfile?.avatarUrl}
                size="xl"
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
              <div
                className="avatar-hover-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.65)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  userSelect: "none",
                }}
              >
                {isUploadingAvatar ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={22} />
                    <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Change Photo</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarFileChange}
              />
            </div>
          }
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Grid Area */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 36, padding: "24px", position: "relative" }}>
        {/* Left Column: Vitals & Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <h3 className="text-sm fw-600 text-2 mb-12">Official Vitals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="row gap-12 text-xs text-4 align-center">
                <Phone size={14} /> <span className="text-1">{displayPhone}</span>
              </div>
              <div className="row gap-12 text-xs text-4 align-center">
                <Monitor size={14} /> <span className="text-1">{displayEmail}</span>
              </div>
              <div className="row gap-12 text-xs text-4 align-center">
                <Clock size={14} /> <span className="text-1">{employee?.status === "active" ? "Active Now" : "Onboarding"}</span>
              </div>
              <div className="row gap-12 text-xs text-4 align-center">
                <MapPin size={14} /> <span className="text-1">{displayLocation}</span>
              </div>
              <div className="row gap-12 text-xs text-4 align-center">
                <Building size={14} />
                <div className="text-1">
                  <div>{displayCompany}</div>
                  <div className="text-5 mt-2">{employee?.department || "General"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div>
            <h3 className="text-sm fw-600 text-2 mb-12">Employment Record</h3>
            <div className="row gap-12 text-xs text-4">
              <Calendar size={14} />
              <div className="text-1">
                <div className="row gap-8 align-center">
                  <Badge variant={employee?.status === "active" ? "success" : "warning"}>
                    {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}
                  </Badge>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>
                    {employee?.employeeNumber || "EMP-0001"}
                  </span>
                </div>
                <div className="text-5 mt-4">
                  {employee?.startDate ? `Hired on ${employee.startDate}` : "Active Member"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 14,
            padding: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minHeight: 520,
          }}
        >
          {/* TAB 1: PERSONAL */}
          {activeTab === "Personal" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Personal & Culture Profile</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Your official contact details, residential address, bio, and team culture favorites.
                  </p>
                </div>
                {!isEditingPersonal && (
                  <button
                    className="btn-primary btn-sm row gap-6 align-center"
                    onClick={() => setIsEditingPersonal(true)}
                  >
                    <Edit2 size={14} /> Edit Info
                  </button>
                )}
              </div>

              {isEditingPersonal ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 20px" }}>
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
                      <label className="form-label">T-Shirt Size</label>
                      <select
                        className="select"
                        value={personalForm.shirtSize}
                        onChange={(e) => setPersonalForm({ ...personalForm, shirtSize: e.target.value })}
                      >
                        {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
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
                      <label className="form-label">About Me / Bio</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="A brief intro about what you do..."
                        value={personalForm.bio}
                        onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Favorite Food</label>
                      <input
                        className="input"
                        placeholder="E.g. Jollof Rice, Matooke, Nyama Choma..."
                        value={personalForm.favoriteFood}
                        onChange={(e) => setPersonalForm({ ...personalForm, favoriteFood: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Favorite Music / Artists</label>
                      <input
                        className="input"
                        placeholder="E.g. Afrobeats, Jazz, Reggae..."
                        value={personalForm.favoriteMusic}
                        onChange={(e) => setPersonalForm({ ...personalForm, favoriteMusic: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Coffee or Tea</label>
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
                        placeholder="E.g. Can solve a Rubik's cube..."
                        value={personalForm.funFact}
                        onChange={(e) => setPersonalForm({ ...personalForm, funFact: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row gap-12 mt-32 justify-end">
                    <button
                      className="btn-neutral"
                      onClick={() => setIsEditingPersonal(false)}
                      disabled={isSavingPersonal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handlePersonalSave}
                      disabled={isSavingPersonal}
                    >
                      {isSavingPersonal ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Profile Changes"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 20px" }}>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Official Full Name</label>
                      <div className="text-sm text-1 fw-700">{displayFullName}</div>
                    </div>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Work Email</label>
                      <div className="text-sm text-1">{displayEmail}</div>
                    </div>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Personal Phone</label>
                      <div className="text-sm text-1">{employee?.personalPhone || "Not provided"}</div>
                    </div>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Personal Email</label>
                      <div className="text-sm text-1">{employee?.personalEmail || "Not provided"}</div>
                    </div>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Birth Date</label>
                      <div className="text-sm text-1">{employee?.birthDate || "Not recorded"}</div>
                    </div>
                    <div>
                      <label className="text-xs text-5 mb-4 block">Residential Address</label>
                      <div className="text-sm text-1">
                        {[employee?.addressLine1, employee?.city, employee?.administrativeArea]
                          .filter(Boolean)
                          .join(", ") || "No address on file"}
                      </div>
                    </div>
                  </div>

                  {employee?.bio && (
                    <div style={{ padding: 16, background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6" }}>
                      <span className="text-xs text-5 fw-600 block mb-4">About Me</span>
                      <p className="text-sm text-2 m-0" style={{ lineHeight: 1.6 }}>{employee.bio}</p>
                    </div>
                  )}

                  {/* Culture & Team Favorites */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                    <h4 className="text-sm fw-700 text-1 mb-16">Team Culture & Favorites</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      <div style={{ padding: 12, borderRadius: 8, background: "#FAFAFA", border: "1px solid #F4F4F5" }}>
                        <span className="text-xs text-5 block mb-2">T-Shirt Size</span>
                        <strong className="text-sm text-1">{employee?.shirtSize || "L"}</strong>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: "#FAFAFA", border: "1px solid #F4F4F5" }}>
                        <span className="text-xs text-5 block mb-2">Beverage</span>
                        <strong className="text-sm text-1">{employee?.coffeeTea || "Coffee"}</strong>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: "#FAFAFA", border: "1px solid #F4F4F5" }}>
                        <span className="text-xs text-5 block mb-2">Favorite Food</span>
                        <strong className="text-sm text-1">{employee?.favoriteFood || "Not specified"}</strong>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: "#FAFAFA", border: "1px solid #F4F4F5" }}>
                        <span className="text-xs text-5 block mb-2">Music & Genres</span>
                        <strong className="text-sm text-1">{employee?.favoriteMusic || "Not specified"}</strong>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: "#FAFAFA", border: "1px solid #F4F4F5", gridColumn: "span 2" }}>
                        <span className="text-xs text-5 block mb-2">Fun Fact / Superpower</span>
                        <strong className="text-sm text-1">{employee?.funFact || "Not specified"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JOB */}
          {activeTab === "Job" && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-700 text-1 m-0">Official Employment Record</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 24px" }}>
                <div>
                  <label className="text-xs text-5 mb-4 block">Official Job Title</label>
                  <div className="text-sm text-1 fw-700">{displayRole}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Employee ID / Number</label>
                  <div className="text-sm text-1 fw-700">{employee?.employeeNumber || "EMP-0001"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Department</label>
                  <div className="text-sm text-1">{employee?.department || "Administration"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Division</label>
                  <div className="text-sm text-1">{employee?.division || "General Operations"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Work Location</label>
                  <div className="text-sm text-1">{employee?.location || "Headquarters"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Reports To (Manager)</label>
                  <div className="text-sm text-1 fw-600">{employee?.manager || "Direct Executive"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Hire Date / Effective On</label>
                  <div className="text-sm text-1">{employee?.startDate || "Active member"}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Employment Status</label>
                  <div>
                    <Badge variant={employee?.status === "active" ? "success" : "warning"}>
                      {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY */}
          {activeTab === "Emergency" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Emergency Contacts</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Verified contacts designated in case of medical or workplace emergencies.
                  </p>
                </div>
                <button
                  className="btn-primary btn-sm row gap-6 align-center"
                  onClick={() => setIsEmergencyModalOpen(true)}
                >
                  <Plus size={14} /> {employee?.emergencyContactName ? "Edit Contact" : "Add Contact"}
                </button>
              </div>

              {employee?.emergencyContactName ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 24,
                      background: "#FAFAFA",
                    }}
                  >
                    <Badge variant="primary" style={{ marginBottom: 12 }}>
                      Primary Contact
                    </Badge>
                    <div className="text-base fw-700 text-1 mb-2">{employee.emergencyContactName}</div>
                    <div className="text-xs text-5 mb-14 fw-600">
                      {employee.emergencyContactRelationship || "Family"}
                    </div>
                    <div className="row gap-8 text-sm text-2 mb-6 align-center">
                      <Phone size={14} color="var(--primary)" />
                      <span>{employee.emergencyContactPhone || "No phone recorded"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px 20px", border: "1px dashed var(--border)", borderRadius: 12 }}>
                  <AlertCircle size={32} color="#9CA3AF" style={{ margin: "0 auto 12px" }} />
                  <h4 className="text-sm fw-700 text-1 m-0 mb-4">No emergency contact registered yet</h4>
                  <p className="text-xs text-5 m-0 mb-16">
                    Add a designated family member or friend to reach in case of an emergency.
                  </p>
                  <button className="btn-primary btn-sm" onClick={() => setIsEmergencyModalOpen(true)}>
                    <Plus size={14} /> Register Contact Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAY INFO (DISBURSEMENT) */}
          {activeTab === "Pay Info" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Compensation & Disbursement</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Your active payroll payout channel and disbursement account details.
                  </p>
                </div>
                <button
                  className="btn-primary btn-sm row gap-6 align-center"
                  onClick={() => setIsPayoutModalOpen(true)}
                >
                  <Edit2 size={14} /> Update Payout Channel
                </button>
              </div>

              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 24,
                  background: "#FAFAFA",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div className="row-between align-center">
                  <div className="row gap-12 align-center">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#F5F3FF",
                        color: "#7C3AED",
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
                        <Building size={22} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm fw-700 text-1">
                        {employee?.paymentMethod || "Mobile Money"}
                      </div>
                      <div className="text-xs text-5 mt-2">
                        {employee?.paymentMethod === "Mobile Money"
                          ? employee?.mobileMoneyProvider || "MTN Mobile Money"
                          : employee?.paymentMethod === "PayPal / Digital Wallet"
                          ? "Digital Wallet"
                          : employee?.bankName || "Direct Bank Deposit"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success">Active Verified Channel</Badge>
                </div>

                <div className="divider" />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {employee?.paymentMethod === "Mobile Money" ? (
                    <>
                      <div>
                        <span className="text-xs text-5 block mb-2">Registered Mobile Money Number</span>
                        <strong className="text-sm text-1">{employee?.mobileMoneyPhone || "Phone registered"}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-5 block mb-2">Network Provider</span>
                        <strong className="text-sm text-1">{employee?.mobileMoneyProvider || "MTN / M-Pesa"}</strong>
                      </div>
                    </>
                  ) : employee?.paymentMethod === "PayPal / Digital Wallet" ? (
                    <>
                      <div>
                        <span className="text-xs text-5 block mb-2">PayPal / Wallet Account Email</span>
                        <strong className="text-sm text-1">{employee?.walletEmail || displayEmail}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-5 block mb-2">Status</span>
                        <strong className="text-sm text-1">Digital Payout Active</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-xs text-5 block mb-2">Bank / Institution</span>
                        <strong className="text-sm text-1">{employee?.bankName || "Bank on file"}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-5 block mb-2">Account Number</span>
                        <strong className="text-sm text-1">
                          {employee?.bankAccountNumber
                            ? `···· ${employee.bankAccountNumber.slice(-4)}`
                            : "Account on file"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === "Documents" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Employee Documents & Compliance</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Official verified documentation, agreements, and handbook sign-offs.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Signed Handbook Record */}
                {employee?.handbookSignedAt && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      border: "1px solid #E4E4E7",
                      borderRadius: 10,
                      background: "#FFFFFF",
                    }}
                  >
                    <div className="row gap-12 align-center">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "#F0FDF4",
                          color: "#16A34A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <div className="text-sm fw-700 text-1">Employee Handbook & Policies Sign-Off</div>
                        <div className="text-xs text-5 mt-2">
                          Digitally signed and acknowledged on {new Date(employee.handbookSignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="success">Verified & Signed</Badge>
                  </div>
                )}

                {/* Real Documents List from backend */}
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      border: "1px solid #E4E4E7",
                      borderRadius: 10,
                      background: "#FFFFFF",
                    }}
                  >
                    <div className="row gap-12 align-center">
                      <FileText size={20} className="text-primary" />
                      <div>
                        <div className="text-sm fw-600 text-1">{doc.fileName || doc.title || "Employee Document"}</div>
                        <div className="text-xs text-5 mt-2">
                          {doc.category || "General"} · {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Uploaded"}
                        </div>
                      </div>
                    </div>
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-neutral btn-sm row gap-6 align-center"
                        style={{ textDecoration: "none" }}
                      >
                        <Download size={14} /> Download
                      </a>
                    )}
                  </div>
                ))}

                {!employee?.handbookSignedAt && documents.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 20px", border: "1px dashed var(--border)", borderRadius: 12 }}>
                    <FileText size={32} color="#9CA3AF" style={{ margin: "0 auto 12px" }} />
                    <h4 className="text-sm fw-700 text-1 m-0 mb-4">No documents on file yet</h4>
                    <p className="text-xs text-5 m-0">
                      Uploaded agreements and company documents will appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: TIME OFF */}
          {activeTab === "Time Off" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Leave Balances & Requests</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Live PTO, annual leave, and sick day balances tracked in real-time.
                  </p>
                </div>
                <Link href="/time-off" className="btn-primary btn-sm row gap-6 align-center" style={{ textDecoration: "none" }}>
                  <Plus size={14} /> Request Time Off
                </Link>
              </div>

              {leaveBalances.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                  {leaveBalances.map((bal: any) => (
                    <div
                      key={bal.id || bal.policyName}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 20,
                        textAlign: "center",
                        background: "#FAFAFA",
                      }}
                    >
                      <span className="text-xs text-4 fw-600 block mb-6">{bal.policyName || "Paid Leave"}</span>
                      <div className="text-3xl text-primary fw-800 mb-2">
                        {bal.availableDays !== undefined ? bal.availableDays : bal.balance || 0}
                      </div>
                      <span className="text-xs text-5 block mb-12">Days Available</span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", borderTop: "1px solid #E5E7EB", paddingTop: 8 }}>
                        <span>Accrued: {bal.accruedDays || 0}d</span>
                        <span>Used: {bal.usedDays || 0}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 20, background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6", marginBottom: 24, textAlign: "center" }}>
                  <span className="text-sm text-4">Standard organization PTO policies applied.</span>
                </div>
              )}

              <h4 className="text-sm fw-700 text-1 mb-14">Recent Leave Requests</h4>
              {leaveRequests.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {leaveRequests.slice(0, 5).map((req: any) => (
                    <div
                      key={req.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 14,
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: "#FFFFFF",
                      }}
                    >
                      <div>
                        <div className="text-sm fw-600 text-1">
                          {req.policyName || "Leave"} · {req.startDate} to {req.endDate}
                        </div>
                        <div className="text-xs text-5 mt-2">{req.reason || "Time off request"}</div>
                      </div>
                      <Badge variant={req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"}>
                        {req.status ? req.status.toUpperCase() : "PENDING"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "32px 20px", border: "1px dashed var(--border)", borderRadius: 10 }}>
                  <span className="text-xs text-5">No upcoming or past leave requests submitted.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TIMESHEET */}
          {activeTab === "Timesheet" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Live Timesheet & Punches</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Real-time punch records from work sessions and shift attendance.
                  </p>
                </div>
                <Link href="/attendance" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                  View Full Attendance
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    <div style={{ padding: "14px 20px", background: "#F9FAFB", borderBottom: "1px solid var(--border)" }}>
                      <h4 className="text-xs fw-700 text-4 uppercase m-0">Current Pay Period Records</h4>
                    </div>

                    {groupedPunches.length > 0 ? (
                      groupedPunches.map((entry, idx) => (
                        <div
                          key={entry.date}
                          style={{
                            padding: "16px 20px",
                            borderBottom: idx === groupedPunches.length - 1 ? "none" : "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ width: 100 }}>
                            <div className="text-sm fw-700 text-1">{entry.day}</div>
                            <div className="text-xs text-5">{entry.date}</div>
                          </div>
                          <div style={{ flex: 1, paddingLeft: 16 }}>
                            <div className="row gap-8 align-center">
                              {entry.punches.map((p, i) => (
                                <Badge key={i} variant={p.punchType === "in" ? "success" : "neutral"}>
                                  {p.punchType === "in" ? "Clock In" : "Clock Out"}:{" "}
                                  {p.punchedAt ? new Date(p.punchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 32, textAlign: "center" }}>
                        <span className="text-xs text-5">
                          No punch logs recorded yet this period. Use the punch clock to record hours.
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <div style={{ position: "sticky", top: 24 }}>
                  <CompulsoryMyTimeWidget />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PERFORMANCE */}
          {activeTab === "Performance" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Performance & Reviews</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Growth goals, quarterly reviews, and milestones.
                  </p>
                </div>
                <div className="row gap-10 align-center">
                  <button
                    className="btn-primary btn-sm row gap-6 align-center"
                    onClick={() => setIsGoalModalOpen(true)}
                  >
                    <Plus size={14} /> Add Career Goal
                  </button>
                  {(isHRAdmin || isManager) && (
                    <Link href="/performance" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                      Performance Module
                    </Link>
                  )}
                </div>
              </div>

              {/* Goals Section */}
              <h4 className="text-sm fw-700 text-1 mb-14">Active Career Goals & OKRs</h4>
              {performanceGoals.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
                  {performanceGoals.map((g: any) => (
                    <div
                      key={g.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 18,
                        background: "#FAFAFA",
                      }}
                    >
                      <div className="row-between align-start mb-8">
                        <strong className="text-sm text-1">{g.title}</strong>
                        <Badge variant={g.status === "achieved" ? "success" : g.status === "in_progress" ? "primary" : "neutral"}>
                          {(g.status || "active").replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      {g.description && (
                        <p className="text-xs text-4 m-0 mb-12" style={{ lineHeight: 1.5 }}>
                          {g.description}
                        </p>
                      )}
                      <div className="col gap-4">
                        <div className="row-between text-xs">
                          <span className="text-5">Completion</span>
                          <span className="text-1 fw-700">{g.completionPercentage || 0}%</span>
                        </div>
                        <div style={{ background: "var(--border)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                          <div
                            style={{
                              background: "var(--primary)",
                              height: "100%",
                              width: `${Math.min(100, g.completionPercentage || 0)}%`,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        {g.dueDate && (
                          <span className="text-xs text-5 mt-4">Due: {g.dueDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "28px 20px", border: "1px dashed var(--border)", borderRadius: 10, marginBottom: 28 }}>
                  <Target size={28} color="#9CA3AF" style={{ margin: "0 auto 8px" }} />
                  <span className="text-xs text-5 block">No career goals created yet. Use "Add Career Goal" to set milestones.</span>
                </div>
              )}

              {/* Reviews Section */}
              <h4 className="text-sm fw-700 text-1 mb-14">Evaluation Reviews & Feedback</h4>
              {performanceReviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {performanceReviews.map((r: any) => (
                    <div
                      key={r.id}
                      style={{
                        padding: 16,
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: "#FFFFFF",
                      }}
                    >
                      <div className="row-between align-center mb-8">
                        <div>
                          <strong className="text-sm text-1">{r.reviewCycle || "Evaluation"}</strong>
                          <span className="text-xs text-5 ml-8">Reviewer: {r.reviewerName || "Manager"}</span>
                        </div>
                        <div className="row gap-8 align-center">
                          {r.overallScore && (
                            <div className="row gap-2 align-center">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  style={{
                                    fill: i <= Math.round(r.overallScore) ? "#F59E0B" : "transparent",
                                    color: i <= Math.round(r.overallScore) ? "#F59E0B" : "var(--border)",
                                  }}
                                />
                              ))}
                              <span className="text-xs fw-700 text-1 ml-4">{r.overallScore}</span>
                            </div>
                          )}
                          <Badge variant={r.status === "acknowledged" || r.status === "submitted" ? "success" : "warning"}>
                            {(r.status || "SUBMITTED").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {r.comments && (
                        <p className="text-xs text-3 m-0" style={{ lineHeight: 1.5 }}>
                          "{r.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "28px 20px", border: "1px dashed var(--border)", borderRadius: 10 }}>
                  <span className="text-xs text-5">No formal performance reviews submitted yet.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: BENEFITS */}
          {activeTab === "Benefits" && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-lg fw-700 text-1 m-0">Company Benefits & Coverage</h3>
                  <p className="text-xs text-5 mt-2 m-0">
                    Health insurance, retirement savings, and allowances active for your profile.
                  </p>
                </div>
                <Link href="/benefits" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
                  Benefits Portal
                </Link>
              </div>

              {/* Active Enrollments */}
              <h4 className="text-sm fw-700 text-1 mb-14">My Enrolled Policies</h4>
              {benefitEnrollments.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
                  {benefitEnrollments.map((enr: any) => (
                    <div
                      key={enr.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 20,
                        background: "#FAFAFA",
                      }}
                    >
                      <div className="row-between align-start mb-10">
                        <div className="row gap-10 align-center">
                          <Stethoscope size={20} color="var(--primary)" />
                          <strong className="text-sm text-1">{enr.planName}</strong>
                        </div>
                        <Badge variant={enr.status === "active" ? "success" : "neutral"}>
                          {(enr.status || "ACTIVE").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="row-between text-xs text-4 mb-4">
                        <span>Coverage Tier</span>
                        <strong className="text-1">{(enr.coverageTier || "Individual").toUpperCase()}</strong>
                      </div>
                      <div className="row-between text-xs text-4">
                        <span>Effective Date</span>
                        <strong className="text-1">{enr.effectiveFrom || "Active"}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "28px 20px", border: "1px dashed var(--border)", borderRadius: 10, marginBottom: 28 }}>
                  <Heart size={28} color="#9CA3AF" style={{ margin: "0 auto 8px" }} />
                  <span className="text-xs text-5 block">
                    No individual benefit policies enrolled yet. View company offerings below.
                  </span>
                </div>
              )}

              {/* Company Available Plans */}
              <h4 className="text-sm fw-700 text-1 mb-14">Available Company Benefit Offerings</h4>
              {benefitPlans.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {benefitPlans.map((pl: any) => (
                    <div
                      key={pl.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 18,
                        background: "#FFFFFF",
                      }}
                    >
                      <div className="row-between align-start mb-6">
                        <strong className="text-sm text-1">{pl.name}</strong>
                        <Badge variant="neutral">{(pl.category || "PLAN").toUpperCase()}</Badge>
                      </div>
                      {pl.description && (
                        <p className="text-xs text-4 m-0 mb-10" style={{ lineHeight: 1.5 }}>
                          {pl.description}
                        </p>
                      )}
                      <div className="text-xs text-primary fw-700">
                        Company-sponsored coverage · ${(pl.employerCostMinor / 100).toFixed(0)}/mo
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 20px", border: "1px dashed var(--border)", borderRadius: 10 }}>
                  <span className="text-xs text-5">Standard organization benefit plans applied.</span>
                </div>
              )}
            </div>
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
