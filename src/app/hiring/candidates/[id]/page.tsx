"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  Star,
  ArrowLeft,
  Plus,
  Send,
  X,
  Type,
  Paperclip,
  ImageIcon,
  Smile,
  Trash2,
  Clock,
  User,
  DollarSign,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { useHR, Candidate } from "@/context/HRContext";
import { RichTextRenderer } from "@/components/ui/RichTextEditor";
import { EmailComposer } from "@/components/shared/EmailComposer";
import { ThreadView } from "@/components/shared/ThreadView";

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const applicantId = params.id as string;
  const { getToken } = useAuth();
  const { candidates, updateCandidateStage } = useHR();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateProfileTab, setCandidateProfileTab] = useState("Overview");
  const [showComposeEmailModal, setShowComposeEmailModal] = useState(false);

  useEffect(() => {
    // 1. Check local HRContext candidates
    const match = candidates.find((c) => c.id === applicantId);
    if (match) {
      setCandidate(match);
      setIsLoading(false);
      return;
    }

    // 2. Fallback fetch from backend API
    async function fetchCandidate() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/hiring/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          const found = list.find((a: any) => a.id === applicantId);
          if (found) {
            setCandidate({
              id: found.id,
              jobId: found.jobId,
              name: `${found.firstName} ${found.lastName}`.trim(),
              role: found.jobTitle || "Applicant",
              stage: found.status ? found.status.charAt(0).toUpperCase() + found.status.slice(1) : "Applied",
              source: "Career Portal",
              date: found.createdAt ? new Date(found.createdAt).toLocaleDateString() : "Recent",
              rating: 4,
              email: found.email,
              phone: found.phone || "",
              currentLocation: found.currentLocation || "",
              expectedSalaryGross: found.expectedSalaryGross || undefined,
              currency: found.currency || "USD",
              noticePeriod: found.noticePeriod || "",
              linkedinUrl: found.linkedinUrl || "",
              portfolioUrl: found.portfolioUrl || "",
              coverLetter: found.coverLetter || "",
              resumeUrl: found.resumeUrl || "",
              resumeFilename: found.resumeFilename || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load candidate", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCandidate();
  }, [applicantId, candidates, getToken]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h3 className="text-xl fw-800 text-1 mb-8">Candidate Not Found</h3>
        <p className="text-sm text-4 mb-20">The requested applicant could not be located.</p>
        <button onClick={() => router.push("/hiring")} className="btn-primary">
          &larr; Back to Hiring Pipeline
        </button>
      </div>
    );
  }

  return (
    <div
      className="page-container"
      style={{
        background: "var(--bg-page)",
        padding: 0,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Real Email Composer Modal */}
      <Modal
        isOpen={showComposeEmailModal}
        onClose={() => setShowComposeEmailModal(false)}
        title="Send Email to Candidate"
        subtitle={`To: ${candidate.name} <${candidate.email}>`}
        width={850}
      >
        <div style={{ padding: "8px 0" }}>
          <EmailComposer
            applicantId={candidate.id}
            candidateEmail={candidate.email}
            candidateName={candidate.name}
            candidateRole={candidate.role}
            onSent={() => {
              setShowComposeEmailModal(false);
              setCandidateProfileTab("Email Threads");
            }}
            onCancel={() => setShowComposeEmailModal(false)}
          />
        </div>
      </Modal>

      {/* Header Profile Bar */}
      <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "24px 48px" }}>
        <button
          onClick={() => router.push("/hiring")}
          className="btn-neutral btn-sm row gap-8 mb-16 text-5 fw-600"
          style={{ padding: "6px 12px" }}
        >
          <ArrowLeft size={16} /> Back to Pipeline
        </button>

        <div className="row-between align-center">
          <div className="row gap-20 align-center">
            <Avatar name={candidate.name} size="xl" src={candidate.avatar} style={{ width: 68, height: 68 }} />
            <div>
              <div className="row gap-12 align-center mb-6">
                <h1 className="text-2xl fw-800 text-1 m-0">{candidate.name}</h1>
                <Badge variant="primary" style={{ padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>
                  {candidate.stage}
                </Badge>
              </div>
              <div className="row gap-16 text-sm text-5 fw-500">
                <span className="row gap-6 align-center">
                  <Briefcase size={15} /> {candidate.role}
                </span>
                <span>&bull;</span>
                <span className="row gap-6 align-center">
                  <MapPin size={15} /> {candidate.currentLocation || "Location Not Set"}
                </span>
                <span>&bull;</span>
                <span className="row gap-6 align-center">
                  <Calendar size={15} /> Applied {candidate.date}
                </span>
              </div>
            </div>
          </div>

          <div className="row gap-12 align-center">
            <button
              className="btn-secondary row gap-8 fw-600"
              onClick={() => setShowComposeEmailModal(true)}
              style={{ padding: "10px 18px", borderRadius: 8 }}
            >
              <Mail size={16} /> Send Email
            </button>
            <select
              value={candidate.stage}
              onChange={async (e) => {
                const nextStage = e.target.value;
                await updateCandidateStage(candidate.id, nextStage);
                setCandidate((prev: any) => prev ? { ...prev, stage: nextStage } : prev);
              }}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                color: "var(--text-1)",
              }}
            >
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              <option value="Hired">Hired &amp; Onboard</option>
              <option value="Rejected">Rejected</option>
            </select>
            {candidate.stage.toLowerCase() !== "hired" ? (
              <button
                className="btn-primary row gap-8 fw-600"
                onClick={async () => {
                  await updateCandidateStage(candidate.id, "Hired");
                  setCandidate((prev: any) => prev ? { ...prev, stage: "Hired" } : prev);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                  color: "white",
                  border: "none",
                }}
              >
                <CheckCircle2 size={16} /> Hire Candidate
              </button>
            ) : (
              <Link
                href="/people"
                className="btn-secondary row gap-8 fw-600"
                style={{ padding: "10px 18px", borderRadius: 8, color: "#16A34A", borderColor: "#86EFAC" }}
              >
                <CheckCircle2 size={16} /> View in Directory
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="row gap-32 mt-28" style={{ borderBottom: "1px solid var(--border)", margin: "24px -48px -24px -48px", padding: "0 48px" }}>
          {["Overview", "Email Threads", "Resume & Cover Letter", "Candidate Details"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCandidateProfileTab(tab)}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 4px",
                borderBottom: candidateProfileTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                color: candidateProfileTab === tab ? "var(--primary)" : "var(--text-4)",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Body */}
      <div style={{ padding: "36px 48px", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        {candidateProfileTab === "Overview" && (
          <div>
            {candidate.stage.toLowerCase() === "hired" && (
              <div
                style={{
                  marginBottom: 28,
                  padding: "18px 24px",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <CheckCircle2 size={26} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <b style={{ color: "#065F46", fontSize: 15, display: "block", marginBottom: 2 }}>
                      Candidate Hired &amp; Converted to Active Employee
                    </b>
                    <span style={{ color: "#047857", fontSize: 13, lineHeight: 1.5 }}>
                      An employee record with status <code>onboarding</code> has been created in your company directory. A personalized welcome email with direct workspace login and self-onboarding tasks was automatically sent to <strong>{candidate.email}</strong>.
                    </span>
                  </div>
                </div>
                <Link
                  href="/people"
                  className="btn-secondary btn-sm"
                  style={{
                    background: "#ffffff",
                    color: "#065F46",
                    borderColor: "#6EE7B7",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  Open People Directory &rarr;
                </Link>
              </div>
            )}
            <div className="grid-2 gap-32" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "flex-start" }}>
            {/* Left Column */}
            <div className="col gap-24">
              {/* Cover Letter Card */}
              <Card>
                <CardBody style={{ padding: 32 }}>
                  <div className="row-between align-center mb-16">
                    <h3 className="text-lg fw-800 text-1 m-0 row gap-10 align-center">
                      <FileText size={20} className="text-primary" /> Cover Letter
                    </h3>
                  </div>
                  {candidate.coverLetter ? (
                    <div
                      style={{
                        background: "#F9FAFB",
                        padding: 24,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <RichTextRenderer html={candidate.coverLetter} />
                    </div>
                  ) : (
                    <div className="text-sm text-4 p-16" style={{ background: "#F9FAFB", borderRadius: 8 }}>
                      No cover letter was submitted with this application.
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* CV Preview & Download Card */}
              <Card>
                <CardBody style={{ padding: 32 }}>
                  <div className="row-between align-center mb-16">
                    <h3 className="text-lg fw-800 text-1 m-0 row gap-10 align-center">
                      <FileText size={20} className="text-success" /> Curriculum Vitae (CV)
                    </h3>
                    {candidate.resumeUrl && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm row gap-6 fw-600"
                        style={{ textDecoration: "none" }}
                      >
                        <Download size={14} /> Download CV
                      </a>
                    )}
                  </div>

                  {candidate.resumeUrl ? (
                    <div
                      className="p-20 row-between align-center"
                      style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12 }}
                    >
                      <div className="row gap-14 align-center">
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#059669",
                          }}
                        >
                          <FileText size={24} />
                        </div>
                        <div>
                          <div className="text-sm fw-800 text-1">
                            {candidate.resumeFilename || "Resume Document"}
                          </div>
                          <div className="text-xs text-success fw-600">Attached Candidate Document</div>
                        </div>
                      </div>
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary btn-sm row gap-6 align-center"
                        style={{ textDecoration: "none" }}
                      >
                        <ExternalLink size={14} /> Open Document
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-4 p-16" style={{ background: "#F9FAFB", borderRadius: 8 }}>
                      No CV file uploaded.
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right Column: Key Details */}
            <div className="col gap-24">
              {/* Compensation & Availability */}
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <h3 className="text-base fw-800 text-1 m-0 mb-20">Salary & Availability</h3>
                  <div className="col gap-16">
                    <div className="row-between align-center p-12" style={{ background: "#F9FAFB", borderRadius: 8 }}>
                      <span className="text-xs fw-700 text-5 uppercase tracking-wider">Expected Salary (Gross/mo)</span>
                      <strong className="text-base text-1">
                        {candidate.expectedSalaryGross
                          ? `${candidate.currency || "USD"} ${candidate.expectedSalaryGross.toLocaleString()}`
                          : "Not disclosed"}
                      </strong>
                    </div>

                    <div className="row-between align-center p-12" style={{ background: "#F9FAFB", borderRadius: 8 }}>
                      <span className="text-xs fw-700 text-5 uppercase tracking-wider">Notice Period</span>
                      <Badge variant="neutral" style={{ fontWeight: 700 }}>
                        {candidate.noticePeriod || "Immediate"}
                      </Badge>
                    </div>

                    <div className="row-between align-center p-12" style={{ background: "#F9FAFB", borderRadius: 8 }}>
                      <span className="text-xs fw-700 text-5 uppercase tracking-wider">Current Location</span>
                      <strong className="text-sm text-1">{candidate.currentLocation || "Remote"}</strong>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <h3 className="text-base fw-800 text-1 m-0 mb-20">Candidate Contact</h3>
                  <div className="col gap-14">
                    <div className="row gap-12 align-center text-sm fw-600 text-2">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--primary-tint)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Mail size={16} />
                      </div>
                      <a href={`mailto:${candidate.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {candidate.email}
                      </a>
                    </div>

                    {candidate.phone && (
                      <div className="row gap-12 align-center text-sm fw-600 text-2">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--success-tint)",
                            color: "var(--success)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Phone size={16} />
                        </div>
                        <a href={`tel:${candidate.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {candidate.phone}
                        </a>
                      </div>
                    )}

                    {candidate.linkedinUrl && (
                      <div className="row gap-12 align-center text-sm fw-600 text-2">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#EFF6FF",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Globe size={16} />
                        </div>
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary"
                          style={{ textDecoration: "none" }}
                        >
                          LinkedIn Profile &rarr;
                        </a>
                      </div>
                    )}

                    {candidate.portfolioUrl && (
                      <div className="row gap-12 align-center text-sm fw-600 text-2">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#F5F3FF",
                            color: "#7C3AED",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Globe size={16} />
                        </div>
                        <a
                          href={candidate.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary"
                          style={{ textDecoration: "none" }}
                        >
                          Online Portfolio &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
          </div>
        )}

        {/* Email Threads Tab */}
        {candidateProfileTab === "Email Threads" && (
          <div style={{ width: "100%" }}>
            <ThreadView
              applicantId={candidate.id}
              candidateEmail={candidate.email}
              candidateName={candidate.name}
              candidateRole={candidate.role}
            />
          </div>
        )}

        {candidateProfileTab === "Resume & Cover Letter" && (
          <div className="col gap-28">
            <Card>
              <CardBody style={{ padding: 36 }}>
                <div className="row-between align-center mb-20">
                  <div>
                    <h3 className="text-xl fw-800 text-1 m-0 mb-4">Candidate Curriculum Vitae</h3>
                    <p className="text-sm text-5 m-0">Uploaded during application submission.</p>
                  </div>
                  {candidate.resumeUrl && (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary row gap-6 align-center"
                      style={{ textDecoration: "none", padding: "10px 20px" }}
                    >
                      <Download size={16} /> Download Full CV
                    </a>
                  )}
                </div>

                {candidate.resumeUrl ? (
                  <iframe
                    src={candidate.resumeUrl}
                    style={{ width: "100%", height: 600, border: "1px solid var(--border)", borderRadius: 12 }}
                    title="CV Document Preview"
                  />
                ) : (
                  <div style={{ padding: 60, textAlign: "center", background: "#F9FAFB", borderRadius: 12 }}>
                    <p className="text-4 m-0">No document attached.</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: 36 }}>
                <h3 className="text-xl fw-800 text-1 m-0 mb-16">Cover Letter</h3>
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: 28,
                    borderRadius: 12,
                    fontSize: 15,
                    lineHeight: 1.7,
                    border: "1px solid var(--border)",
                  }}
                >
                  {candidate.coverLetter ? (
                    <RichTextRenderer html={candidate.coverLetter} />
                  ) : (
                    <span className="text-4">No cover letter provided.</span>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {candidateProfileTab === "Candidate Details" && (
          <Card>
            <CardBody style={{ padding: 36 }}>
              <h3 className="text-xl fw-800 text-1 m-0 mb-24">Complete Candidate Information</h3>
              <div className="grid-2 gap-24">
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Full Name</div>
                  <div className="text-base fw-700 text-1">{candidate.name}</div>
                </div>
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Applied Role</div>
                  <div className="text-base fw-700 text-1">{candidate.role}</div>
                </div>
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Current Location</div>
                  <div className="text-base fw-700 text-1">{candidate.currentLocation || "Not provided"}</div>
                </div>
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Expected Gross Salary</div>
                  <div className="text-base fw-700 text-1">
                    {candidate.expectedSalaryGross
                      ? `${candidate.currency || "USD"} ${candidate.expectedSalaryGross.toLocaleString()} / month`
                      : "Not provided"}
                  </div>
                </div>
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Notice Period</div>
                  <div className="text-base fw-700 text-1">{candidate.noticePeriod || "Immediate"}</div>
                </div>
                <div className="p-16" style={{ background: "#F9FAFB", borderRadius: 10 }}>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-6">Source</div>
                  <div className="text-base fw-700 text-1">{candidate.source}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
