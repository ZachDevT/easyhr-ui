"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { Loader2, Save, User, Briefcase, Building, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    departmentId?: string;
    department?: string;
    locationId?: string;
    location?: string;
    managerId?: string;
    manager?: string;
    personalEmail?: string;
    personalPhone?: string;
    status: string;
  };
  departments: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  managers: { id: string; firstName: string; lastName: string; jobTitle?: string }[];
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  departments,
  locations,
  managers,
}: EditEmployeeModalProps) {
  const { getToken } = useAuth();

  const [firstName, setFirstName] = useState(employee.firstName || "");
  const [lastName, setLastName] = useState(employee.lastName || "");
  const [jobTitle, setJobTitle] = useState(employee.jobTitle || "");
  const [departmentId, setDepartmentId] = useState(employee.departmentId || "");
  const [locationId, setLocationId] = useState(employee.locationId || "");
  const [managerId, setManagerId] = useState(employee.managerId || "");
  const [personalEmail, setPersonalEmail] = useState(employee.personalEmail || "");
  const [personalPhone, setPersonalPhone] = useState(employee.personalPhone || "");
  const [status, setStatus] = useState(employee.status || "active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when employee prop changes
  useEffect(() => {
    setFirstName(employee.firstName || "");
    setLastName(employee.lastName || "");
    setJobTitle(employee.jobTitle || "");
    setDepartmentId(employee.departmentId || "");
    setLocationId(employee.locationId || "");
    setManagerId(employee.managerId || "");
    setPersonalEmail(employee.personalEmail || "");
    setPersonalPhone(employee.personalPhone || "");
    setStatus(employee.status || "active");
  }, [employee]);

  // Exclude current employee from manager options to prevent cycles
  const eligibleManagers = useMemo(() => {
    return managers.filter((m) => m.id !== employee.id);
  }, [managers, employee.id]);

  const managerOptions: SelectOption[] = useMemo(() => [
    { value: "", label: "No manager assigned", description: "Direct reporting or founder (optional)" },
    ...eligibleManagers.map((m) => ({
      value: m.id,
      label: `${m.firstName} ${m.lastName}`.trim(),
      description: m.jobTitle || "Team Member",
      avatar: true,
    })),
  ], [eligibleManagers]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Validation error", "First name and last name are required.");
      return;
    }
    if (!jobTitle.trim()) {
      toast.error("Validation error", "Job title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: jobTitle.trim(),
        departmentId: departmentId ? departmentId : "",
        locationId: locationId ? locationId : "",
        managerId: managerId ? managerId : "",
        personalEmail: personalEmail.trim() ? personalEmail.trim() : "",
        personalPhone: personalPhone.trim() ? personalPhone.trim() : "",
        status: status,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employee.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.title || "Failed to update employee");
      }

      toast.success("Employee updated", `${firstName} ${lastName}'s profile has been updated.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Update failed", err.message || "Failed to save employee changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Employee Details"
      subtitle="Update role assignment, organizational unit, manager, and contact information."
      width={640}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Name Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>First Name *</label>
            <input
              type="text"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Last Name *</label>
            <input
              type="text"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </div>
        </div>

        {/* Job Title & Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Official Job Title *</label>
            <input
              type="text"
              className="input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Employment Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Reports To (Manager) - Searchable Select & Optional */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="row-between align-center">
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Reports To (Manager)</label>
            <span style={{ fontSize: 11, color: "#71717A", fontWeight: 500 }}>Optional · Can be added or changed later</span>
          </div>
          <SearchableSelect
            value={managerId}
            onChange={setManagerId}
            placeholder="Select manager or leave unassigned..."
            searchPlaceholder="Search managers by name..."
            options={managerOptions}
          />
        </div>

        {/* Department & Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Department</label>
            <SearchableSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department..."
              searchPlaceholder="Search departments..."
              options={departmentOptions}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Work Location</label>
            <SearchableSelect
              value={locationId}
              onChange={setLocationId}
              placeholder="Select work location..."
              searchPlaceholder="Search locations..."
              options={locationOptions}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Personal Email</label>
            <input
              type="email"
              className="input"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="personal@gmail.com"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3F3F46" }}>Personal Phone</label>
            <input
              type="tel"
              className="input"
              value={personalPhone}
              onChange={(e) => setPersonalPhone(e.target.value)}
              placeholder="+250 78... or +254 7..."
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: "9px 18px", borderRadius: 10, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary row gap-8 align-center"
            disabled={isSubmitting}
            style={{ padding: "9px 22px", borderRadius: 10, cursor: "pointer" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
