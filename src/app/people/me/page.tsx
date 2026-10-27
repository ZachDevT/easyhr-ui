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
  Calculator,
  Receipt,
  Printer,
  Eye,
  Sun,
  Shield,
  Coffee,
  Utensils,
  Music,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";
import { usePayroll } from "@/context/PayrollContext";
import { formatMoney, CompensationModel, PayrollCalculationResult } from "@/utils/payrollEngine";
import { CalculationFormulaModal } from "@/components/payroll/CalculationFormulaModal";
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
  const {
    settings,
    getEmployeeCompensation,
    saveEmployeeCompensation,
    getEmployeeBonusesPenalties,
    addBonusPenalty,
    updateBonusPenaltyStatus,
    deleteBonusPenalty,
    getEmployeeCompensationDetails,
  } = usePayroll();
  const searchParams = useSearchParams();

  const requestedTab = searchParams?.get("tab");
  const canViewPayslips = settings.showPayslipsTabToEmployees !== false;

  const dynamicTabs = useMemo(() => {
    const list = ["Personal", "Job"];
    if (canViewPayslips) {
      list.push("Payslips");
    }
    list.push("Documents", "Time Off", "Performance", "Benefits", "Timesheet", "Pay Info", "Emergency");
    return list;
  }, [canViewPayslips]);

  const [activeTab, setActiveTab] = useState(
    requestedTab && (dynamicTabs.includes(requestedTab) || (requestedTab === "Payslips" && canViewPayslips))
      ? requestedTab
      : "Personal"
  );

  useEffect(() => {
    if (activeTab === "Payslips" && !canViewPayslips) {
      setActiveTab("Personal");
    }
  }, [activeTab, canViewPayslips]);

  // Live employee record from API
  const [employee, setEmployee] = useState<EmployeeProfileRecord | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);

  // Payslips & Compensation Engine state
  const [selectedPayslipModal, setSelectedPayslipModal] = useState<PayrollCalculationResult | null>(null);
  const [isBonusPenaltyModalOpen, setIsBonusPenaltyModalOpen] = useState(false);
  const [isSavingBonusPenalty, setIsSavingBonusPenalty] = useState(false);
  const [bonusPenaltyForm, setBonusPenaltyForm] = useState({
    type: "bonus" as "bonus" | "penalty",
    category: "Performance Bonus",
    amount: "",
    periodMonth: 10,
    periodYear: 2026,
    reason: "",
  });

  const [isEditCompensationOpen, setIsEditCompensationOpen] = useState(false);
  const [isSavingCompensation, setIsSavingCompensation] = useState(false);
  const [compensationForm, setCompensationForm] = useState({
    compensationModel: "hourly" as CompensationModel,
    hourlyRate: "18500",
    baseSalary: "3200000",
    dailyRate: "145000",
    currency: "UGX",
    isExemptFromOvertime: false,
  });

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
  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState(false);

  // Dynamic Payroll engine data
  const employeeId = employee?.id || 'emp-bushu';
  const employeeFullName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Bushu Hamuli Zacharie';
  const empComp = getEmployeeCompensation(employeeId, employeeFullName);
  const employeeBonusesPenalties = getEmployeeBonusesPenalties(employeeId);
  const compensationRows = getEmployeeCompensationDetails(employeeId);

  const getMonthName = (m: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[m - 1] || `Month ${m}`;
  };

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

  // Derived dynamic leave balances with real mapping and robust fallbacks
  const normalizedBalances = useMemo(() => {
    if (leaveBalances && leaveBalances.length > 0) {
      return leaveBalances.map((bal: any) => {
        const name = bal.leaveTypeName || bal.leaveTypeCode || bal.policyName || "Paid Leave";
        let availableDays = 0;
        if (bal.availableDays !== undefined && bal.availableDays !== null) {
          availableDays = Number(bal.availableDays);
        } else if (bal.availableHours !== undefined && bal.availableHours > 0) {
          availableDays = Math.round((bal.availableHours / 8) * 10) / 10;
        } else if (bal.availableMinutes !== undefined && bal.availableMinutes > 0) {
          availableDays = Math.round((bal.availableMinutes / 480) * 10) / 10;
        }

        let usedDays = 0;
        if (bal.usedDays !== undefined && bal.usedDays !== null) {
          usedDays = Number(bal.usedDays);
        } else if (bal.usedHours !== undefined && bal.usedHours > 0) {
          usedDays = Math.round((bal.usedHours / 8) * 10) / 10;
        } else if (bal.usedMinutes !== undefined && bal.usedMinutes > 0) {
          usedDays = Math.round((bal.usedMinutes / 480) * 10) / 10;
        }

        const isSick = name.toLowerCase().includes("sick");
        const isAnnual = name.toLowerCase().includes("annual") || name.toLowerCase().includes("vacation");
        const isCasual = name.toLowerCase().includes("casual") || name.toLowerCase().includes("personal");
        const isFamily = name.toLowerCase().includes("compassionate") || name.toLowerCase().includes("family") || name.toLowerCase().includes("maternity") || name.toLowerCase().includes("paternity");

        const defaultTotal = isSick ? 10 : isAnnual ? 21 : isCasual ? 5 : isFamily ? 4 : 14;
        const totalDays = Math.max(
          availableDays + usedDays,
          bal.accrualHours ? Math.round((bal.accrualHours / 8) * 10) / 10 : defaultTotal
        );

        const displayAvailable = availableDays === 0 && usedDays === 0 ? defaultTotal : availableDays;

        return {
          id: bal.id || bal.leaveTypeId || name,
          name,
          availableDays: displayAvailable,
          usedDays,
          totalDays: Math.max(displayAvailable + usedDays, totalDays),
          code: bal.leaveTypeCode || (isSick ? "SICK" : isAnnual ? "ANNUAL" : isCasual ? "CASUAL" : "PTO"),
        };
      });
    }

    return [
      { id: "annual", name: "Annual Vacation", availableDays: 21, usedDays: 0, totalDays: 21, code: "ANNUAL" },
      { id: "sick", name: "Sick Leave", availableDays: 10, usedDays: 0, totalDays: 10, code: "SICK" },
      { id: "casual", name: "Casual & Personal", availableDays: 5, usedDays: 0, totalDays: 5, code: "CASUAL" },
      { id: "compassionate", name: "Compassionate / Family", availableDays: 4, usedDays: 0, totalDays: 4, code: "COMP" },
    ];
  }, [leaveBalances]);

  if (isLoadingEmployee && !employee) {
    return <ProfileMeSkeleton />;
  }

  const avatarSrc = employee?.avatarUrl || employee?.avatar || userProfile?.avatarUrl;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg-page)", display: "flex", flexDirection: "column" }}>
      {/* REUSABLE BRAND PAGE HEADER WITH INTEGRATED TABS & AVATAR */}
      <PageHeader
        icon={
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile photo"
            style={{ position: "relative", cursor: "pointer" }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayFullName}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  objectFit: "cover",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {displayFirstName.slice(0, 1).toUpperCase()}
                {displayLastName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--primary, #2563EB)",
                color: "#FFFFFF",
                border: "1.5px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={9} />
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
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{displayFullName}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: employee?.status === "active" ? "#10B981" : "#F59E0B",
                color: "#FFFFFF",
              }}
            >
              {employee?.status ? employee.status.toUpperCase() : "ACTIVE"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.18)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              {employee?.employeeNumber || "EMP-0001"}
            </span>
          </div>
        }
        subtitle={`${displayRole} · ${displayCompany} · ${employee?.department || "General"} · ${displayLocation}`}
        tabs={dynamicTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary btn-sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "7px 13px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Camera size={13} className="mr-4" /> Change Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("Personal");
                setIsEditingPersonal(true);
              }}
              className="btn-secondary btn-sm"
              style={{
                background: "#FFFFFF",
                color: "var(--primary)",
                border: "none",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Edit2 size={13} className="mr-4" /> Edit Profile
            </button>
          </div>
        }
      />

      {/* Main Grid Area */}
      <div style={{ display: "grid", gridTemplateColumns: activeTab === "Personal" ? "270px 1fr" : "1fr", gap: 20, position: "relative", alignItems: "start" }}>
        {/* Left Column: Structured Vitals & Employment Card (Only shown on Personal tab) */}
        {activeTab === "Personal" && (
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
              <Calendar size={15} style={{ color: "var(--primary, #2563EB)", flexShrink: 0 }} />
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
        )}

        {/* Right Column: Tab Content */}
        <div
          style={{
            background: "var(--card-bg, #FFFFFF)",
            borderRadius: 14,
            border: "1px solid var(--card-border, #E4E4E7)",
            padding: 28,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
                  <div style={{ borderTop: "1px solid #F0F0F2", paddingTop: 24, marginTop: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", margin: 0 }}>
                        Team Culture &amp; Preferences
                      </h4>
                      <p style={{ fontSize: 12, color: "#86868B", margin: "2px 0 0" }}>
                        Workplace perks, team gift sizing, and personal favorites
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                      {/* T-Shirt Size */}
                      <div style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 4 }}>
                          T-Shirt Size
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{employee?.shirtSize || "L"}</span>
                          <span style={{ fontSize: 11, color: "#86868B" }}>Unisex</span>
                        </div>
                      </div>

                      {/* Beverage */}
                      <div style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 4 }}>
                          Beverage Choice
                        </span>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>
                          {employee?.coffeeTea || "Coffee"}
                        </span>
                      </div>

                      {/* Favorite Food */}
                      <div style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 4 }}>
                          Favorite Food
                        </span>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>
                          {employee?.favoriteFood || "Not specified"}
                        </span>
                      </div>

                      {/* Music & Genres */}
                      <div style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 4 }}>
                          Music &amp; Genres
                        </span>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>
                          {employee?.favoriteMusic || "Not specified"}
                        </span>
                      </div>

                      {/* Fun Fact / Superpower */}
                      <div style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, padding: "12px 14px", gridColumn: "span 2" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 4 }}>
                          Fun Fact / Superpower
                        </span>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "#1D1D1F" }}>
                          {employee?.funFact || "Not specified"}
                        </span>
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

              {/* One-time Bonuses & Penalties (Referenced by Calculation Formula) */}
              <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--card-border, #E4E4E7)" }}>
                <div className="row-between mb-16 align-center">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h4 className="text-base fw-700 text-1 m-0">One-time Bonuses &amp; Penalties</h4>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "#EEF2F6", color: "#475569" }}>
                        Payroll Integrated
                      </span>
                    </div>
                    <p className="text-xs text-4 mt-4 m-0">
                      Discretionary bonuses, performance spiffs, and authorized adjustments for monthly payroll calculations.
                    </p>
                  </div>
                  {(isHRAdmin || isManager) && (
                    <button
                      type="button"
                      className="btn-primary btn-sm row gap-6 align-center"
                      onClick={() => setIsBonusPenaltyModalOpen(true)}
                      style={{ fontSize: 12 }}
                    >
                      <Plus size={14} /> Add One-time Bonus / Penalty
                    </button>
                  )}
                </div>

                <div style={{
                  borderRadius: 10,
                  border: "1px solid var(--card-border, #E4E4E7)",
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 680 }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--card-border, #E2E8F0)", color: "#64748B", textAlign: "left", fontSize: 11.5, fontWeight: 600 }}>
                          <th style={{ padding: "10px 16px" }}>Type</th>
                          <th style={{ padding: "10px 16px" }}>Category</th>
                          <th style={{ padding: "10px 16px" }}>Amount</th>
                          <th style={{ padding: "10px 16px" }}>Applicable Month</th>
                          <th style={{ padding: "10px 16px" }}>Reason / Notes</th>
                          <th style={{ padding: "10px 16px" }}>Status</th>
                          {(isHRAdmin || isManager) && <th style={{ padding: "10px 16px", textAlign: "right" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {employeeBonusesPenalties.length === 0 ? (
                          <tr>
                            <td colSpan={isHRAdmin || isManager ? 7 : 6} style={{ padding: "24px 16px", textAlign: "center", color: "#94A3B8" }}>
                              No one-time bonuses or penalties have been recorded for this employee.
                            </td>
                          </tr>
                        ) : (
                          employeeBonusesPenalties.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  background: item.type === "bonus" ? "#DCFCE7" : "#FEE2E2",
                                  color: item.type === "bonus" ? "#166534" : "#991B1B",
                                }}>
                                  {item.type}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-1)" }}>
                                {item.category}
                              </td>
                              <td style={{
                                padding: "12px 16px",
                                fontWeight: 700,
                                color: item.type === "bonus" ? "#16A34A" : "#DC2626",
                              }}>
                                {item.type === "bonus" ? "+" : "-"}{formatMoney(item.amount, item.currency)}
                              </td>
                              <td style={{ padding: "12px 16px", color: "var(--text-2)" }}>
                                {getMonthName(item.periodMonth)} {item.periodYear}
                              </td>
                              <td style={{ padding: "12px 16px", color: "var(--text-3)", maxWidth: 220 }}>
                                {item.reason || "—"}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <Badge variant={item.status === "approved" ? "success" : item.status === "pending" ? "warning" : "neutral"}>
                                  {item.status.toUpperCase()}
                                </Badge>
                              </td>
                              {(isHRAdmin || isManager) && (
                                <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                  <div style={{ display: "inline-flex", gap: 6 }}>
                                    {item.status === "pending" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateBonusPenaltyStatus(item.id, "approved")}
                                          className="btn-neutral btn-sm"
                                          style={{ padding: "4px 8px", fontSize: 11, color: "#16A34A" }}
                                          title="Approve for Payroll"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateBonusPenaltyStatus(item.id, "rejected")}
                                          className="btn-neutral btn-sm"
                                          style={{ padding: "4px 8px", fontSize: 11, color: "#DC2626" }}
                                          title="Reject"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => deleteBonusPenalty(item.id)}
                                      className="btn-neutral btn-sm"
                                      style={{ padding: "4px 8px", fontSize: 11, color: "#64748B" }}
                                      title="Remove"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: "10px 16px", background: "#FAFBFB", borderTop: "1px solid #F1F5F9", fontSize: 11.5, color: "#64748B" }}>
                    ℹ️ Total approved bonuses and penalties feed automatically into the employee&apos;s Calculation Formula and Payslips.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYSLIPS (Matching Reference Screenshot UI) */}
          {activeTab === "Payslips" && canViewPayslips && (
            <div>
              {/* Header */}
              <div className="row-between mb-20 align-center">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--primary-tint, #EEF2F6)",
                      color: "var(--primary, #2563EB)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Receipt size={18} />
                  </div>
                  <h3 className="text-xl fw-700 text-1 m-0">Payslips</h3>
                </div>

                {isHRAdmin && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCompensationForm({
                          compensationModel: empComp.compensationModel,
                          hourlyRate: String(empComp.hourlyRate || 18500),
                          baseSalary: String(empComp.baseSalary || 3200000),
                          dailyRate: String(empComp.dailyRate || 145000),
                          currency: empComp.currency || "UGX",
                          isExemptFromOvertime: Boolean(empComp.isExemptFromOvertime),
                        });
                        setIsEditCompensationOpen(true);
                      }}
                      className="btn-neutral btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                    >
                      <Edit2 size={13} /> Edit Compensation Model
                    </button>
                    <Link
                      href="/payroll"
                      className="btn-primary btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none" }}
                    >
                      <DollarSign size={13} /> Payroll System
                    </Link>
                  </div>
                )}
              </div>

              {/* Apple-Inspired Payslips Table */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  border: "1px solid #E5E5EA",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: "#F5F5F7",
                        color: "#1D1D1F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Receipt size={14} />
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                      Certified Pay Statements
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormulaHelpOpen(true)}
                    style={{
                      background: "#F5F5F7",
                      border: "1px solid #E5E5EA",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#636366",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <span>Calculation Formula</span>
                    <span style={{ fontSize: 11, color: "#86868B" }}>ℹ️</span>
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 12.5 }}>
                    <thead>
                      <tr
                        style={{
                          background: "#FBFBFD",
                          borderBottom: "1px solid #E5E5EA",
                          color: "#86868B",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        <th style={{ padding: "10px 16px" }}>Pay Period</th>
                        <th style={{ padding: "10px 14px" }}>Productive Hours</th>
                        <th style={{ padding: "10px 14px" }}>Gross Earnings</th>
                        <th style={{ padding: "10px 14px" }}>Deductions</th>
                        <th style={{ padding: "10px 14px" }}>Net Disbursed</th>
                        <th style={{ padding: "10px 14px" }}>Status</th>
                        <th style={{ padding: "10px 16px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compensationRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{ padding: "48px 20px", textAlign: "center", color: "#86868B" }}
                          >
                            <Receipt size={28} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1D1F", marginBottom: 3 }}>
                              No pay statements yet
                            </div>
                            <div style={{ fontSize: 12, color: "#86868B" }}>
                              Pay statements will appear here once a monthly payroll run is approved by HR.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        compensationRows.map((row) => (
                          <tr key={`${row.periodYear}-${row.periodMonth}`} style={{ borderBottom: "1px solid #F5F5F7" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1D1D1F" }}>
                              {getMonthName(row.periodMonth)} {row.periodYear}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#1D1D1F" }}>
                              <span style={{ fontWeight: 600 }}>{row.productiveHours}h</span>
                              <span style={{ fontSize: 11, color: "#86868B", marginLeft: 4 }}>
                                ({row.productiveHoursPercent}%)
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1D1D1F" }}>
                              {formatMoney(row.grossPay, row.currency)}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#636366" }}>
                              -{formatMoney(row.employeeDeductions, row.currency)}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--primary, #2563EB)" }}>
                              {formatMoney(row.netPay, row.currency)}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F5F5F7", padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#1D1D1F" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary, #2563EB)" }} />
                                Paid
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedPayslipModal(row)}
                                className="btn-neutral btn-sm"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  fontSize: 11.5,
                                  padding: "4px 10px",
                                  borderRadius: 7,
                                }}
                              >
                                <Eye size={12} /> View Statement
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
              <div className="row-between mb-20">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                    Leave Balances &amp; Allocations
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#86868B", margin: "3px 0 0" }}>
                    Dynamic PTO, annual vacation, and statutory sick day accruals.
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
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12.5,
                  }}
                >
                  <Plus size={14} /> Request Time Off
                </Link>
              </div>

              {/* Dynamic Apple-Style Leave Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
                {normalizedBalances.map((bal) => {
                  const percentUsed = bal.totalDays > 0 ? Math.min(100, Math.round((bal.usedDays / bal.totalDays) * 100)) : 0;
                  const isSick = bal.name.toLowerCase().includes("sick");
                  const isAnnual = bal.name.toLowerCase().includes("annual") || bal.name.toLowerCase().includes("vacation");
                  const isCasual = bal.name.toLowerCase().includes("casual") || bal.name.toLowerCase().includes("personal");

                  return (
                    <div
                      key={bal.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E5EA",
                        borderRadius: 12,
                        padding: "16px 18px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: isAnnual ? "#FFF8F0" : isSick ? "#F0FDF4" : isCasual ? "#F5F3FF" : "#F5F5F7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isAnnual ? (
                              <Sun size={14} color="#FF9500" />
                            ) : isSick ? (
                              <Shield size={14} color="#34C759" />
                            ) : isCasual ? (
                              <Coffee size={14} color="#5856D6" />
                            ) : (
                              <Heart size={14} color="#FF2D55" />
                            )}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>
                            {bal.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#F5F5F7",
                            color: "#86868B",
                          }}
                        >
                          {bal.code}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                            {bal.availableDays}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#86868B" }}>
                            days available
                          </span>
                        </div>
                      </div>

                      {/* Hairline progress bar */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(5, percentUsed)}%`,
                              background: percentUsed > 80 ? "#FF3B30" : "var(--primary, #0071E3)",
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginTop: 2 }}>
                          <span>Used: {bal.usedDays}d</span>
                          <span>Annual: {bal.totalDays}d</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Requests Section */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", margin: 0 }}>
                  Recent Leave Requests
                </h4>
              </div>

              {leaveRequests.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {leaveRequests.slice(0, 5).map((req: any) => (
                    <div
                      key={req.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        border: "1px solid #E5E5EA",
                        borderRadius: 10,
                        background: "#FFFFFF",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#F5F5F7",
                            color: "#1D1D1F",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Calendar size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>
                            {req.policyName || req.leaveTypeName || "Scheduled Leave"} · {req.startDate} {req.endDate && req.endDate !== req.startDate ? `to ${req.endDate}` : ""}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#86868B", marginTop: 2 }}>
                            {req.reason || "Time off request"}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: req.status === "approved" ? "#E8F5E9" : req.status === "rejected" ? "#FFEBEE" : "#FFF8E1",
                          color: req.status === "approved" ? "#2E7D32" : req.status === "rejected" ? "#C62828" : "#B78103",
                        }}
                      >
                        {(req.status || "PENDING").toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 20px",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    background: "#FAFAFC",
                  }}
                >
                  <Calendar size={24} color="#86868B" style={{ margin: "0 auto 8px" }} />
                  <span style={{ fontSize: 12.5, color: "#86868B", display: "block" }}>
                    No upcoming or past leave requests submitted.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TIMESHEET */}
          {activeTab === "Timesheet" && (
            <div>
              <div className="row-between mb-20">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                    Live Timesheet &amp; Punches
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#86868B", margin: "3px 0 0" }}>
                    Real-time work sessions, punch clocks, and approved productive hours.
                  </p>
                </div>
                <Link
                  href="/attendance"
                  className="btn-neutral btn-sm"
                  style={{ textDecoration: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5 }}
                >
                  Attendance Matrix
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "14px 18px",
                      background: "#FAFAFC",
                      borderBottom: "1px solid #E5E5EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B" }}>
                      Current Pay Period Work Logs
                    </span>
                    <span style={{ fontSize: 11.5, color: "#86868B" }}>
                      {groupedPunches.length} work days recorded
                    </span>
                  </div>

                  {groupedPunches.length > 0 ? (
                    groupedPunches.map((entry, idx) => (
                      <div
                        key={entry.date}
                        style={{
                          padding: "14px 18px",
                          borderBottom: idx === groupedPunches.length - 1 ? "none" : "1px solid #F0F0F2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ width: 110 }}>
                          <div style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>{entry.day}</div>
                          <div style={{ fontSize: 11.5, color: "#86868B" }}>{entry.date}</div>
                        </div>
                        <div style={{ flex: 1, paddingLeft: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {entry.punches.map((p, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5,
                                fontWeight: 500,
                                background: p.punchType === "in" ? "#F0FDF4" : "#F5F5F7",
                                color: p.punchType === "in" ? "#166534" : "#1D1D1F",
                                border: p.punchType === "in" ? "1px solid #BBF7D0" : "1px solid #E5E5EA",
                                borderRadius: 6,
                                padding: "3px 8px",
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.punchType === "in" ? "#22C55E" : "#86868B" }} />
                              {p.punchType === "in" ? "Clock In" : "Clock Out"}:{" "}
                              {p.punchedAt ? new Date(p.punchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "36px 20px", textAlign: "center", color: "#86868B" }}>
                      <Clock size={24} style={{ margin: "0 auto 8px", opacity: 0.6 }} />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>No punches recorded yet this period</div>
                      <div style={{ fontSize: 11.5, marginTop: 4 }}>Use the punch widget to clock in for your shift.</div>
                    </div>
                  )}
                </div>

                <div style={{ position: "sticky", top: 24 }}>
                  <CompulsoryMyTimeWidget />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PERFORMANCE */}
          {activeTab === "Performance" && (
            <div>
              <div className="row-between mb-20">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                    Performance &amp; OKR Milestones
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#86868B", margin: "3px 0 0" }}>
                    Track strategic milestones, OKRs, and manager quarterly evaluations.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => setIsGoalModalOpen(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "6px 14px", fontSize: 12.5 }}
                  >
                    <Plus size={14} /> Add Career Goal
                  </button>
                  {(isHRAdmin || isManager) && (
                    <Link
                      href="/performance"
                      className="btn-neutral btn-sm"
                      style={{ textDecoration: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12.5 }}
                    >
                      Performance Hub
                    </Link>
                  )}
                </div>
              </div>

              {/* Goals Grid */}
              <div style={{ marginBottom: 24 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 12 }}>
                  Active Goals &amp; Deliverables
                </span>
                {performanceGoals.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {performanceGoals.map((g: any) => (
                      <div
                        key={g.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E5E5EA",
                          borderRadius: 12,
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 650, color: "#1D1D1F" }}>{g.title}</span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: g.status === "achieved" ? "#E8F5E9" : "#F5F5F7",
                              color: g.status === "achieved" ? "#2E7D32" : "#1D1D1F",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(g.status || "active").replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        {g.description && (
                          <p style={{ fontSize: 12, color: "#636366", margin: 0, lineHeight: 1.4 }}>
                            {g.description}
                          </p>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginBottom: 4 }}>
                            <span>Progress</span>
                            <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{g.completionPercentage || 0}%</span>
                          </div>
                          <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, g.completionPercentage || 0)}%`,
                                background: "var(--primary, #0071E3)",
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          {g.dueDate && (
                            <span style={{ fontSize: 11, color: "#86868B", marginTop: 6, display: "block" }}>
                              Target: {g.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "28px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                    <Target size={22} color="#86868B" style={{ margin: "0 auto 8px" }} />
                    <span style={{ fontSize: 12.5, color: "#86868B" }}>No career goals created yet for this cycle.</span>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 12 }}>
                  Evaluation Reviews &amp; Feedback
                </span>
                {performanceReviews.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {performanceReviews.map((r: any) => (
                      <div
                        key={r.id}
                        style={{
                          padding: "14px 18px",
                          border: "1px solid #E5E5EA",
                          borderRadius: 10,
                          background: "#FFFFFF",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>{r.reviewCycle || "Annual Performance Review"}</span>
                            <span style={{ fontSize: 11.5, color: "#86868B", marginLeft: 8 }}>Reviewer: {r.reviewerName || "Direct Supervisor"}</span>
                          </div>
                          {r.overallScore && (
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  style={{
                                    fill: i <= Math.round(r.overallScore) ? "#FF9500" : "transparent",
                                    color: i <= Math.round(r.overallScore) ? "#FF9500" : "#E5E5EA",
                                  }}
                                />
                              ))}
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", marginLeft: 4 }}>{r.overallScore}</span>
                            </div>
                          )}
                        </div>
                        {r.comments && (
                          <p style={{ fontSize: 12.5, color: "#48484A", margin: "4px 0 0", fontStyle: "italic" }}>
                            "{r.comments}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "28px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                    <span style={{ fontSize: 12.5, color: "#86868B" }}>No formal performance reviews submitted yet.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: BENEFITS */}
          {activeTab === "Benefits" && (
            <div>
              <div className="row-between mb-20">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                    Company Benefits &amp; Coverage
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#86868B", margin: "3px 0 0" }}>
                    Active health insurance, retirement plans, and organizational perks.
                  </p>
                </div>
                {isHRAdmin && (
                  <Link
                    href="/benefits"
                    className="btn-neutral btn-sm"
                    style={{ textDecoration: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5 }}
                  >
                    Benefits Administration
                  </Link>
                )}
              </div>

              {/* Active Enrollments */}
              <div style={{ marginBottom: 24 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 12 }}>
                  Active Enrolled Policies
                </span>
                {benefitEnrollments.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {benefitEnrollments.map((enr: any) => (
                      <div
                        key={enr.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E5E5EA",
                          borderRadius: 12,
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Stethoscope size={16} color="var(--primary, #0071E3)" />
                            <span style={{ fontSize: 13.5, fontWeight: 650, color: "#1D1D1F" }}>{enr.planName}</span>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#E8F5E9", color: "#2E7D32" }}>
                            {(enr.status || "ACTIVE").toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, borderTop: "1px solid #F0F0F2", paddingTop: 8 }}>
                          <div>
                            <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Coverage Tier</span>
                            <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{(enr.coverageTier || "Individual").toUpperCase()}</span>
                          </div>
                          <div>
                            <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Effective Date</span>
                            <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{enr.effectiveFrom || "Active"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "28px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                    <Heart size={22} color="#86868B" style={{ margin: "0 auto 8px" }} />
                    <span style={{ fontSize: 12.5, color: "#86868B", display: "block" }}>
                      No individual benefit policies enrolled yet. See company offerings below.
                    </span>
                  </div>
                )}
              </div>

              {/* Company Available Offerings */}
              <div>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B", marginBottom: 12 }}>
                  Available Organization Offerings
                </span>
                {benefitPlans.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {benefitPlans.map((pl: any) => {
                      const isEnrolled = benefitEnrollments.some((e: any) => e.planId === pl.id || e.plan_id === pl.id);
                      const costDisplay = pl.employerCostMinor ? `${formatMoney(pl.employerCostMinor, pl.currency)}/mo` : "Company Paid";
                      const empCostDisplay = pl.employeeCostMinor > 0 ? `${formatMoney(pl.employeeCostMinor, pl.currency)}/mo` : "Fully Employer Covered";
                      return (
                        <div
                          key={pl.id}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E5E5EA",
                            borderRadius: 12,
                            padding: "16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{pl.name}</h4>
                              <span style={{ fontSize: 10.5, fontWeight: 650, color: "#6E6E73", background: "#F2F2F7", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                                {(pl.category || "General").toUpperCase()} · {pl.currency || "UGX"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: isEnrolled ? "#DCFCE7" : "#F4F4F5",
                                color: isEnrolled ? "#15803D" : "#52525B",
                              }}
                            >
                              {isEnrolled ? "ENROLLED" : "AVAILABLE"}
                            </span>
                          </div>

                          {pl.description && (
                            <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, lineHeight: 1.5 }}>
                              {pl.description}
                            </p>
                          )}

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5, borderTop: "1px solid #F0F0F2", paddingTop: 8 }}>
                            <div>
                              <span style={{ color: "#8E8E93", display: "block", fontSize: 10.5 }}>Employer Outlay</span>
                              <strong style={{ color: "#1D1D1F" }}>{costDisplay}</strong>
                            </div>
                            <div>
                              <span style={{ color: "#8E8E93", display: "block", fontSize: 10.5 }}>Employee Share</span>
                              <strong style={{ color: "#1D1D1F" }}>{empCostDisplay}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                    <span style={{ fontSize: 12.5, color: "#86868B" }}>Company comprehensive medical, life, and NSSF pension policies are active.</span>
                  </div>
                )}
              </div>
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

      {/* MODAL: VIEW / PRINT PAYSLIP */}
      {selectedPayslipModal && (
        <Modal
          isOpen={!!selectedPayslipModal}
          onClose={() => setSelectedPayslipModal(null)}
          title={`Official Pay Statement — ${getMonthName(selectedPayslipModal.periodMonth)} ${selectedPayslipModal.periodYear}`}
          width={760}
        >
          <div style={{ padding: "8px 4px" }} id="printable-payslip">
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: 18, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>
                  {company?.name || "Helpware / EasyHR"}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Workforce Operations &amp; Payroll Disbursement
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary, #2563EB)", marginTop: 8 }}>
                  {selectedPayslipModal.employeeName}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  ID: {empComp.employeeNumber || "#10974"} · {empComp.jobTitle} · {empComp.department}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <Badge variant="success">PAYSLIP FINALIZED</Badge>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
                  Period: {getMonthName(selectedPayslipModal.periodMonth)} 1 – 31, {selectedPayslipModal.periodYear}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Pay Date: {selectedPayslipModal.periodYear}-{String(selectedPayslipModal.periodMonth).padStart(2, "0")}-31
                </div>
              </div>
            </div>

            {/* Attendance & Time Reconciliation summary */}
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14, marginBottom: 20, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.03em" }}>
                Attendance &amp; Productive Hours Reconciliation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Productive Hours:</span>
                  <strong style={{ color: "#0F766E", fontSize: 14 }}>{selectedPayslipModal.productiveHours} hrs</strong>
                  <span style={{ fontSize: 11, color: "#64748B", display: "block" }}>({selectedPayslipModal.productiveHoursPercent}% of sched)</span>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Approved Overtime:</span>
                  <strong style={{ color: "var(--text-1)", fontSize: 14 }}>{selectedPayslipModal.approvedOvertimeHours} hrs</strong>
                  <span style={{ fontSize: 11, color: "#64748B", display: "block" }}>1.5× rate</span>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Days Worked:</span>
                  <strong style={{ color: "var(--text-1)", fontSize: 14 }}>{selectedPayslipModal.daysWorked} days</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Base Pay Rate:</span>
                  <strong style={{ color: "var(--text-1)", fontSize: 14 }}>{selectedPayslipModal.payRateDisplay}</strong>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* Earnings column */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 12 }}>
                  Earnings (Additions)
                </div>
                <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "6px 0", color: "#334155" }}>Regular Productive Pay</td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>
                        {formatMoney(selectedPayslipModal.regularCompensation, selectedPayslipModal.currency)}
                      </td>
                    </tr>
                    {selectedPayslipModal.overtimeCompensation > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "6px 0", color: "#334155" }}>Approved Overtime</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>
                          +{formatMoney(selectedPayslipModal.overtimeCompensation, selectedPayslipModal.currency)}
                        </td>
                      </tr>
                    )}
                    {selectedPayslipModal.higherRateCompensation > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "6px 0", color: "#334155" }}>Holiday / Night Differentials</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>
                          +{formatMoney(selectedPayslipModal.higherRateCompensation, selectedPayslipModal.currency)}
                        </td>
                      </tr>
                    )}
                    {selectedPayslipModal.bonusesTotal > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "6px 0", color: "#334155" }}>Approved One-time Bonuses</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>
                          +{formatMoney(selectedPayslipModal.bonusesTotal, selectedPayslipModal.currency)}
                        </td>
                      </tr>
                    )}
                    {selectedPayslipModal.allowancesTotal > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "6px 0", color: "#334155" }}>Allowances</td>
                        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>
                          +{formatMoney(selectedPayslipModal.allowancesTotal, selectedPayslipModal.currency)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #CBD5E1" }}>
                      <td style={{ padding: "10px 0 4px", fontWeight: 700, color: "var(--text-1)" }}>Total Gross Pay</td>
                      <td style={{ padding: "10px 0 4px", textAlign: "right", fontWeight: 800, color: "var(--text-1)" }}>
                        {formatMoney(selectedPayslipModal.grossPay, selectedPayslipModal.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions column */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 12 }}>
                  Deductions (Subtractions)
                </div>
                <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
                  <tbody>
                    {selectedPayslipModal.breakdown
                      .filter((b) => !b.isAddition && !b.isEmployerCost)
                      .map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "6px 0", color: "#334155" }}>{item.name}</td>
                          <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#DC2626" }}>
                            -{formatMoney(item.amount, selectedPayslipModal.currency)}
                          </td>
                        </tr>
                      ))}
                    {selectedPayslipModal.breakdown.filter((b) => !b.isAddition && !b.isEmployerCost).length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ padding: "12px 0", color: "#94A3B8" }}>No statutory deductions applied</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #CBD5E1" }}>
                      <td style={{ padding: "10px 0 4px", fontWeight: 700, color: "#991B1B" }}>Total Deductions</td>
                      <td style={{ padding: "10px 0 4px", textAlign: "right", fontWeight: 800, color: "#991B1B" }}>
                        -{formatMoney(selectedPayslipModal.employeeDeductions, selectedPayslipModal.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Net Take-Home Pay
                </div>
                <div style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>
                  Disbursement via {employee?.paymentMethod || "Direct Electronic Transfer"}
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#15803D", letterSpacing: "-0.02em" }}>
                {formatMoney(selectedPayslipModal.netPay, selectedPayslipModal.currency)}
              </div>
            </div>

            {/* Employer Contribution footnote */}
            <div style={{ fontSize: 11.5, color: "#64748B", background: "#FAFBFB", padding: "10px 14px", borderRadius: 8, border: "1px solid #F1F5F9" }}>
              <strong>Employer Contribution:</strong> NSSF Employer (10%): {formatMoney(selectedPayslipModal.employerPension, selectedPayslipModal.currency)} · Total Cost to Employer: {formatMoney(selectedPayslipModal.totalEmployerCost, selectedPayslipModal.currency)} (Statutory employer contributions are paid directly by the company and do not reduce your take-home pay).
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                className="btn-neutral"
                onClick={() => setSelectedPayslipModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={15} /> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD ONE-TIME BONUS / PENALTY (Job Tab Integration) */}
      {isBonusPenaltyModalOpen && (
        <Modal
          isOpen={isBonusPenaltyModalOpen}
          onClose={() => setIsBonusPenaltyModalOpen(false)}
          title="Record One-time Bonus / Penalty"
          width={500}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(bonusPenaltyForm.amount);
              if (!amt || amt <= 0) {
                toast.error("Invalid amount", "Enter a positive numerical amount.");
                return;
              }
              setIsSavingBonusPenalty(true);
              try {
                addBonusPenalty({
                  employeeId,
                  employeeName: employeeFullName,
                  type: bonusPenaltyForm.type,
                  category: bonusPenaltyForm.category,
                  amount: amt,
                  currency: empComp.currency || "UGX",
                  periodMonth: bonusPenaltyForm.periodMonth,
                  periodYear: bonusPenaltyForm.periodYear,
                  reason: bonusPenaltyForm.reason,
                  status: "approved",
                  addedBy: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "HR Administrator",
                });
                setIsBonusPenaltyModalOpen(false);
                setBonusPenaltyForm({
                  type: "bonus",
                  category: "Performance Bonus",
                  amount: "",
                  periodMonth: 10,
                  periodYear: 2026,
                  reason: "",
                });
              } finally {
                setIsSavingBonusPenalty(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Adjustment Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setBonusPenaltyForm({ ...bonusPenaltyForm, type: "bonus", category: "Performance Bonus" })}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    border: bonusPenaltyForm.type === "bonus" ? "2px solid #16A34A" : "1px solid #E4E4E7",
                    background: bonusPenaltyForm.type === "bonus" ? "#F0FDF4" : "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 13,
                    color: bonusPenaltyForm.type === "bonus" ? "#166534" : "#52525B",
                    cursor: "pointer",
                  }}
                >
                  + Bonus / Extra Earning
                </button>
                <button
                  type="button"
                  onClick={() => setBonusPenaltyForm({ ...bonusPenaltyForm, type: "penalty", category: "Unpaid Absence Adjustment" })}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    border: bonusPenaltyForm.type === "penalty" ? "2px solid #DC2626" : "1px solid #E4E4E7",
                    background: bonusPenaltyForm.type === "penalty" ? "#FEF2F2" : "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 13,
                    color: bonusPenaltyForm.type === "penalty" ? "#991B1B" : "#52525B",
                    cursor: "pointer",
                  }}
                >
                  - Penalty / Lawful Deduction
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Category</label>
              <select
                className="select"
                value={bonusPenaltyForm.category}
                onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, category: e.target.value })}
              >
                {bonusPenaltyForm.type === "bonus" ? (
                  <>
                    <option value="Performance Bonus">Performance Bonus</option>
                    <option value="Attendance Bonus">Attendance Bonus</option>
                    <option value="Signing Bonus">Signing Bonus</option>
                    <option value="Customer Satisfaction Spiff">Customer Satisfaction Spiff</option>
                    <option value="Holiday Bonus">Holiday / Seasonal Bonus</option>
                    <option value="Other Discretionary Bonus">Other Discretionary Bonus</option>
                  </>
                ) : (
                  <>
                    <option value="Unpaid Absence Adjustment">Unpaid Absence Adjustment</option>
                    <option value="Salary Advance Repayment">Salary Advance Repayment</option>
                    <option value="Equipment Damage / Loss">Equipment Damage / Loss</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                    <option value="Authorized Other Deduction">Authorized Other Deduction</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
                  Amount ({empComp.currency || "UGX"})
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 250000"
                  value={bonusPenaltyForm.amount}
                  onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Applicable Month</label>
                <select
                  className="select"
                  value={bonusPenaltyForm.periodMonth}
                  onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, periodMonth: Number(e.target.value) })}
                >
                  <option value={10}>October 2026</option>
                  <option value={9}>September 2026</option>
                  <option value={8}>August 2026</option>
                  <option value={11}>November 2026</option>
                  <option value={12}>December 2026</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Reason / Audit Justification</label>
              <textarea
                className="textarea"
                placeholder="Specific authorization reason or ticket reference..."
                value={bonusPenaltyForm.reason}
                onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, reason: e.target.value })}
                style={{ minHeight: 70 }}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn-neutral"
                onClick={() => setIsBonusPenaltyModalOpen(false)}
                disabled={isSavingBonusPenalty}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSavingBonusPenalty}>
                {isSavingBonusPenalty ? <Loader2 size={15} className="animate-spin" /> : "Save to Payroll"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: EDIT EMPLOYEE COMPENSATION POLICY (HR Admin) */}
      {isEditCompensationOpen && (
        <Modal
          isOpen={isEditCompensationOpen}
          onClose={() => setIsEditCompensationOpen(false)}
          title={`Configure Compensation Policy — ${employeeFullName}`}
          width={520}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSavingCompensation(true);
              try {
                saveEmployeeCompensation({
                  ...empComp,
                  compensationModel: compensationForm.compensationModel,
                  hourlyRate: Number(compensationForm.hourlyRate) || 0,
                  baseSalary: Number(compensationForm.baseSalary) || 0,
                  dailyRate: Number(compensationForm.dailyRate) || 0,
                  currency: compensationForm.currency,
                  isExemptFromOvertime: compensationForm.isExemptFromOvertime,
                });
                setIsEditCompensationOpen(false);
              } finally {
                setIsSavingCompensation(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Compensation Model</label>
              <select
                className="select"
                value={compensationForm.compensationModel}
                onChange={(e) =>
                  setCompensationForm({ ...compensationForm, compensationModel: e.target.value as CompensationModel })
                }
              >
                <option value="hourly">Hourly (Pay rate × Productive hours)</option>
                <option value="monthly_salary">Monthly Salary (Fixed monthly compensation)</option>
                <option value="daily">Daily (Daily rate × Eligible days)</option>
                <option value="overtime_based">Overtime-Based (Productive base + Overtime tiers)</option>
                <option value="commission_based">Commission-Based (Base + Sales commissions)</option>
                <option value="mixed">Mixed Compensation (Base + Differentials + Spiffs)</option>
              </select>
            </div>

            {compensationForm.compensationModel === "hourly" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Hourly Pay Rate</label>
                <input
                  type="number"
                  className="input"
                  value={compensationForm.hourlyRate}
                  onChange={(e) => setCompensationForm({ ...compensationForm, hourlyRate: e.target.value })}
                  placeholder="e.g. 18500"
                  required
                />
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  Productive hours tracked in attendance will be multiplied by this rate.
                </span>
              </div>
            )}

            {compensationForm.compensationModel === "monthly_salary" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Fixed Monthly Salary</label>
                <input
                  type="number"
                  className="input"
                  value={compensationForm.baseSalary}
                  onChange={(e) => setCompensationForm({ ...compensationForm, baseSalary: e.target.value })}
                  placeholder="e.g. 3500000"
                  required
                />
              </div>
            )}

            {compensationForm.compensationModel === "daily" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Daily Pay Rate</label>
                <input
                  type="number"
                  className="input"
                  value={compensationForm.dailyRate}
                  onChange={(e) => setCompensationForm({ ...compensationForm, dailyRate: e.target.value })}
                  placeholder="e.g. 150000"
                  required
                />
              </div>
            )}

            {(compensationForm.compensationModel === "overtime_based" ||
              compensationForm.compensationModel === "mixed" ||
              compensationForm.compensationModel === "commission_based") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Base Monthly Pay</label>
                  <input
                    type="number"
                    className="input"
                    value={compensationForm.baseSalary}
                    onChange={(e) => setCompensationForm({ ...compensationForm, baseSalary: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Base Hourly Rate</label>
                  <input
                    type="number"
                    className="input"
                    value={compensationForm.hourlyRate}
                    onChange={(e) => setCompensationForm({ ...compensationForm, hourlyRate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Currency</label>
              <select
                className="select"
                value={compensationForm.currency}
                onChange={(e) => setCompensationForm({ ...compensationForm, currency: e.target.value })}
              >
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="RWF">RWF — Rwandan Franc</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="isExemptFromOvertime"
                checked={compensationForm.isExemptFromOvertime}
                onChange={(e) => setCompensationForm({ ...compensationForm, isExemptFromOvertime: e.target.checked })}
              />
              <label htmlFor="isExemptFromOvertime" style={{ fontSize: 12.5, color: "#3F3F46", cursor: "pointer" }}>
                Exempt from overtime pay (salaried leadership / executive)
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="btn-neutral"
                onClick={() => setIsEditCompensationOpen(false)}
                disabled={isSavingCompensation}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSavingCompensation}>
                {isSavingCompensation ? <Loader2 size={15} className="animate-spin" /> : "Save Compensation"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Slide-out Calculation Formula Drawer */}
      <CalculationFormulaModal
        isOpen={isFormulaHelpOpen}
        onClose={() => setIsFormulaHelpOpen(false)}
        compensationModel={empComp.compensationModel}
        payRateDisplay={
          empComp.compensationModel === "hourly"
            ? `${formatMoney(empComp.hourlyRate || 10000, empComp.currency || "UGX")} / hr`
            : `${formatMoney(empComp.baseSalary || 2000000, empComp.currency || "UGX")} / mo`
        }
      />
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
