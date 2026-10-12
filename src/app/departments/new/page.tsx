"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export default function NewDepartmentPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#1A73E8");
  const [parentDepartmentId, setParentDepartmentId] = useState("");
  const [headEmployeeId, setHeadEmployeeId] = useState("");

  const [existingDepartments, setExistingDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const token = await getToken();
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        // Load existing departments
        const deptRes = await fetch("http://localhost:8080/api/v1/departments", { headers });
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setExistingDepartments(deptData.data || []);
        }

        // Load employees
        const empRes = await fetch("http://localhost:8080/api/v1/employees", { headers });
        if (empRes.ok) {
          const empData = await empRes.json();
          const list = (empData.data || []).map((e: any) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
          }));
          setEmployees(list);
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    loadOptions();
  }, [getToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Department Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg("Authentication session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase() || name.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 10),
        description: description.trim(),
        color,
        parentDepartmentId: parentDepartmentId || "",
        divisionId: "",
        headEmployeeId: headEmployeeId || null,
      };

      const res = await fetch("http://localhost:8080/api/v1/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.message || "Failed to create department");
      }

      router.push("/departments");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while creating the department");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      {/* HEADER - Fixed at top */}
      <div className="px-40 py-24 border-b border-border row-between align-center bg-white" style={{ flexShrink: 0, zIndex: 10 }}>
        <div className="row gap-16 align-center">
          <Link href="/departments" className="btn-neutral" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "white" }}>
            <ArrowLeft size={18} className="text-2" />
          </Link>
          <div className="col gap-4">
            <h1 className="m-0 text-xl fw-800 text-1">Create Department</h1>
            <p className="m-0 text-sm text-4 fw-500">Define a new branch in your organizational structure.</p>
          </div>
        </div>

        <div className="row gap-12 align-center">
          <Link href="/departments" className="btn-neutral fw-600 text-3 hover-text-1" style={{ padding: "8px 16px", borderRadius: 8, background: "white" }}>
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn-primary row gap-8 align-center"
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              background: "var(--gradient)",
              border: "none",
              color: "white",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(162, 56, 255, 0.2)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Department</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", background: "white", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
          {errorMsg && (
            <div style={{ margin: "24px 32px 0", padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* General Info */}
          <div className="p-32 col gap-24 border-b border-border">
            <h2 className="m-0 text-lg fw-700 text-1">General Information</h2>

            <div className="grid-2 gap-20">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Name <span className="text-error">*</span></label>
                <Input
                  type="text"
                  placeholder="e.g. Engineering"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) {
                      setCode(e.target.value.toUpperCase().replace(/\s+/g, "_").slice(0, 10));
                    }
                  }}
                />
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Code <span className="text-error">*</span></label>
                <Input
                  type="text"
                  placeholder="e.g. ENG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Description</label>
              <Textarea
                placeholder="Briefly describe the purpose of this department..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: 100, resize: "vertical" }}
              />
            </div>

            <div className="col gap-12 mt-8">
              <label className="text-sm fw-600 text-2">Theme Color</label>
              <div className="row gap-12 align-center">
                {["#1A73E8", "#EA4335", "#F9AB00", "#34A853", "#9334E6", "#000000", "#64748B"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c,
                      border: color === c ? "3px solid white" : "none",
                      outline: color === c ? `2px solid ${c}` : "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hierarchy & Leadership */}
          <div className="p-32 col gap-24">
            <h2 className="m-0 text-lg fw-700 text-1">Hierarchy & Leadership</h2>

            <div className="grid-2 gap-20">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Parent Department</label>
                <Select
                  value={parentDepartmentId}
                  onChange={(e) => setParentDepartmentId(e.target.value)}
                >
                  <option value="">None (Top Level)</option>
                  {existingDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Head</label>
                <Select
                  value={headEmployeeId}
                  onChange={(e) => setHeadEmployeeId(e.target.value)}
                >
                  <option value="">Select an employee...</option>
                  {employees.length === 0 ? (
                    <option value="" disabled>No employees registered yet</option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))
                  )}
                </Select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
