"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, MapPin, Clock, ArrowRight, Building, Globe, ExternalLink } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/Skeleton";

interface CompanyPublic {
  id: string;
  name: string;
  logoUrl: string;
  brandColor: string;
  industry: string;
  websiteUrl: string;
}

interface PublicJob {
  id: string;
  title: string;
  departmentName?: string;
  location: string;
  employmentType: string;
  description: string;
  createdAt: string;
}

export default function CareersPage() {
  const searchParams = useSearchParams();
  const orgParam = searchParams.get("orgId") || searchParams.get("organizationId");
  const { getToken } = useAuth();

  const [company, setCompany] = useState<CompanyPublic>({
    id: "",
    name: "ProjectEasyHR",
    logoUrl: "",
    brandColor: "#4F46E5",
    industry: "Innovation & Technology",
    websiteUrl: "",
  });
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");

  useEffect(() => {
    async function loadCareers() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 1. Fetch public company profile (logo, branding, industry)
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

        // 2. Fetch public job listings for this organization
        const jobsUrl = currentOrgId
          ? `http://localhost:8080/api/v1/public/jobs?organizationId=${currentOrgId}`
          : "http://localhost:8080/api/v1/public/jobs";
        const jobsRes = await fetch(jobsUrl, { headers });
        if (jobsRes.ok) {
          const list = await jobsRes.json();
          const published = (list || []).filter((j: any) => j.status === "published" || !j.status);
          setJobs(published);
        }
      } catch (err) {
        console.error("Failed to load careers page", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCareers();
  }, [orgParam, getToken]);

  const departments = [
    "All",
    ...Array.from(new Set(jobs.map((j) => j.departmentName || "General").filter(Boolean))),
  ];

  const filteredJobs = jobs.filter(
    (j) => selectedDept === "All" || (j.departmentName || "General") === selectedDept
  );

  const brandColor = company.brandColor || "#4F46E5";

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      {/* Dynamic Navigation Bar with Real Company Logo */}
      <header
        style={{
          background: "#111827",
          color: "white",
          padding: "18px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="row gap-16 align-center">
          {company.logoUrl ? (
            <div
              style={{
                background: "white",
                padding: "4px 10px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <img
                src={company.logoUrl}
                alt={company.name}
                style={{
                  height: 32,
                  maxWidth: 140,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                background: brandColor,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: 18,
                boxShadow: `0 4px 12px ${brandColor}40`,
              }}
            >
              {company.name ? company.name.charAt(0).toUpperCase() : "E"}
            </div>
          )}

          <div>
            <div className="fw-800 text-lg text-white" style={{ lineHeight: 1.2 }}>
              {company.name}
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Careers & Opportunities
            </div>
          </div>
        </div>

        <div className="row gap-20 align-center text-sm fw-600">
          {company.websiteUrl && (
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="row gap-6 align-center"
              style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
            >
              <Globe size={15} /> Company Website
            </a>
          )}
          <Link
            href="/dashboard"
            style={{
              color: "white",
              textDecoration: "none",
              background: "rgba(255,255,255,0.12)",
              padding: "6px 14px",
              borderRadius: 8,
            }}
          >
            Employee Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Dynamic Hero Section */}
      <section
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, #1E1B4B 100%)`,
          padding: "90px 48px",
          textAlign: "center",
          color: "white",
          boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {company.logoUrl && (
            <div
              style={{
                display: "inline-flex",
                background: "white",
                padding: "8px 18px",
                borderRadius: 16,
                marginBottom: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <img
                src={company.logoUrl}
                alt={company.name}
                style={{ height: 42, maxWidth: 180, objectFit: "contain" }}
              />
            </div>
          )}
          <h1
            style={{
              fontSize: 50,
              fontWeight: 800,
              margin: "0 0 16px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Do the best work of your career at {company.name}.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Join our mission in the {company.industry || "modern workplace"} space. Explore open
            positions and find your next breakthrough role.
          </p>
        </div>
      </section>

      {/* Job Listings Board */}
      <main style={{ maxWidth: 1040, margin: "-40px auto 80px auto", width: "100%", padding: "0 24px" }}>
        <div
          style={{
            background: "white",
            padding: "44px 48px",
            borderRadius: 20,
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Controls Bar */}
          <div className="row-between align-center mb-36" style={{ flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="text-2xl fw-800 text-1 m-0">Open Positions</h2>
              <span className="text-sm text-4 fw-500">
                {isLoading ? "Searching available roles..." : `${filteredJobs.length} active opportunities`}
              </span>
            </div>

            {departments.length > 1 && (
              <div className="row gap-12 align-center text-sm fw-600 text-4">
                <span>Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{
                    padding: "8px 16px",
                    background: "#F9FAFB",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-1)",
                    fontWeight: 600,
                    outline: "none",
                  }}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Shimmer Loader */}
          {isLoading ? (
            <div className="col gap-16">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <Skeleton width="40%" height={24} />
                  <div className="row gap-12">
                    <Skeleton width={100} height={16} />
                    <Skeleton width={80} height={16} />
                    <Skeleton width={90} height={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px" }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  color: "var(--text-4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <Briefcase size={30} />
              </div>
              <h3 className="text-xl fw-700 text-1 m-0 mb-8">No open positions at this time</h3>
              <p className="text-sm text-4 m-0" style={{ maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
                {company.name} doesn't currently have active postings matching this filter. Check back
                regularly for new career opportunities!
              </p>
            </div>
          ) : (
            <div className="col gap-18">
              {filteredJobs.map((role) => (
                <Link
                  key={role.id}
                  href={`/careers/preview?jobId=${role.id}${company.id ? `&orgId=${company.id}` : ""}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: "24px 28px",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      background: "white",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = brandColor;
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div className="row-between align-center">
                      <div>
                        <h3 className="text-xl fw-800 text-1 m-0 mb-8">{role.title}</h3>
                        <div className="row gap-16 text-sm text-5 fw-500">
                          <span className="row gap-6 align-center">
                            <Building size={15} /> {role.departmentName || "General"}
                          </span>
                          <span>&bull;</span>
                          <span className="row gap-6 align-center">
                            <MapPin size={15} /> {role.location}
                          </span>
                          <span>&bull;</span>
                          <span className="row gap-6 align-center">
                            <Clock size={15} /> {role.employmentType}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: brandColor,
                        }}
                      >
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Branded Footer */}
      <footer
        style={{
          marginTop: "auto",
          background: "#111827",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "36px 48px",
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }} className="row-between align-center">
          <div className="row gap-12 align-center">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                style={{ height: 24, maxWidth: 100, objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.8 }}
              />
            ) : (
              <span className="fw-700 text-white">{company.name}</span>
            )}
            <span>&bull; Powered by ProjectEasyHR</span>
          </div>
          <div>All applications are processed securely in accordance with local labor laws.</div>
        </div>
      </footer>
    </div>
  );
}
