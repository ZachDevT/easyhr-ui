"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import {
  FileText,
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Building,
  Upload,
  DollarSign,
  Calendar,
  X,
  FileCheck,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface CompanyPublic {
  id: string;
  name: string;
  logoUrl: string;
  brandColor: string;
  industry: string;
  websiteUrl: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  departmentName?: string;
}

export default function CareerJobPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const orgParam = searchParams.get("orgId") || searchParams.get("organizationId");
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState<CompanyPublic>({
    id: "",
    name: "ProjectEasyHR",
    logoUrl: "",
    brandColor: "#4F46E5",
    industry: "Innovation & Technology",
    websiteUrl: "",
  });
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Candidate application form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentLocation: "",
    expectedSalaryGross: "",
    currency: "USD",
    noticePeriod: "Immediate",
    linkedinUrl: "",
    portfolioUrl: "",
    coverLetter: "",
    resumeUrl: "",
    resumeFilename: "",
  });

  useEffect(() => {
    async function loadJobAndCompany() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 1. Fetch public company profile
        const compUrl = orgParam
          ? `http://localhost:8080/api/v1/public/company?organizationId=${orgParam}`
          : "http://localhost:8080/api/v1/public/company";
        const compRes = await fetch(compUrl);
        let currentOrgId = orgParam || "";
        if (compRes.ok) {
          const compData: CompanyPublic = await compRes.json();
          if (compData.name) {
            setCompany(compData);
            currentOrgId = compData.id || currentOrgId;
          }
        }

        // 2. Fetch jobs
        const jobsUrl = currentOrgId
          ? `http://localhost:8080/api/v1/public/jobs?organizationId=${currentOrgId}`
          : "http://localhost:8080/api/v1/public/jobs";
        const res = await fetch(jobsUrl, { headers });
        if (res.ok) {
          const list: JobDetail[] = await res.json();
          if (jobId) {
            const found = list.find((j) => j.id === jobId);
            if (found) setJob(found);
            else if (list.length > 0) setJob(list[0]);
          } else if (list.length > 0) {
            setJob(list[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load job details", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobAndCompany();
  }, [jobId, orgParam, getToken]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("http://localhost:8080/api/v1/public/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload CV/resume. Please try again.");
      }

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        resumeUrl: data.resumeUrl,
        resumeFilename: data.resumeFilename || file.name,
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    setForm((prev) => ({ ...prev, resumeUrl: "", resumeFilename: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setErrorMsg("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setErrorMsg("First name, last name, and email are required");
      return;
    }

    if (!form.resumeUrl) {
      setErrorMsg("Please upload your CV / Resume before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        currentLocation: form.currentLocation.trim() || null,
        expectedSalaryGross: form.expectedSalaryGross ? parseInt(form.expectedSalaryGross, 10) : null,
        currency: form.currency || "USD",
        noticePeriod: form.noticePeriod || "Immediate",
        linkedinUrl: form.linkedinUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        coverLetter: form.coverLetter.trim() || null,
        resumeUrl: form.resumeUrl || null,
        resumeFilename: form.resumeFilename || null,
      };

      const res = await fetch(`http://localhost:8080/api/v1/public/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.message || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while submitting your application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = company.brandColor || "#4F46E5";

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#F9FAFB", padding: 24 }}>
        <div style={{ background: "white", padding: 48, borderRadius: 20, maxWidth: 560, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--success-tint)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
            <CheckCircle2 size={38} />
          </div>
          <h2 className="text-2xl fw-800 text-1 mb-12">Application Submitted!</h2>
          <p className="text-base text-4 mb-24" style={{ lineHeight: 1.6 }}>
            Thank you, <strong>{form.firstName}</strong>. Your CV and application for <strong>{job?.title}</strong> at <strong>{company.name}</strong> have been received successfully.
          </p>
          <div className="p-16 mb-28 text-sm text-5" style={{ background: "#F9FAFB", borderRadius: 12, border: "1px solid var(--border)", textAlign: "left" }}>
            <div className="row-between mb-8"><span>Applicant:</span><strong>{form.firstName} {form.lastName}</strong></div>
            <div className="row-between mb-8"><span>Role:</span><strong>{job?.title}</strong></div>
            <div className="row-between mb-8"><span>Location:</span><strong>{form.currentLocation || "Not specified"}</strong></div>
            <div className="row-between"><span>CV Attached:</span><strong className="text-primary">{form.resumeFilename || "Uploaded"}</strong></div>
          </div>
          <Link
            href={`/careers${company.id ? `?orgId=${company.id}` : ""}`}
            className="btn-primary"
            style={{ display: "inline-block", textDecoration: "none", padding: "12px 28px", borderRadius: 10, background: brandColor }}
          >
            &larr; View More Roles at {company.name}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F9FAFB" }}>
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#F9FAFB", padding: 40, gap: 16 }}>
        <h2 className="text-2xl fw-800 text-1">Job Opening Not Found</h2>
        <p className="text-base text-4">This job posting may have been closed or removed.</p>
        <Link href={`/careers${company.id ? `?orgId=${company.id}` : ""}`} className="btn-primary">
          Back to Careers
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "var(--font-sans)", paddingBottom: 100 }}>
      {/* Dynamic Header with Real Company Logo */}
      <header
        style={{
          background: "#111827",
          padding: "18px 48px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href={`/careers${company.id ? `?orgId=${company.id}` : ""}`} style={{ textDecoration: "none" }}>
          <div className="row gap-14 align-center">
            {company.logoUrl ? (
              <div
                style={{
                  background: "white",
                  padding: "4px 10px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  style={{ height: 28, maxWidth: 120, objectFit: "contain" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: brandColor,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {company.name ? company.name.charAt(0).toUpperCase() : "E"}
              </div>
            )}
            <span className="fw-800 text-lg text-white">{company.name} Careers</span>
          </div>
        </Link>
        <Link
          href={`/careers${company.id ? `?orgId=${company.id}` : ""}`}
          className="text-white row gap-6 align-center text-sm fw-600"
          style={{ textDecoration: "none", opacity: 0.8 }}
        >
          <ArrowLeft size={16} /> All Roles
        </Link>
      </header>

      <div style={{ maxWidth: 880, margin: "40px auto", padding: "0 24px" }}>
        <Card style={{ border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.06)", overflow: "visible", borderRadius: 20 }}>
          <CardBody style={{ padding: 0 }}>
            {/* Job Header */}
            <div style={{ padding: "44px 48px 30px 48px", borderBottom: "1px solid var(--border)" }}>
              <div className="row gap-12 mb-16 align-center">
                <Badge variant="primary" style={{ background: "var(--primary-tint)", color: brandColor, fontWeight: 700 }}>
                  {job.departmentName || "General"}
                </Badge>
                <Badge variant="neutral">{job.location || "Remote"}</Badge>
                <Badge variant="neutral">{job.employmentType || "Full-time"}</Badge>
              </div>
              <h1 className="text-3xl fw-800 text-1 m-0 mb-14">{job.title}</h1>
              <div className="row gap-20 text-sm text-5 fw-500">
                <span className="row gap-6 align-center">
                  <Building size={16} /> {company.name}
                </span>
                <span>&bull;</span>
                <span className="row gap-6 align-center">
                  <MapPin size={16} /> {job.location}
                </span>
                <span>&bull;</span>
                <span className="row gap-6 align-center">
                  <Clock size={16} /> {job.employmentType}
                </span>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#FAFBFD" }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  background: step === 1 ? "white" : "transparent",
                  border: "none",
                  borderBottom: step === 1 ? `2px solid ${brandColor}` : "none",
                  fontWeight: 700,
                  fontSize: 14,
                  color: step === 1 ? brandColor : "var(--text-4)",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                1. Job Description & Culture
              </button>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  background: step === 2 ? "white" : "transparent",
                  border: "none",
                  borderBottom: step === 2 ? `2px solid ${brandColor}` : "none",
                  fontWeight: 700,
                  fontSize: 14,
                  color: step === 2 ? brandColor : "var(--text-4)",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                2. Application & CV Submission
              </button>
            </div>

            <div style={{ padding: "40px 48px" }}>
              {step === 1 ? (
                <div>
                  <div className="prose" style={{ lineHeight: 1.7, color: "var(--text-2)", fontSize: 16 }}>
                    <h3 className="text-xl fw-800 text-1 mb-16">About the Role</h3>
                    <p style={{ whiteSpace: "pre-line", marginBottom: 32 }}>{job.description}</p>

                    <h3 className="text-xl fw-800 text-1 mb-16">Why Join {company.name}?</h3>
                    <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                      <li>Collaborative, high-impact culture where every team member has a voice.</li>
                      <li>Competitive compensation, comprehensive benefits, and flexible work options.</li>
                      <li>Modern technology stack and continuous opportunities for professional growth.</li>
                    </ul>
                  </div>

                  <div className="mt-40 row-between align-center" style={{ paddingTop: 32, borderTop: "1px solid var(--border)" }}>
                    <div className="text-sm text-5">Interested in this role? Fill in your details and attach your CV.</div>
                    <button
                      className="btn-primary"
                      onClick={() => setStep(2)}
                      style={{ padding: "12px 32px", fontSize: 15, background: brandColor }}
                    >
                      Apply for this Role &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {errorMsg && (
                    <div
                      className="p-16 mb-24 text-sm"
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #F87171",
                        color: "#991B1B",
                        borderRadius: 10,
                      }}
                    >
                      {errorMsg}
                    </div>
                  )}

                  <div className="col gap-24">
                    {/* Section 1: Contact Details */}
                    <div>
                      <h4 className="text-base fw-800 text-1 mb-16">1. Personal Information</h4>
                      <div className="grid-2 gap-20">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            First Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Alex"
                            className="input"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                          />
                        </div>
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Last Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mercer"
                            className="input"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid-2 gap-20 mt-16">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Email Address <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="alex@example.com"
                            className="input"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                          />
                        </div>
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            className="input"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="divider m-0" />

                    {/* Section 2: Location, Salary & Work Info */}
                    <div>
                      <h4 className="text-base fw-800 text-1 mb-16">2. Location & Expectations</h4>
                      <div className="grid-2 gap-20">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Current Location / City <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Kigali, Rwanda / New York, NY"
                            className="input"
                            value={form.currentLocation}
                            onChange={(e) => setForm({ ...form, currentLocation: e.target.value })}
                          />
                        </div>
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Notice Period / Availability
                          </label>
                          <select
                            className="input"
                            value={form.noticePeriod}
                            onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                          >
                            <option value="Immediate">Immediate Availability</option>
                            <option value="1 Week">1 Week</option>
                            <option value="2 Weeks">2 Weeks</option>
                            <option value="1 Month">1 Month</option>
                            <option value="2 Months">2 Months</option>
                            <option value="Negotiable">Negotiable</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-2 gap-20 mt-16">
                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            Expected Salary (Gross / Month)
                          </label>
                          <div className="row gap-8 align-center">
                            <select
                              style={{ width: 90 }}
                              className="input"
                              value={form.currency}
                              onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="RWF">RWF</option>
                              <option value="UGX">UGX</option>
                              <option value="KES">KES</option>
                            </select>
                            <input
                              type="number"
                              placeholder="e.g. 4500"
                              className="input"
                              style={{ flex: 1 }}
                              value={form.expectedSalaryGross}
                              onChange={(e) => setForm({ ...form, expectedSalaryGross: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="col gap-8">
                          <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                            LinkedIn Profile URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://linkedin.com/in/alex"
                            className="input"
                            value={form.linkedinUrl}
                            onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="divider m-0" />

                    {/* Section 3: CV / Resume Upload */}
                    <div>
                      <h4 className="text-base fw-800 text-1 mb-8">
                        3. Resume / Curriculum Vitae (CV) <span className="text-danger">*</span>
                      </h4>
                      <p className="text-xs text-5 mb-14">
                        Upload your CV in PDF, DOCX, or RTF format (max 10MB).
                      </p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx,.rtf"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />

                      {form.resumeUrl ? (
                        <div
                          className="p-16 row-between align-center"
                          style={{
                            background: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            borderRadius: 12,
                          }}
                        >
                          <div className="row gap-12 align-center">
                            <FileCheck size={28} className="text-success" />
                            <div>
                              <div className="text-sm fw-700 text-1">{form.resumeFilename}</div>
                              <div className="text-xs text-success fw-600">Resume uploaded and attached</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveResume}
                            className="btn-neutral btn-sm row gap-4 align-center"
                            style={{ color: "#DC2626" }}
                          >
                            <X size={14} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: "2px dashed var(--border)",
                            borderRadius: 14,
                            padding: "32px 24px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: "#FAFBFD",
                            transition: "0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = brandColor;
                            e.currentTarget.style.background = "#F5F6FF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "#FAFBFD";
                          }}
                        >
                          {isUploadingResume ? (
                            <div className="col-center gap-8">
                              <Loader2 className="animate-spin text-primary" size={28} />
                              <span className="text-sm fw-600 text-primary">Uploading your document...</span>
                            </div>
                          ) : (
                            <div className="col-center gap-8">
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: "50%",
                                  background: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                  color: brandColor,
                                }}
                              >
                                <Upload size={20} />
                              </div>
                              <div className="text-sm fw-700 text-1">
                                Click to upload your CV / Resume
                              </div>
                              <div className="text-xs text-4">
                                PDF, DOC, DOCX up to 10MB
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="divider m-0" />

                    {/* Section 4: Cover Letter */}
                    <div>
                      <h4 className="text-base fw-800 text-1 mb-8">4. Cover Letter</h4>
                      <p className="text-xs text-5 mb-14">
                        Introduce yourself and explain why you are a great fit for {company.name}.
                      </p>
                      <textarea
                        rows={5}
                        placeholder="Dear Hiring Team,&#10;&#10;I am excited to apply for this role because..."
                        className="input"
                        style={{ height: "auto", padding: "14px 16px", lineHeight: 1.6 }}
                        value={form.coverLetter}
                        onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                      />
                    </div>

                    {/* Section 5: Online Profile / Portfolio */}
                    <div className="col gap-8">
                      <label className="text-xs fw-700 text-1 uppercase tracking-wider">
                        Personal Portfolio / GitHub Website
                      </label>
                      <input
                        type="url"
                        placeholder="https://myportfolio.dev"
                        className="input"
                        value={form.portfolioUrl}
                        onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                      />
                    </div>

                    <div className="row-between align-center mt-12" style={{ paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                      <button
                        type="button"
                        className="btn-neutral"
                        onClick={() => setStep(1)}
                        style={{ padding: "10px 24px" }}
                      >
                        Back to Role Description
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || isUploadingResume}
                        className="btn-primary"
                        style={{ padding: "12px 34px", fontSize: 15, background: brandColor }}
                      >
                        {isSubmitting ? (
                          <span className="row gap-8 align-center">
                            <Loader2 className="animate-spin" size={16} /> Submitting Application...
                          </span>
                        ) : (
                          `Submit Application to ${company.name} &rarr;`
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
