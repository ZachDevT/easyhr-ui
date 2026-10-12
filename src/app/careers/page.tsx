"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

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
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");

  useEffect(() => {
    async function loadJobs() {
      try {
        const token = await getToken();
        // If logged in, fetch org jobs; otherwise fetch public
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("http://localhost:8080/api/v1/jobs", { headers });
        if (res.ok) {
          const list = await res.json();
          // Filter to published only
          const published = (list || []).filter((j: any) => j.status === "published");
          setJobs(published);
        }
      } catch (err) {
        console.error("Failed to load career jobs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, [getToken]);

  const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.departmentName || "General").filter(Boolean)))];

  const filteredJobs = jobs.filter(
    (j) => selectedDept === "All" || (j.departmentName || "General") === selectedDept
  );

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ background: "#111827", color: "white", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="row gap-12 align-center">
          <div style={{ width: 40, height: 40, background: "var(--primary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 20 }}>
            E
          </div>
          <span className="fw-800 text-xl text-white">EasyHR Careers</span>
        </div>
        <div className="row gap-24 fw-600 text-sm">
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Portal</Link>
          <Link href="/hiring" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>ATS</Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "var(--gradient)", padding: "100px 48px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, margin: "0 0 20px 0", fontFamily: "var(--font-heading)" }}>
          Do the best work of your life.
        </h1>
        <p style={{ fontSize: 20, maxWidth: 720, margin: "0 auto", color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
          Join our mission to revolutionize how modern companies empower and support their teams.
        </p>
      </div>

      {/* Job Listings */}
      <div style={{ maxWidth: 1000, margin: "-50px auto 100px auto", position: "relative" }}>
        <div style={{ background: "white", padding: 48, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
          <div className="row-between align-center mb-40">
            <div>
              <h2 className="text-3xl fw-800 text-1 m-0">Open Roles</h2>
              <span className="text-sm text-4 fw-500">{filteredJobs.length} open opportunities</span>
            </div>
            {departments.length > 1 && (
              <div className="row gap-16 align-center text-sm fw-600 text-4">
                <span>Filter:</span>
                <select
                  className="select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ padding: "8px 16px", background: "#F9FAFB" }}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F3F4F6", color: "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl fw-700 text-1 m-0 mb-8">No open positions right now</h3>
              <p className="text-base text-4 m-0" style={{ maxWidth: 400, margin: "0 auto" }}>
                We don't have any published roles matching your criteria at this moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="col gap-24">
              {filteredJobs.map((role) => (
                <Link key={role.id} href={`/careers/preview?jobId=${role.id}`} style={{ textDecoration: "none" }}>
                  <div className="hover-scale" style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 32, transition: "all 0.2s", cursor: "pointer" }}>
                    <div className="row-between align-center">
                      <div>
                        <h3 className="text-2xl fw-800 text-1 m-0 mb-12">{role.title}</h3>
                        <div className="row gap-16 text-base text-5 fw-500">
                          <span className="row gap-8 align-center"><Briefcase size={18} /> {role.departmentName || "General"}</span>
                          <span>•</span>
                          <span className="row gap-8 align-center"><MapPin size={18} /> {role.location}</span>
                          <span>•</span>
                          <span className="row gap-8 align-center"><Clock size={18} /> {role.employmentType}</span>
                        </div>
                      </div>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-body)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                        <ArrowRight size={24} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
