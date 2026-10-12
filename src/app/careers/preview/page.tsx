"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { FileText, Briefcase, MapPin, Clock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

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
  const { getToken } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    portfolioUrl: "",
    notes: "",
  });

  useEffect(() => {
    async function loadJob() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("http://localhost:8080/api/v1/jobs", { headers });
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
        console.error("Failed to load job", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJob();
  }, [jobId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setErrorMsg("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setErrorMsg("First name, last name, and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/public/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
        }),
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

  if (submitted) {
    return (
      <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--success-tint)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <CheckCircle2 size={44} />
        </div>
        <h1 className="text-4xl fw-800 text-1 mb-16 text-center">Application Received!</h1>
        <p className="text-lg text-5 mb-32 text-center max-w-md">
          Thank you for applying to the <strong>{job?.title}</strong> role at EasyHR. Your application is now in our recruiting pipeline.
        </p>
        <div className="row gap-16">
          <Link href="/careers" className="btn-secondary" style={{ padding: "14px 28px", textDecoration: "none" }}>
            Browse More Roles
          </Link>
          <Link href="/hiring" className="btn-primary" style={{ padding: "14px 28px", textDecoration: "none" }}>
            View in ATS
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
        <Link href="/careers" className="btn-primary">Back to Careers</Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "var(--font-sans)", paddingBottom: 100 }}>
      {/* Public Header */}
      <div style={{ background: "#111827", padding: "20px 48px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/careers" style={{ textDecoration: "none" }}>
          <div className="row gap-12 align-center">
            <div style={{ width: 40, height: 40, background: "var(--primary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 20 }}>
              E
            </div>
            <span className="fw-800 text-xl text-white">EasyHR Careers</span>
          </div>
        </Link>
        <Link href="/careers" className="text-white row gap-6 align-center text-sm fw-600" style={{ textDecoration: "none", opacity: 0.8 }}>
          <ArrowLeft size={16} /> All Roles
        </Link>
      </div>

      <div style={{ maxWidth: 840, margin: "40px auto", padding: "0 20px" }}>
        <Card style={{ border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", overflow: "visible", borderRadius: 20 }}>
          <CardBody style={{ padding: 0 }}>
            {/* Job Header */}
            <div style={{ padding: "48px 48px 32px 48px", borderBottom: "1px solid var(--border)" }}>
              <div className="row gap-12 mb-20">
                <Badge variant="primary" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                  {job.departmentName || "Engineering"}
                </Badge>
                <Badge variant="neutral">{job.location || "Remote"}</Badge>
                <Badge variant="neutral">{job.employmentType || "Full-Time"}</Badge>
              </div>
              <h1 className="text-4xl fw-800 text-1 m-0 mb-16">{job.title}</h1>

              {step === 1 && (
                <button
                  className="btn-primary mt-12"
                  style={{ padding: "16px 40px", fontSize: 18, borderRadius: 10, cursor: "pointer" }}
                  onClick={() => setStep(2)}
                >
                  Apply for this Role
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: "48px" }}>
              {step === 1 ? (
                <div className="col gap-24 text-base text-2" style={{ lineHeight: 1.7 }}>
                  <h3 className="text-xl fw-800 text-1 m-0">About the Role</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{job.description}</p>

                  <h3 className="text-xl fw-800 text-1 m-0 mt-16">What We Offer</h3>
                  <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <li>Competitive salary & equity packages.</li>
                    <li>Flexible remote-first working culture.</li>
                    <li>Comprehensive healthcare and retirement contributions.</li>
                    <li>Generous paid time off and parental leave.</li>
                  </ul>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="col gap-32">
                  <div>
                    <h2 className="text-3xl fw-800 text-1 m-0 mb-8">Submit Your Application</h2>
                    <p className="text-base text-5 m-0">Please fill out your contact details to apply for {job.title}.</p>
                  </div>

                  {errorMsg && (
                    <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                      <AlertCircle size={18} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid-2 gap-24">
                    <div className="col gap-8">
                      <label className="text-sm fw-700 text-1">First Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Alex"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col gap-8">
                      <label className="text-sm fw-700 text-1">Last Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Mercer"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-2 gap-24">
                    <div className="col gap-8">
                      <label className="text-sm fw-700 text-1">Email Address *</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="e.g. alex.mercer@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col gap-8">
                      <label className="text-sm fw-700 text-1">Phone Number</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="e.g. +1 (555) 000-0000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col gap-8">
                    <label className="text-sm fw-700 text-1">Portfolio or LinkedIn URL</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://linkedin.com/in/..."
                      value={form.portfolioUrl}
                      onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                    />
                  </div>

                  <div className="row-between align-center pt-16" style={{ borderTop: "1px solid var(--border)" }}>
                    <button type="button" className="btn-neutral" onClick={() => setStep(1)} style={{ padding: "14px 28px" }}>
                      Back to Overview
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary row gap-8 align-center"
                      style={{ padding: "14px 36px", fontSize: 16 }}
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                      <span>Submit Application</span>
                    </button>
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
