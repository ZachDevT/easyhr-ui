"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Globe2,
  Landmark,
  Palette,
  ShieldCheck,
  User,
  Smartphone,
  Sparkles,
  Users2,
  Camera,
  Database,
  Briefcase,
  Calculator,
  MessagesSquare,
  MapPin,
  AtSign,
  AlertCircle,
  Clock,
  Navigation,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { FilePicker } from "@/components/ui/FilePicker";
import { EasyHRLogo } from "@/components/marketing/EasyHRLogo";
import PricingCard from "@/components/ui/PricingCard";
import dynamic from "next/dynamic";
import styles from "./register.module.css";
import bill from "./billing.module.css";

const GeofenceMap = dynamic(() => import("@/components/ui/GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "300px",
        background: "#f6f4f1",
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        color: "#888",
        fontSize: "13px",
        border: "1px solid #ddd8d1"
      }}
    >
      Loading map...
    </div>
  ),
});
const steps = [
  { title: "Profile", text: "Creator details", icon: <User /> },
  { title: "Company", text: "Organization details", icon: <Building2 /> },
  { title: "Operations", text: "Location and workforce", icon: <Globe2 /> },
  { title: "Workspace", text: "Brand and preferences", icon: <Palette /> },
  { title: "Review", text: "Confirm and launch", icon: <ShieldCheck /> },
  { title: "Plan", text: "Package and billing", icon: <Sparkles /> },
];
const countries = [
  { value: "UG", label: "Uganda", description: "East Africa · UGX" },
  { value: "KE", label: "Kenya", description: "East Africa · KES" },
  { value: "RW", label: "Rwanda", description: "East Africa · RWF" },
  { value: "TZ", label: "Tanzania", description: "East Africa · TZS" },
  { value: "US", label: "United States", description: "North America · USD" },
  { value: "GB", label: "United Kingdom", description: "Europe · GBP" },
];
export default function CompanyRegistration() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    creatorFirstName: "",
    creatorLastName: "",
    creatorEmail: "",
    creatorPhone: "",
    creatorRole: "Business Owner / CEO",
    legalName: "",
    displayName: "",
    website: "",
    industry: "Technology",
    country: "UG",
    size: "11–50",
    timezone: "Africa/Kampala",
    currency: "UGX",
    domain: "",
    color: "#A238FF",
    logoDataUrl: "" as string | null,
    plan: "Starter",
    payment: "mobile-money",
    // New fields
    taxId: "",
    registrationNumber: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    tiktok: "",
    glassdoor: "",
    departments: [] as string[],
    geofenceEnabled: false,
    geofenceLat: 0.3136, // default Kampala
    geofenceLng: 32.5811,
    geofenceRadius: 300,
    geofenceAccuracyTolerance: 50, // clock-in GPS tolerance in meters
    clockInGraceMinutes: 15, // grace period for late arrivals
    workStartTime: "09:00",
    workEndTime: "17:00",
  });

  // Auto-complete inputs from Clerk user profile
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      const first = user.firstName || "";
      const last = user.lastName || "";
      const phone = user.primaryPhoneNumber?.phoneNumber || "";

      setForm((prev) => ({
        ...prev,
        creatorFirstName: prev.creatorFirstName || first,
        creatorLastName: prev.creatorLastName || last,
        creatorEmail: prev.creatorEmail || email,
        creatorPhone: prev.creatorPhone || phone,
        contactEmail: prev.contactEmail || email,
        contactPhone: prev.contactPhone || phone,
        displayName: prev.displayName || (first ? `${first}'s Company` : ""),
        legalName: prev.legalName || (first ? `${first}'s Company Ltd` : ""),
        domain: prev.domain || (first ? first.toLowerCase().replace(/[^a-z0-9]/g, "") : "workspace"),
      }));
    }
  }, [isLoaded, user]);

  const set = (key: string, value: any) =>
    setForm({ ...form, [key]: value });

  const toggleDept = (dept: string) => {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Your authentication session has expired. Please sign in again.");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Provision identity in the Go backend
      try {
        await fetch("http://localhost:8080/api/v1/auth/provision", {
          method: "POST",
          headers,
        });
      } catch (provisionErr) {
        console.warn("Provisioning check:", provisionErr);
      }

      // 2. Build payload for workspace setup
      const cleanSubdomain = (form.domain || form.displayName || "workspace")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/^-+|-+$/g, "") || "workspace";

      const payload = {
        legalName: form.legalName || `${form.displayName || "My Company"} Ltd`,
        displayName: form.displayName || "My Company",
        registrationNumber: form.registrationNumber || undefined,
        taxIdentifier: form.taxId || undefined,
        countryCode: form.country || "UG",
        timezone: form.timezone || "Africa/Kampala",
        currencyCode: (form.currency || "UGX").toUpperCase(),
        industry: form.industry || "Technology",
        companySizeBand: form.size || "11–50",
        websiteUrl: form.website && form.website.startsWith("https://") ? form.website : undefined,
        contactEmail: form.contactEmail || form.creatorEmail || undefined,
        contactPhone: form.contactPhone || form.creatorPhone || undefined,
        subdomain: cleanSubdomain,
        brandColor: form.color && /^#[0-9A-Fa-f]{6}$/.test(form.color) ? form.color : "#A238FF",
        socialLinks: (() => {
          const links: Record<string, string> = {};
          const formatUrl = (u: string) => {
            const trimmed = u.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("https://")) return trimmed;
            if (trimmed.startsWith("http://")) return trimmed.replace("http://", "https://");
            return `https://${trimmed}`;
          };
          if (form.linkedin?.trim()) links.linkedin = formatUrl(form.linkedin);
          if (form.twitter?.trim()) links.x = formatUrl(form.twitter);
          if (form.facebook?.trim()) links.facebook = formatUrl(form.facebook);
          if (form.tiktok?.trim()) links.tiktok = formatUrl(form.tiktok);
          if (form.glassdoor?.trim()) links.glassdoor = formatUrl(form.glassdoor);
          return Object.keys(links).length > 0 ? links : undefined;
        })(),
        initialDepartments: form.departments.length > 0 ? form.departments : ["Operations", "Human Resources"],
        address: {
          line1: form.address || "Main Street",
          city: "Kampala",
        },
        headquarters: {
          name: `${form.displayName || "Main"} Headquarters`,
          countryCode: form.country || "UG",
          timezone: form.timezone || "Africa/Kampala",
          address: {
            line1: form.address || "Main Street",
            city: "Kampala",
          },
          geofence: form.geofenceEnabled ? {
            latitude: form.geofenceLat || 0.3136,
            longitude: form.geofenceLng || 32.5811,
            radiusMeters: form.geofenceRadius || 300,
            accuracyToleranceMeters: form.geofenceAccuracyTolerance || 50,
          } : undefined,
        },
      };

      const res = await fetch("http://localhost:8080/api/v1/setup/organizations", {
        method: "POST",
        headers: {
          ...headers,
          "Idempotency-Key": `org-setup-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.message || `Setup failed (${res.status})`);
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Workspace setup failed:", err);
      setError(err.message || "Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={styles.page}>
      <aside>
        <Link href="/" className={styles.brand} style={{ textDecoration: 'none' }}>
          <EasyHRLogo variant="light" />
        </Link>
        <div className={styles.stepper}>
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`${styles.step} ${i === step ? styles.active : ""} ${i < step ? styles.done : ""}`}
            >
              <div className={styles.stepIcon}>
                {i < step ? <Check /> : s.icon}
              </div>
              <div>
                <b>{s.title}</b>
                <small>{s.text}</small>
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main>
        <header>
          <div>
            <span>
              STEP {step + 1} OF {steps.length}
            </span>
            <b>{Math.round(((step + 1) / steps.length) * 100)}% complete</b>
          </div>
          <div className={styles.progress}>
            <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </header>
        <section className={styles.content}>
          {step === 0 && (
            <>
              <div className={styles.heading}>
                <span>Your Profile</span>
                <h1>Tell us about yourself.</h1>
                <p>
                  As the creator of this workspace, you will be assigned as the primary owner. Let's start with your details.
                </p>
              </div>
              <div className={styles.formGrid}>
                <Field label="First name">
                  <input
                    value={form.creatorFirstName}
                    onChange={(e) => set("creatorFirstName", e.target.value)}
                    placeholder="Jane"
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={form.creatorLastName}
                    onChange={(e) => set("creatorLastName", e.target.value)}
                    placeholder="Doe"
                  />
                </Field>
                <Field label="Work email">
                  <input
                    type="email"
                    value={form.creatorEmail}
                    onChange={(e) => set("creatorEmail", e.target.value)}
                    placeholder="jane.doe@acacia.com"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    value={form.creatorPhone}
                    onChange={(e) => set("creatorPhone", e.target.value)}
                    placeholder="+256 700 000000"
                  />
                </Field>
                <Field label="Your role" full>
                  <select
                    value={form.creatorRole}
                    onChange={(e) => set("creatorRole", e.target.value)}
                  >
                    <option value="" disabled hidden>Select your role...</option>
                    <option>Business Owner / CEO</option>
                    <option>HR Manager / Director</option>
                    <option>Operations Manager</option>
                    <option>IT Administrator</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className={styles.heading}>
                <span>Company foundation</span>
                <h1>Tell us about your organization.</h1>
                <p>
                  We’ll use this information across employee documents, payroll
                  records, and your workspace identity.
                </p>
              </div>
              <div className={styles.formGrid}>
                <Field label="Legal company name">
                  <input
                    value={form.legalName}
                    onChange={(e) => set("legalName", e.target.value)}
                    placeholder="Acacia Technologies Limited"
                  />
                </Field>
                <Field label="Display name">
                  <input
                    value={form.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    placeholder="Acacia Labs"
                  />
                </Field>
                <Field label="Registration number / CIN">
                  <input
                    value={form.registrationNumber}
                    onChange={(e) => set("registrationNumber", e.target.value)}
                    placeholder="e.g. 800100123456"
                  />
                </Field>
                <Field label="Tax ID (TIN)">
                  <input
                    value={form.taxId}
                    onChange={(e) => set("taxId", e.target.value)}
                    placeholder="e.g. 1001234567"
                  />
                </Field>
                <Field label="Contact email">
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="hello@acacialabs.com"
                  />
                </Field>
                <Field label="Contact phone">
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+256 700 000000"
                  />
                </Field>
                <Field label="Company website" full>
                  <input
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://acacialabs.com"
                  />
                </Field>
                <Field label="Industry">
                  <select
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                  >
                    <option>Technology</option>
                    <option>Financial services</option>
                    <option>Healthcare</option>
                    <option>Professional services</option>
                    <option>Retail</option>
                    <option>Nonprofit</option>
                  </select>
                </Field>
                <Field label="Company size">
                  <select
                    value={form.size}
                    onChange={(e) => set("size", e.target.value)}
                  >
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>201–500</option>
                    <option>501–1,000</option>
                    <option>1,000+</option>
                  </select>
                </Field>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className={styles.heading}>
                <span>Operational defaults</span>
                <h1>Where does your team work?</h1>
                <p>
                  These defaults drive regional holidays, time tracking,
                  payroll, and statutory settings. You can add more entities
                  later.
                </p>
              </div>
              <div className={styles.formGrid}>
                <Field label="Country of registration" full>
                  <SearchableSelect
                    value={form.country}
                    onChange={(v) => set("country", v)}
                    options={countries}
                    searchPlaceholder="Search countries..."
                  />
                </Field>
                <Field label="Company timezone">
                  <select
                    value={form.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                  >
                    <option>Africa/Kampala (UTC+3)</option>
                    <option>Africa/Nairobi (UTC+3)</option>
                    <option>Africa/Kigali (UTC+2)</option>
                  </select>
                </Field>
                <Field label="Primary currency">
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                  >
                    <option>UGX — Ugandan Shilling</option>
                    <option>KES — Kenyan Shilling</option>
                    <option>USD — US Dollar</option>
                  </select>
                </Field>
                <Field label="Headquarters address" full>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="E.g. 42 Innovation Drive, Kampala, Uganda"
                  />
                </Field>
              </div>

              <div className={styles.geofenceSection}>
                <label className={styles.geofenceToggle}>
                  <div>
                    <b>Restrict clock-ins to company premises</b>
                    <span>Employees must be within a physical radius to track time.</span>
                  </div>
                  <div className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={form.geofenceEnabled}
                      onChange={(e) => set("geofenceEnabled", e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </div>
                </label>

                {form.geofenceEnabled && (
                  <div className={styles.geofenceBody}>
                    <GeofenceMap
                      lat={form.geofenceLat}
                      lng={form.geofenceLng}
                      radius={form.geofenceRadius}
                      onChange={(lat, lng) => {
                        set("geofenceLat", lat);
                        set("geofenceLng", lng);
                      }}
                    />
                    <div className={styles.sliderContainer}>
                      <MapPin size={16} color="#888" />
                      <input
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={form.geofenceRadius}
                        onChange={(e) => set("geofenceRadius", parseInt(e.target.value))}
                      />
                      <span>Radius: {form.geofenceRadius}m</span>
                    </div>

                    <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#4e4a44", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Navigation size={12} color="#a238ff" /> GPS Accuracy Tolerance
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            step="10"
                            value={form.geofenceAccuracyTolerance}
                            onChange={(e) => set("geofenceAccuracyTolerance", parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: "var(--primary)" }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#18151b", minWidth: "40px" }}>
                            ±{form.geofenceAccuracyTolerance}m
                          </span>
                        </div>
                        <small style={{ fontSize: "10px", color: "#888", display: "block", marginTop: "2px" }}>
                          Rejects spoofed or weak GPS signals beyond this variance
                        </small>
                      </div>

                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#4e4a44", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} color="#a238ff" /> Late Clock-in Grace Window
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <select
                            value={form.clockInGraceMinutes}
                            onChange={(e) => set("clockInGraceMinutes", parseInt(e.target.value))}
                            style={{
                              width: "100%",
                              height: "38px",
                              borderRadius: "8px",
                              border: "1px solid #ddd8d1",
                              fontSize: "12px",
                              padding: "0 10px",
                              background: "#fff"
                            }}
                          >
                            <option value={0}>Strict (0 min grace)</option>
                            <option value={5}>5 minutes grace</option>
                            <option value={10}>10 minutes grace</option>
                            <option value={15}>15 minutes grace (Standard)</option>
                            <option value={30}>30 minutes grace</option>
                          </select>
                        </div>
                        <small style={{ fontSize: "10px", color: "#888", display: "block", marginTop: "2px" }}>
                          Minutes before an arrival is flagged as &apos;Late&apos;
                        </small>
                      </div>
                    </div>

                    <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#4e4a44" }}>Standard Shift Start</span>
                        <input
                          type="time"
                          value={form.workStartTime}
                          onChange={(e) => set("workStartTime", e.target.value)}
                          style={{
                            width: "100%",
                            height: "38px",
                            borderRadius: "8px",
                            border: "1px solid #ddd8d1",
                            padding: "0 10px",
                            fontSize: "12px",
                            marginTop: "6px",
                            background: "#fff"
                          }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#4e4a44" }}>Standard Shift End</span>
                        <input
                          type="time"
                          value={form.workEndTime}
                          onChange={(e) => set("workEndTime", e.target.value)}
                          style={{
                            width: "100%",
                            height: "38px",
                            borderRadius: "8px",
                            border: "1px solid #ddd8d1",
                            padding: "0 10px",
                            fontSize: "12px",
                            marginTop: "6px",
                            background: "#fff"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "36px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#18151b" }}>Basic Departments</span>
                <p style={{ fontSize: "11px", color: "#777", marginBottom: "12px" }}>
                  Select standard departments to pre-populate your workspace structure. You can edit these later.
                </p>
                <div className={styles.deptGrid}>
                  {[
                    { id: "Engineering", icon: <Database /> },
                    { id: "Sales", icon: <Briefcase /> },
                    { id: "Marketing", icon: <MessagesSquare /> },
                    { id: "Human Resources", icon: <Users2 /> },
                    { id: "Finance", icon: <Calculator /> },
                  ].map((d) => (
                    <div
                      key={d.id}
                      className={`${styles.deptCard} ${form.departments.includes(d.id) ? styles.selected : ""}`}
                      onClick={() => toggleDept(d.id)}
                    >
                      {d.icon}
                      <span>{d.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.info}>
                <Globe2 />
                <div>
                  <b>Regional configuration</b>
                  <p>
                    EasyHR will prepare Uganda-compatible payroll and holiday
                    defaults. HR can review all policies before inviting
                    employees.
                  </p>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className={styles.heading}>
                <span>Make it yours</span>
                <h1>Design your company workspace.</h1>
                <p>
                  Your team will see this identity across onboarding, documents,
                  email, and employee self-service.
                </p>
              </div>
              <div className={styles.brandBuilder}>
                <div
                  className={styles.logoPreview}
                  style={{
                    background: form.logoDataUrl
                      ? "#fff"
                      : `linear-gradient(135deg,${form.color},#FF3EA5)`,
                    border: form.logoDataUrl ? "1px solid #e5e0da" : "none",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {form.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoDataUrl}
                      alt="Logo"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    (form.displayName || "A").charAt(0)
                  )}
                </div>
                <div>
                  <h3>{form.displayName || "Your company"}</h3>
                  <p>Workspace branding preview</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.full}>
                  <FilePicker
                    label="Company Brand Logo"
                    value={form.logoDataUrl}
                    onChange={(url) => set("logoDataUrl", url)}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    maxSizeMB={5}
                    placeholderText="Click or drop your company logo here"
                  />
                </div>
                <Field label="Brand color">
                  <div className={styles.colorField}>
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => set("color", e.target.value)}
                    />
                    <input
                      value={form.color}
                      onChange={(e) => set("color", e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Workspace URL" full>
                  <div className={styles.domain}>
                    <span>easyhr.app/</span>
                    <input
                      value={form.domain}
                      onChange={(e) => set("domain", e.target.value)}
                      placeholder="acacia-labs"
                    />
                  </div>
                </Field>
                <Field label="LinkedIn Profile">
                  <div className={styles.socialGroup}>
                    <AtSign />
                    <input
                      value={form.linkedin}
                      onChange={(e) => set("linkedin", e.target.value)}
                      placeholder="linkedin.com/company/acacia"
                    />
                  </div>
                </Field>
                <Field label="Twitter / X Profile">
                  <div className={styles.socialGroup}>
                    <AtSign />
                    <input
                      value={form.twitter}
                      onChange={(e) => set("twitter", e.target.value)}
                      placeholder="twitter.com/acacia"
                    />
                  </div>
                </Field>
                <Field label="Facebook Profile">
                  <div className={styles.socialGroup}>
                    <AtSign />
                    <input
                      value={form.facebook}
                      onChange={(e) => set("facebook", e.target.value)}
                      placeholder="facebook.com/acacia"
                    />
                  </div>
                </Field>
                <Field label="TikTok Profile">
                  <div className={styles.socialGroup}>
                    <AtSign />
                    <input
                      value={form.tiktok}
                      onChange={(e) => set("tiktok", e.target.value)}
                      placeholder="tiktok.com/@acacia"
                    />
                  </div>
                </Field>
                <Field label="Glassdoor">
                  <div className={styles.socialGroup}>
                    <AtSign />
                    <input
                      value={form.glassdoor}
                      onChange={(e) => set("glassdoor", e.target.value)}
                      placeholder="glassdoor.com/Overview/Working-at-Acacia..."
                    />
                  </div>
                </Field>
              </div>
              <div className={styles.info}>
                <Palette />
                <div>
                  <b>Branding can grow with you</b>
                  <p>
                    Upload a full logo, customize employee emails, and configure
                    careers-site branding after setup.
                  </p>
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div className={styles.heading}>
                <span>Ready to launch</span>
                <h1>Review your new workspace.</h1>
                <p>
                  Confirm the foundation below. You can change these settings
                  later with the right administrator permission.
                </p>
              </div>
              <div className={styles.review}>
                <Review
                  icon={<Building2 />}
                  label="Company"
                  value={form.legalName || "Acacia Technologies Limited"}
                  detail={`TIN: ${form.taxId || "Pending"} · ${form.industry}`}
                />
                <Review
                  icon={<Globe2 />}
                  label="Operations"
                  value={
                    countries.find((c) => c.value === form.country)?.label ||
                    "Uganda"
                  }
                  detail={`${form.departments.length} depts · ${form.currency}`}
                />
                <Review
                  icon={<Palette />}
                  label="Workspace"
                  value={`easyhr.app/${form.domain || "acacia-labs"}`}
                  detail={
                    form.logoDataUrl
                      ? "Custom logo uploaded · Branded"
                      : form.linkedin
                      ? "Socials connected · Branded"
                      : "Branded experience"
                  }
                />
                <Review
                  icon={<Clock />}
                  label="Attendance & Geofence"
                  value={
                    form.geofenceEnabled
                      ? `Active (${form.geofenceRadius}m radius)`
                      : "Standard clock-in"
                  }
                  detail={
                    form.geofenceEnabled
                      ? `±${form.geofenceAccuracyTolerance}m tolerance · ${form.clockInGraceMinutes}m grace`
                      : `${form.workStartTime} - ${form.workEndTime} standard shift`
                  }
                />
                <Review
                  icon={<Users2 />}
                  label="Your access"
                  value={`${form.creatorRole || "Company Owner"} · HR Admin`}
                  detail="Full setup and invitation permissions"
                />
              </div>
              <label className={styles.confirm}>
                <input type="checkbox" />
                <span>
                  I confirm that I’m authorized to create and administer this
                  company workspace and that the information provided is
                  accurate.
                </span>
              </label>
            </>
          )}
          {step === 5 && (
            <>
              <div className={styles.heading}>
                <span>Choose your package</span>
                <h1>Start at the right size. Change anytime.</h1>
                <p>
                  Pricing is transparent and grows with your team. Paid plans
                  include the first month free and no long-term commitment.
                </p>
              </div>
              <div className={bill.plans}>
                {[
                  { name: "Free", price: "UGX 0", note: "For small teams getting organized", min: "Up to 9 employees", features: ["People directory", "Basic time off", "Self-service"], featured: false },
                  { name: "Starter", price: "UGX 10,000", note: "Core HR for growing companies", min: "Per employee / month", features: ["Everything in Free", "Time tracking", "Documents & e-signatures"], featured: false },
                  { name: "Growth", price: "UGX 18,000", note: "Automation for established teams", min: "Per employee / month", features: ["Everything in Starter", "Payroll", "Performance"], featured: true },
                  { name: "Complete", price: "UGX 28,000", note: "Full people operating system", min: "Per employee / month", features: ["Everything in Growth", "Engagement", "Benefits"], featured: false },
                ].map((plan) => (
                  <PricingCard
                    key={plan.name}
                    name={plan.name}
                    price={plan.price}
                    note={plan.note}
                    min={plan.min}
                    features={plan.features}
                    tone={plan.featured ? "featured" : "plain"}
                    selectable
                    selected={form.plan === plan.name}
                    onClick={() => set("plan", plan.name)}
                  />
                ))}
              </div>
              <div className={bill.enterprise}>
                <div><b>Need enterprise terms?</b><span>Multiple entities, 500+ employees, custom controls or implementation support.</span></div>
                <Link href="/pricing">Discuss a package <ArrowRight /></Link>
              </div>
              <div className={bill.paymentHeader}>
                <div><span>Payment method</span><h3>{form.plan === "Free" ? "No payment required" : "How would you like to pay?"}</h3></div>
                {form.plan !== "Free" && <small>Nothing charged during your first month</small>}
              </div>
              {form.plan !== "Free" && <div className={bill.payments}>
                {[
                  { id: "mobile-money", label: "Mobile money", detail: "MTN MoMo or Airtel Money", icon: <Smartphone /> },
                  { id: "card", label: "Card", detail: "Visa, Mastercard or Amex", icon: <CreditCard /> },
                  { id: "bank", label: "Bank transfer", detail: "Invoice and local transfer", icon: <Landmark /> },
                ].map((method) => <button type="button" key={method.id} onClick={() => set("payment", method.id)} className={`${bill.payment} ${form.payment === method.id ? bill.selectedPayment : ""}`}>{method.icon}<span><b>{method.label}</b><small>{method.detail}</small></span>{form.payment === method.id && <CheckCircle2 />}</button>)}
              </div>}
              <div className={bill.summary}><ShieldCheck /><div><b>{form.plan} workspace · first month protected</b><p>You can review employee count and the final total before any paid renewal. Billing settings remain available to authorized admins only.</p></div></div>
            </>
          )}
        </section>
        {error && (
          <div style={{
            margin: '0 2rem 1rem',
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#B91C1C',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        <footer>
          <button
            className={styles.back}
            onClick={() => (step ? setStep(step - 1) : history.back())}
          >
            <ArrowLeft /> {step ? "Back" : "Exit setup"}
          </button>
          {step < 5 ? (
            <button className={styles.next} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight />
            </button>
          ) : (
            <button className={styles.next} onClick={handleSubmit} disabled={isSubmitting}>
               {isSubmitting ? "Creating..." : "Create workspace"} <CheckCircle2 />
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}
function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? styles.full : ""}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Review({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article>
      <div>{icon}</div>
      <span>
        <small>{label}</small>
        <b>{value}</b>
        <em>{detail}</em>
      </span>
      <CheckCircle2 />
    </article>
  );
}
