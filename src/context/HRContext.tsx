"use client";

import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "./CompanyContext";
import { toast } from "@/components/ui/Toast";

export type Candidate = {
  id: string;
  jobId: string;
  name: string;
  role: string;
  stage: string; // 'Applied' | 'Screening' | 'Interviewing' | 'Offer' | 'Hired'
  source: string;
  date: string;
  rating: number | null;
  avatar?: string;
  email: string;
  phone?: string;
  currentLocation?: string;
  expectedSalaryGross?: number;
  currency?: string;
  noticePeriod?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumeFilename?: string;
};

export type OnboardingTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type OnboardingRecord = {
  id: string;
  candidateId: string;
  employeeId?: string;
  name: string;
  email?: string;
  role: string;
  department: string;
  startDate: string;
  progress: number;
  status: "On Track" | "At Risk" | "Completed" | "Not Started";
  tasks: OnboardingTask[];
};

interface HRContextType {
  candidates: Candidate[];
  isLoading: boolean;
  updateCandidateStage: (id: string, stage: string) => Promise<void>;
  addCandidate: (candidate: Omit<Candidate, "id">) => Promise<void>;
  onboardings: OnboardingRecord[];
  initiateOnboarding: (candidate: Candidate, startDate: string, department: string, employeeId?: string) => Promise<void>;
  toggleOnboardingTask: (recordId: string, taskId: string) => void;
  completeOnboarding: (recordId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

const STAGE_TO_BACKEND: Record<string, string> = {
  "Applied": "new",
  "Screening": "screening",
  "Interviewing": "interviewing",
  "Offer": "offered",
  "Hired": "hired",
};

const BACKEND_TO_STAGE: Record<string, string> = {
  "new": "Applied",
  "screening": "Screening",
  "interviewing": "Interviewing",
  "offered": "Offer",
  "hired": "Hired",
  "rejected": "Rejected",
};

export function HRProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const { company } = useCompany();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("easyhr_onboardings");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setOnboardings(parsed);
      }
    } catch {}
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!isSignedIn || !company) {
      setIsLoading(false);
      return;
    }
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (
        path.startsWith("/company/register") ||
        path.startsWith("/auth") ||
        path.startsWith("/careers") ||
        path === "/workspace-not-found" ||
        path === "/"
      ) {
        setIsLoading(false);
        return;
      }
    }
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/hiring/applicants`, {
        headers: getAuthHeaders(token),
      });

      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || [];
        const mapped: Candidate[] = rawList.map((a: any) => ({
          id: a.id,
          jobId: a.jobId,
          name: `${a.firstName} ${a.lastName}`.trim(),
          role: a.jobTitle || "Applicant",
          stage: BACKEND_TO_STAGE[a.status] || "Applied",
          source: "Career Portal",
          date: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recent",
          rating: 4,
          email: a.email,
          phone: a.phone || "",
          currentLocation: a.currentLocation || "",
          expectedSalaryGross: a.expectedSalaryGross || undefined,
          currency: a.currency || "USD",
          noticePeriod: a.noticePeriod || "",
          linkedinUrl: a.linkedinUrl || "",
          portfolioUrl: a.portfolioUrl || "",
          coverLetter: a.coverLetter || "",
          resumeUrl: a.resumeUrl || "",
          resumeFilename: a.resumeFilename || "",
        }));
        setCandidates(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch applicants", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn, company?.id]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const updateCandidateStage = async (id: string, stage: string) => {
    const current = candidates.find((c) => c.id === id);
    if (current && current.stage.toLowerCase() === "hired" && stage.toLowerCase() !== "hired") {
      toast.warning("Action not allowed", "Candidate is already hired and cannot be moved back in the pipeline.");
      return;
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage } : c))
    );

    try {
      const token = await getToken();
      if (!token) return;

      const backendStatus = STAGE_TO_BACKEND[stage] || stage.toLowerCase();
      const res = await fetch(`${API_BASE_URL}/api/v1/hiring/applicants/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status: backendStatus }),
      });

      if (res.ok) {
        if (stage.toLowerCase() === "hired") {
          toast.success("Candidate Hired!", "Employee profile created in directory and self-onboarding invitation email sent to candidate.");
        } else {
          toast.success("Candidate stage updated", `Moved to ${stage}.`);
        }
      } else {
        toast.error("Failed to update candidate", "Server rejected stage transition.");
        fetchCandidates();
      }
    } catch (err) {
      console.error("Failed to update candidate status", err);
      toast.error("Network error", "Unable to update candidate stage.");
      fetchCandidates();
    }
  };

  const addCandidate = async (candidate: Omit<Candidate, "id">) => {
    try {
      const token = await getToken();
      if (!token) return;

      const parts = candidate.name.split(" ");
      const firstName = parts[0] || "New";
      const lastName = parts.slice(1).join(" ") || "Candidate";

      await fetch(`${API_BASE_URL}/api/v1/public/jobs/${candidate.jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: candidate.email,
          phone: candidate.phone,
        }),
      });

      fetchCandidates();
    } catch (err) {
      console.error("Failed to add candidate", err);
    }
  };

  const initiateOnboarding = async (candidate: Candidate, startDate: string, department: string, employeeId?: string) => {
    const newRecord: OnboardingRecord = {
      id: `onb-${Date.now()}`,
      candidateId: candidate.id,
      employeeId,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      department,
      startDate,
      progress: 0,
      status: "On Track",
      tasks: [
        { id: `t1-${Date.now()}`, title: "Sign Offer Letter & Employment Agreement", completed: false },
        { id: `t2-${Date.now()}`, title: "Complete Personal Profile & Emergency Contacts", completed: false },
        { id: `t3-${Date.now()}`, title: "Submit Tax & Direct Deposit Documents", completed: false },
        { id: `t4-${Date.now()}`, title: "IT Equipment & Account Provisioning", completed: false },
      ],
    };

    setOnboardings((prev) => {
      const updated = [newRecord, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("easyhr_onboardings", JSON.stringify(updated));
      }
      return updated;
    });

    toast.success("Onboarding started", `Onboarding workflow started for ${candidate.name}.`);
  };

  const toggleOnboardingTask = (recordId: string, taskId: string) => {
    setOnboardings((prev) => {
      const updated = prev.map((record) => {
        if (record.id !== recordId) return record;
        const newTasks = record.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const completedCount = newTasks.filter((t) => t.completed).length;
        const progress = Math.round((completedCount / newTasks.length) * 100);
        const status: "Completed" | "On Track" = progress === 100 ? "Completed" : "On Track";
        return { ...record, tasks: newTasks, progress, status };
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("easyhr_onboardings", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const completeOnboarding = async (recordId: string) => {
    const record = onboardings.find((r) => r.id === recordId);
    if (!record) return;

    // Mark completed locally
    setOnboardings((prev) => {
      const updated = prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              progress: 100,
              status: "Completed" as const,
              tasks: r.tasks.map((t) => ({ ...t, completed: true })),
            }
          : r
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("easyhr_onboardings", JSON.stringify(updated));
      }
      return updated;
    });

    toast.success("Onboarding completed", `Onboarding finished for ${record.name}.`);

    // If employeeId is attached, activate in backend
    if (record.employeeId) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/employees/${record.employeeId}/activate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (err) {
        console.error("Failed to activate employee", err);
      }
    }
  };

  return (
    <HRContext.Provider
      value={{
        candidates,
        isLoading,
        updateCandidateStage,
        addCandidate,
        onboardings,
        initiateOnboarding,
        toggleOnboardingTask,
        completeOnboarding,
        refresh: fetchCandidates,
      }}
    >
      {children}
    </HRContext.Provider>
  );
}

export function useHR() {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error("useHR must be used within an HRProvider");
  }
  return context;
}
