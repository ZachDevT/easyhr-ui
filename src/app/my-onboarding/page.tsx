"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  PlayCircle,
  FileText,
  Users,
  Building,
  Laptop,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Check,
  ChevronRight,
  UserCheck,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { OnboardingPortalSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

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

const STEPS = [
  { id: 1, title: "Welcome & Intro", key: "welcome" },
  { id: 2, title: "Profile Details", key: "profile" },
  { id: 3, title: "Direct Deposit", key: "bank" },
  { id: 4, title: "Handbook Sign-off", key: "handbook" },
];

export default function MyOnboardingPage() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employee, setEmployee] = useState<EmployeeMe | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Profile Form state
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [administrativeArea, setAdministrativeArea] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState("Bank Account");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Handbook Form state
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    async function fetchMyProfile() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/employees/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: EmployeeMe = await res.json();
          setEmployee(data);

          // Populate form states with existing profile values
          setPersonalEmail(data.personalEmail || clerkUser?.primaryEmailAddress?.emailAddress || "");
          setPersonalPhone(data.personalPhone || "");
          setAddressLine1(data.addressLine1 || "");
          setAddressLine2(data.addressLine2 || "");
          setCity(data.city || "");
          setAdministrativeArea(data.administrativeArea || "");
          setPostalCode(data.postalCode || "");
          setEmergencyName(data.emergencyContactName || "");
          setEmergencyRel(data.emergencyContactRelationship || "");
          setEmergencyPhone(data.emergencyContactPhone || "");

          if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
          if (data.bankName) setBankName(data.bankName);
          if (data.bankRoutingNumber) setRoutingNumber(data.bankRoutingNumber);
          if (data.bankAccountNumber) setAccountNumber(data.bankAccountNumber);

          if (data.handbookSignedAt) {
            setAcknowledged(true);
          }

          if (data.status === "active") {
            setIsCompleted(true);
            setCompletedSteps([0, 1, 2, 3]);
            setActiveStep(3);
          }
        }
      } catch (err) {
        console.error("Failed to load employee onboarding profile", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProfile();
  }, [getToken, clerkUser]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalEmail,
          personalPhone,
          addressLine1,
          addressLine2,
          city,
          administrativeArea,
          postalCode,
          emergencyContactName: emergencyName,
          emergencyContactRelationship: emergencyRel,
          emergencyContactPhone: emergencyPhone,
        }),
      });

      if (!completedSteps.includes(1)) {
        setCompletedSteps((prev) => [...prev, 1]);
      }
      setActiveStep(2);
    } catch (err) {
      console.error("Failed to save personal profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          bankName,
          bankRoutingNumber: routingNumber,
          bankAccountNumber: accountNumber,
        }),
      });

      if (!completedSteps.includes(2)) {
        setCompletedSteps((prev) => [...prev, 2]);
      }
      setActiveStep(3);
    } catch (err) {
      console.error("Failed to save payment info", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!acknowledged) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      // 1. Save handbook signoff timestamp
      await fetch(`${API_BASE_URL}/api/v1/employees/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          handbookSignedAt: new Date().toISOString(),
        }),
      });

      // 2. Activate employee in the system
      if (employee?.id) {
        await fetch(`${API_BASE_URL}/api/v1/employees/${employee.id}/activate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setCompletedSteps([0, 1, 2, 3]);
      setIsCompleted(true);
      if (employee) {
        setEmployee({ ...employee, status: "active" });
      }
    } catch (err) {
      console.error("Failed to complete onboarding", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <OnboardingPortalSkeleton />;
  }

  const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.trim() || "Team Member" : "New Hire";
  const roleName = employee?.jobTitle || "Team Member";
  const departmentName = employee?.department || "General";
  const locationName = employee?.location || "Headquarters";
  const startDateStr = employee?.startDate || "First Day";
  const progressPercent = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <div
      className="page-container"
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-page)",
        overflowY: "auto",
      }}
    >
      {/* Dynamic Header Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, var(--primary) 0%, #4338CA 100%)",
          color: "white",
          border: "none",
          borderRadius: 16,
          flexShrink: 0,
          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)",
        }}
      >
        <CardBody
          style={{
            padding: "24px 32px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="row gap-20 align-center">
            <div
              style={{
                padding: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                border: "2px solid white",
              }}
            >
              <Avatar
                name={employeeName}
                size="xl"
                src={employee?.avatar || clerkUser?.imageUrl}
              />
            </div>
            <div>
              <div className="row gap-8 align-center mb-4">
                <h1 className="text-2xl fw-800 m-0" style={{ color: "white" }}>
                  Welcome aboard, {employee?.firstName || "there"}! 🎉
                </h1>
                {isCompleted && (
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.25)",
                      border: "1px solid rgba(16, 185, 129, 0.5)",
                      color: "#A7F3D0",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 12,
                    }}
                  >
                    Active Employee
                  </span>
                )}
              </div>
              <div className="row gap-16 text-sm fw-500" style={{ color: "rgba(255,255,255,0.9)" }}>
                <span className="row gap-4 align-center">
                  <Briefcase size={14} /> {roleName}
                </span>
                <span>•</span>
                <span className="row gap-4 align-center">
                  <Building size={14} /> {departmentName} &bull; {locationName}
                </span>
                <span>•</span>
                <span className="row gap-4 align-center">
                  <Calendar size={14} /> Started: {startDateStr}
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", minWidth: 200 }}>
            <div className="text-sm fw-600 mb-8" style={{ color: "rgba(255,255,255,0.9)" }}>
              {isCompleted ? "Onboarding 100% Complete" : `Progress: ${completedSteps.length} of ${STEPS.length} Steps`}
            </div>
            <div className="row gap-12 align-center">
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "white",
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span className="text-sm fw-800">{progressPercent}%</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Completion Banner if employee is active */}
      {isCompleted && (
        <Card
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            border: "1px solid #A7F3D0",
            borderRadius: 16,
          }}
        >
          <CardBody style={{ padding: "24px 32px" }}>
            <div className="row-between align-center">
              <div className="row gap-16 align-center">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#059669",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg fw-800 text-1 m-0 mb-4" style={{ color: "#065F46" }}>
                    Congratulations! You are officially active on ProjectEasyHR!
                  </h3>
                  <p className="text-sm m-0" style={{ color: "#047857" }}>
                    Your onboarding documentation is verified. You now have full access to daily workplace tools.
                  </p>
                </div>
              </div>

              <div className="row gap-12">
                <Link
                  href="/attendance"
                  className="btn-primary row gap-6 align-center"
                  style={{ textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13 }}
                >
                  Clock In & Attendance &rarr;
                </Link>
                <Link
                  href="/time-off"
                  className="btn-secondary row gap-6 align-center"
                  style={{ textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13 }}
                >
                  Request Time Off
                </Link>
                <Link
                  href="/payroll"
                  className="btn-secondary row gap-6 align-center"
                  style={{ textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13 }}
                >
                  Pay Stubs
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div
        className="grid-2 gap-32"
        style={{ gridTemplateColumns: "1fr 340px", alignItems: "flex-start" }}
      >
        {/* Main Content Stepper Area */}
        <div className="col gap-24">
          {/* Horizontal Stepper */}
          <Card style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardBody style={{ padding: "20px 24px" }}>
              <div className="row-between">
                {STEPS.map((step, idx) => {
                  const isActive = activeStep === idx;
                  const isDone = completedSteps.includes(idx);

                  return (
                    <div key={step.id} className="row" style={{ flex: 1, position: "relative" }}>
                      <div
                        className="col-center gap-8"
                        style={{
                          flex: 1,
                          cursor: "pointer",
                          opacity: isActive || isDone ? 1 : 0.5,
                          transition: "0.2s",
                        }}
                        onClick={() => setActiveStep(idx)}
                      >
                        <div
                          className="icon-chip"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: isActive
                              ? "var(--primary-tint)"
                              : isDone
                              ? "var(--success-tint)"
                              : "#F3F4F6",
                            color: isActive
                              ? "var(--primary)"
                              : isDone
                              ? "var(--success)"
                              : "var(--text-4)",
                            border: isActive
                              ? "2px solid var(--primary)"
                              : "2px solid transparent",
                            transition: "0.2s",
                          }}
                        >
                          {isDone && !isActive ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <span className="fw-700 text-sm">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs fw-700 ${
                            isActive ? "text-primary" : isDone ? "text-1" : "text-4"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>

                      {idx < STEPS.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 19,
                            left: "60%",
                            right: "-40%",
                            height: 2,
                            background: isDone ? "var(--success)" : "#F3F4F6",
                            zIndex: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Active Step Content */}
          <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <CardBody style={{ padding: 40, minHeight: 420 }}>
              {/* STEP 1: Welcome & Orientation */}
              {activeStep === 0 && (
                <div className="col gap-28 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <span
                      style={{
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Step 1 of 4 &bull; Orientation
                    </span>
                    <h2 className="text-2xl fw-800 text-1 mb-8">
                      Welcome to your new team!
                    </h2>
                    <p className="text-base text-5">
                      We are thrilled to welcome you as <strong>{roleName}</strong> in the{" "}
                      <strong>{departmentName}</strong> team. Here is everything you need to get oriented.
                    </p>
                  </div>

                  {/* Orientation Media Banner */}
                  <div
                    style={{
                      width: "100%",
                      height: 220,
                      background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
                      borderRadius: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                      position: "relative",
                      padding: 24,
                      textAlign: "center",
                    }}
                  >
                    <PlayCircle
                      size={54}
                      style={{ color: "white", cursor: "pointer", marginBottom: 12 }}
                    />
                    <div className="text-base fw-700">Company Orientation & Culture Walkthrough</div>
                    <div className="text-xs text-4" style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                      Duration: 4 mins &bull; EasyHR Onboarding Series
                    </div>
                  </div>

                  <div className="divider m-0" />

                  {/* Highlights */}
                  <div className="grid-2 gap-16">
                    <div
                      className="p-16 row gap-12 align-center"
                      style={{ background: "#F9FAFB", borderRadius: 10, border: "1px solid var(--border)" }}
                    >
                      <CheckCircle2 size={18} className="text-success" />
                      <div>
                        <div className="text-sm fw-700 text-1">Work Email Active</div>
                        <div className="text-xs text-5">{employee?.workEmail || clerkUser?.primaryEmailAddress?.emailAddress}</div>
                      </div>
                    </div>
                    <div
                      className="p-16 row gap-12 align-center"
                      style={{ background: "#F9FAFB", borderRadius: 10, border: "1px solid var(--border)" }}
                    >
                      <CheckCircle2 size={18} className="text-success" />
                      <div>
                        <div className="text-sm fw-700 text-1">Assigned Department</div>
                        <div className="text-xs text-5">{departmentName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="row-between mt-16">
                    <button className="btn-neutral" disabled style={{ padding: "10px 24px" }}>
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      style={{ padding: "10px 28px" }}
                      onClick={() => {
                        if (!completedSteps.includes(0)) {
                          setCompletedSteps((prev) => [...prev, 0]);
                        }
                        setActiveStep(1);
                      }}
                    >
                      Next: Profile Details <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Profile Setup */}
              {activeStep === 1 && (
                <div className="col gap-28 max-w-2xl mx-auto">
                  <div>
                    <span
                      style={{
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Step 2 of 4 &bull; Personal Profile
                    </span>
                    <h2 className="text-2xl fw-800 text-1 mb-6">Complete Your Personal Profile</h2>
                    <p className="text-sm text-5">
                      Verify your contact details and specify your emergency contact so we can keep our company records up to date.
                    </p>
                  </div>

                  <div className="grid-2 gap-20">
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Personal Email
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. personal@gmail.com"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                      />
                    </div>
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Personal Phone
                      </label>
                      <Input
                        type="tel"
                        placeholder="e.g. +1 (555) 000-1234"
                        value={personalPhone}
                        onChange={(e) => setPersonalPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col gap-12">
                    <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                      Residential Address
                    </label>
                    <Input
                      type="text"
                      placeholder="Street Address Line 1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="Apt, Suite, Unit (Optional)"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                    <div className="grid-3 gap-12">
                      <Input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="State / Province"
                        value={administrativeArea}
                        onChange={(e) => setAdministrativeArea(e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Postal / Zip Code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="divider m-0" />

                  <h3 className="text-base fw-800 text-1 m-0">Emergency Contact</h3>

                  <div className="grid-3 gap-16">
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Contact Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                      />
                    </div>
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Relationship
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Spouse, Parent"
                        value={emergencyRel}
                        onChange={(e) => setEmergencyRel(e.target.value)}
                      />
                    </div>
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Emergency Phone
                      </label>
                      <Input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row-between mt-12">
                    <button className="btn-neutral" onClick={() => setActiveStep(0)}>
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      disabled={isSaving}
                      onClick={handleSaveProfile}
                      style={{ padding: "10px 28px" }}
                    >
                      {isSaving ? "Saving..." : "Save & Continue"}{" "}
                      <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Direct Deposit & Payroll */}
              {activeStep === 2 && (
                <div className="col gap-28 max-w-2xl mx-auto">
                  <div>
                    <span
                      style={{
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Step 3 of 4 &bull; Compensation & Direct Deposit
                    </span>
                    <h2 className="text-2xl fw-800 text-1 mb-6">Payment Method Setup</h2>
                    <p className="text-sm text-5">
                      Provide your banking or payout details so the finance team can process your paychecks seamlessly.
                    </p>
                  </div>

                  <div className="col gap-20">
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Payment Method
                      </label>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Bank Account">Bank Account (Direct Deposit)</option>
                        <option value="Mobile Money">Mobile Money (East Africa)</option>
                        <option value="PayPal">PayPal</option>
                      </Select>
                    </div>

                    {paymentMethod === "Bank Account" && (
                      <div className="col gap-16">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Bank Name
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. JPMorgan Chase, Wells Fargo, BK"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                          />
                        </div>
                        <div className="grid-2 gap-16">
                          <div className="col gap-8">
                            <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                              Routing / Sort Code
                            </label>
                            <Input
                              type="text"
                              placeholder="9-digit routing number"
                              value={routingNumber}
                              onChange={(e) => setRoutingNumber(e.target.value)}
                            />
                          </div>
                          <div className="col gap-8">
                            <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                              Account Number
                            </label>
                            <Input
                              type="password"
                              placeholder="Account number"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "Mobile Money" && (
                      <div className="col gap-16">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Mobile Money Provider
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. MTN MoMo, Airtel Money, M-Pesa"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                          />
                        </div>
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Registered Mobile Phone
                          </label>
                          <Input
                            type="tel"
                            placeholder="+250 788 123 456"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === "PayPal" && (
                      <div className="col gap-8">
                        <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                          PayPal Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="paypal-account@email.com"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div
                    className="p-16 text-sm text-5 row gap-12 align-center"
                    style={{
                      background: "#F9FAFB",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ShieldCheck size={20} className="text-success" />
                    <span>
                      Your financial information is encrypted end-to-end and stored securely.
                    </span>
                  </div>

                  <div className="row-between mt-12">
                    <button className="btn-neutral" onClick={() => setActiveStep(1)}>
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      disabled={isSaving}
                      onClick={handleSavePayment}
                      style={{ padding: "10px 28px" }}
                    >
                      {isSaving ? "Saving..." : "Authorize Deposit"}{" "}
                      <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Compliance & Handbook Sign-off */}
              {activeStep === 3 && (
                <div className="col gap-28 max-w-2xl mx-auto">
                  <div>
                    <span
                      style={{
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Step 4 of 4 &bull; Compliance & Sign-off
                    </span>
                    <h2 className="text-2xl fw-800 text-1 mb-6">Employee Handbook & Policies</h2>
                    <p className="text-sm text-5">
                      Please review the organization's policies, code of conduct, and workplace guidelines.
                    </p>
                  </div>

                  {/* Document preview card */}
                  <div
                    className="p-24 row gap-20 align-center"
                    style={{
                      background: "#F9FAFB",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                    }}
                  >
                    <div
                      className="icon-chip"
                      style={{
                        width: 56,
                        height: 56,
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                        borderRadius: 12,
                      }}
                    >
                      <FileText size={28} />
                    </div>
                    <div className="col gap-4" style={{ flex: 1 }}>
                      <h4 className="text-base fw-700 text-1 m-0">
                        {employee?.companyName || "ProjectEasyHR"} Employee Handbook 2026.pdf
                      </h4>
                      <div className="text-xs text-5">
                        Comprehensive workplace guidelines &bull; Updated for 2026
                      </div>
                    </div>
                    <button
                      className="btn-secondary btn-sm row gap-6 align-center"
                      onClick={() => toast.success("Handbook verified", "Employee handbook is verified and up to date.")}
                    >
                      <ExternalLink size={14} /> View Document
                    </button>
                  </div>

                  {/* Checkbox */}
                  <label
                    className="row gap-14 p-16 align-start"
                    style={{
                      background: "white",
                      borderRadius: 12,
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      style={{ width: 20, height: 20, cursor: "pointer", marginTop: 2 }}
                    />
                    <span className="text-sm fw-600 text-1" style={{ lineHeight: 1.5 }}>
                      I confirm that I have reviewed the Employee Handbook, and I agree to adhere to all policies,
                      standards of conduct, and organizational guidelines.
                    </span>
                  </label>

                  <div className="divider m-0" />

                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setActiveStep(2)}>
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!acknowledged || isSaving}
                      onClick={handleCompleteOnboarding}
                      style={{
                        padding: "12px 32px",
                        background: acknowledged
                          ? "linear-gradient(135deg, var(--primary) 0%, #4338CA 100%)"
                          : undefined,
                      }}
                    >
                      {isSaving ? "Completing..." : isCompleted ? "Active Employee (Completed)" : "Sign & Complete Onboarding 🎉"}
                    </button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="col gap-24">
          {/* IT Provisioning Status */}
          <Card style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 className="text-sm fw-700 text-1 row gap-10 align-center m-0">
                <Laptop size={18} className="text-primary" /> IT & Workspace Setup
              </h3>
            </div>
            <CardBody style={{ padding: 24 }}>
              <div className="col gap-16">
                <div className="row gap-12 text-sm align-center">
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="text-1 fw-600">Workstation Allocated</span>
                </div>
                <div className="row gap-12 text-sm align-center">
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="text-1 fw-600">SSO & Identity Active</span>
                </div>
                <div className="row gap-12 text-sm align-center">
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="text-1 fw-600">HR Portal Access</span>
                </div>
                <div className="row gap-12 text-sm align-center">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <Clock size={18} className="text-warning" />
                  )}
                  <span className="text-1 fw-600">
                    {isCompleted ? "Profile Verified" : "Awaiting Sign-off"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Support Team Widget */}
          <Card style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 className="text-sm fw-700 text-1 row gap-10 align-center m-0">
                <Users size={18} className="text-primary" /> Your Support Team
              </h3>
            </div>
            <CardBody style={{ padding: 24 }}>
              <div className="col gap-18">
                <div>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-8">
                    Reporting Manager
                  </div>
                  <div
                    className="row gap-12 p-12 align-center"
                    style={{ background: "#F9FAFB", borderRadius: 10, border: "1px solid var(--border)" }}
                  >
                    <Avatar name={employee?.manager || "Manager"} size="sm" />
                    <div>
                      <div className="text-sm fw-700 text-1">
                        {employee?.manager || "Team Lead"}
                      </div>
                      <div className="text-xs text-5">{departmentName} Lead</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-8">
                    HR Support
                  </div>
                  <div
                    className="row gap-12 p-12 align-center"
                    style={{ background: "#F9FAFB", borderRadius: 10, border: "1px solid var(--border)" }}
                  >
                    <Avatar name="EasyHR Team" size="sm" />
                    <div>
                      <div className="text-sm fw-700 text-1">People Operations</div>
                      <div className="text-xs text-5">ProjectEasyHR Team</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
