"use client";
import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    creatorFirstName: "",
    creatorLastName: "",
    creatorEmail: "",
    creatorPhone: "",
    creatorRole: "",
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
  });
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
                      <span>{form.geofenceRadius}m</span>
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
                    background: `linear-gradient(135deg,${form.color},#FF3EA5)`,
                  }}
                >
                  {(form.displayName || "A").charAt(0)}
                </div>
                <div>
                  <h3>{form.displayName || "Your company"}</h3>
                  <p>Workspace preview</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <Field label="Company Logo">
                  <div className={styles.uploadPlaceholder}>
                    <Camera size={16} />
                    <span>Upload logo (Optional)</span>
                  </div>
                </Field>
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
                  detail={form.linkedin ? "Socials connected" : "Branded experience"}
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
            <Link href="/dashboard" className={styles.next}>
              Create workspace <CheckCircle2 />
            </Link>
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
