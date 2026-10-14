"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { Loader2, UserPlus, Mail, Briefcase, Building, MapPin, UserCheck, Calendar, ShieldCheck, Check, Plus } from "lucide-react";

interface AddHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  managers: { id: string; firstName: string; lastName: string; jobTitle?: string }[];
}

export function AddHireModal({
  isOpen,
  onClose,
  onSuccess,
  departments,
  locations,
  managers,
}: AddHireModalProps) {
  const { getToken } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [positionId, setPositionId] = useState("");
  const [departmentPositions, setDepartmentPositions] = useState<{id:string;title:string;level:string;status:string}[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [showCreatePosition, setShowCreatePosition] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [creatingPosition, setCreatingPosition] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [hiredOn, setHiredOn] = useState(new Date().toISOString().split("T")[0]);
  const [employmentType, setEmploymentType] = useState("full_time");
  const [sendInvitation, setSendInvitation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPositionId("");
    setJobTitle("");
    setDepartmentPositions([]);
    if (!departmentId) return;
    let cancelled = false;
    (async () => {
      setPositionsLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/v1/departments/${departmentId}/positions`, { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json();
        if (response.ok && !cancelled) setDepartmentPositions((payload.data || payload || []).filter((p: {status:string}) => p.status === "active"));
      } catch { if (!cancelled) setDepartmentPositions([]); }
      finally { if (!cancelled) setPositionsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [departmentId, getToken]);

  const createDepartmentPosition = async () => {
    if (!departmentId || !newPositionTitle.trim()) return;
    setCreatingPosition(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/departments/${departmentId}/positions`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPositionTitle.trim(), level: "Mid", payType: "Salaried" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Could not create this position.");
      setDepartmentPositions((previous) => [...previous, result]);
      setPositionId(result.id);
      setJobTitle(result.title);
      setNewPositionTitle("");
      setShowCreatePosition(false);
      toast.success("Position created", "The new position is available for this hire.");
    } catch (error) { toast.error("Could not create position", error instanceof Error ? error.message : "Try again."); }
    finally { setCreatingPosition(false); }
  };

  const managerOptions: SelectOption[] = useMemo(() => [
    { value: "", label: "No manager assigned", description: "Direct reporting or founder" },
    ...managers.map((m) => ({
      value: m.id,
      label: `${m.firstName} ${m.lastName}`.trim(),
      description: m.jobTitle || "Team Member",
      avatar: true,
    })),
  ], [managers]);

  const departmentOptions: SelectOption[] = useMemo(() => [
    { value: "", label: "No department assigned", description: "General organization" },
    ...departments.map((d) => ({
      value: d.id,
      label: d.name,
      description: "Department team",
    })),
  ], [departments]);

  const locationOptions: SelectOption[] = useMemo(() => [
    { value: "", label: "Default Headquarters", description: "Primary office" },
    ...locations.map((l) => ({
      value: l.id,
      label: l.name,
      description: "Work location",
    })),
  ], [locations]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setWorkEmail("");
    setPersonalEmail("");
    setPersonalPhone("");
    setJobTitle("");
    setPositionId("");
    setDepartmentId("");
    setLocationId("");
    setManagerId("");
    setHiredOn(new Date().toISOString().split("T")[0]);
    setEmploymentType("full_time");
    setSendInvitation(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Validation error", "First name and last name are required.");
      return;
    }
    if (!workEmail.trim()) {
      toast.error("Validation error", "Work email address is required.");
      return;
    }
    if (!positionId) {
      toast.error("Select a position", "Choose a role from the selected department.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        personalEmail: personalEmail.trim().toLowerCase() || undefined,
        personalPhone: personalPhone.trim() || undefined,
        jobTitle: jobTitle.trim(),
        positionId,
        departmentId: departmentId || undefined,
        locationId: locationId || undefined,
        managerId: managerId || undefined,
        hiredOn: hiredOn || new Date().toISOString().split("T")[0],
        employmentType: employmentType || "full_time",
        sendInvitation: sendInvitation,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.title || "Failed to create employee record");
      }

      toast.success(
        "New Hire Enrolled",
        sendInvitation
          ? `Record created for ${firstName} ${lastName}. An onboarding link has been sent to ${personalEmail || workEmail}.`
          : `Record created for ${firstName} ${lastName} in onboarding status.`
      );

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create employee:", err);
      toast.error("Could not add hire", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Hire"
      subtitle="Manually enroll an employee without ATS job postings. A setup link can be sent immediately."
      width={640}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Name Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              First Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="E.g. Sarah"
              required
              style={{ fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Last Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="E.g. Jenkins"
              required
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {/* Email Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Work Email <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="email"
              className="input"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              placeholder="sarah@company.com"
              required
              style={{ fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Personal Email (Invite Destination)
            </label>
            <input
              type="email"
              className="input"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="sarah.personal@gmail.com"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {/* Contact Phone & Role */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Personal Phone
            </label>
            <input
              type="tel"
              className="input"
              value={personalPhone}
              onChange={(e) => setPersonalPhone(e.target.value)}
              placeholder="+250 78... or +254..."
              style={{ fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Position <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select className="input" value={positionId} disabled={!departmentId || positionsLoading} onChange={(e) => { setPositionId(e.target.value); setJobTitle(departmentPositions.find((p) => p.id === e.target.value)?.title || ""); }}>
              <option value="">{!departmentId ? "Select a department first" : positionsLoading ? "Loading department positions…" : "Choose a department position"}</option>
              {departmentPositions.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.level}</option>)}
            </select>
          </div>
        </div>

        {departmentId && !positionsLoading && departmentPositions.length === 0 && <div style={{padding:14,borderRadius:10,background:"#faf5ff",border:"1px solid #e9d5ff"}}>
          <strong style={{fontSize:13}}>No roles set up for this department yet.</strong>
          {!showCreatePosition ? <button type="button" className="btn-neutral btn-sm" style={{marginLeft:10}} onClick={() => setShowCreatePosition(true)}><Plus size={14}/> Create a role</button> : <div style={{display:"flex",gap:8,marginTop:10}}><input className="input" value={newPositionTitle} onChange={(e)=>setNewPositionTitle(e.target.value)} placeholder="New role title"/><button type="button" className="btn-primary btn-sm" onClick={createDepartmentPosition} disabled={creatingPosition||!newPositionTitle.trim()}>{creatingPosition?"Saving…":"Save role"}</button></div>}
        </div>}

        {/* Department & Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Department
            </label>
            <SearchableSelect
              options={departmentOptions}
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department..."
              searchPlaceholder="Search departments..."
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Work Location
            </label>
            <SearchableSelect
              options={locationOptions}
              value={locationId}
              onChange={setLocationId}
              placeholder="Select location..."
              searchPlaceholder="Search locations..."
            />
          </div>
        </div>

        {/* Reports To (Manager) & Start Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Reports To (Manager)
            </label>
            <SearchableSelect
              options={managerOptions}
              value={managerId}
              onChange={setManagerId}
              placeholder="Select manager..."
              searchPlaceholder="Search employees by name or role..."
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={hiredOn}
              onChange={(e) => setHiredOn(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {/* Employment Type */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>
            Employment Type
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "full_time", label: "Full-Time" },
              { id: "part_time", label: "Part-Time" },
              { id: "contractor", label: "Contractor" },
              { id: "intern", label: "Intern" },
            ].map((type) => {
              const isSel = employmentType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setEmploymentType(type.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: isSel ? 700 : 500,
                    border: isSel ? "1.5px solid #7C3AED" : "1px solid #E4E4E7",
                    background: isSel ? "#F5F3FF" : "#FFFFFF",
                    color: isSel ? "#7C3AED" : "#3F3F46",
                    cursor: "pointer",
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Send Invitation Toggle */}
        <div
          onClick={() => setSendInvitation(!sendInvitation)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: sendInvitation ? "#F5F3FF" : "#FAFAFA",
            border: sendInvitation ? "1px solid #DDD6FE" : "1px solid #E4E4E7",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: sendInvitation ? "1.5px solid #7C3AED" : "1.5px solid #A1A1AA",
              background: sendInvitation ? "#7C3AED" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            {sendInvitation && <Check size={13} strokeWidth={3} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 650, color: "#18181B" }}>
              Send onboarding invite link immediately
            </span>
            <span style={{ fontSize: 11, color: "#71717A" }}>
              Candidate will receive a branded email with a secure link to complete their profile, digital handbook, and disbursement.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F4F4F5" }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Enrolling...
              </>
            ) : (
              <>
                <UserPlus size={15} /> Enroll New Hire
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
