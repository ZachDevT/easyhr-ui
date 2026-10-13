"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Users,
  UserCog,
  LockKeyhole,
  Check,
  Loader2,
  X,
  Save,
  CheckSquare,
  Square,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

interface RoleItem {
  id: string;
  key: string;
  name: string;
  isSystem: boolean;
  isCustom: boolean;
  permissions: string[];
  memberCount: number;
}

interface PermissionItem {
  key: string;
  description: string;
}

export default function RolesPermissions() {
  const { getToken } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Edit permissions modal / mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Create role modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const [rolesRes, permsRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/roles`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/permissions`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=200`, { headers }),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roleList = Array.isArray(rolesData) ? rolesData : [];
        setRoles(roleList);
        if (roleList.length > 0) {
          setSelectedRole((prev) => {
            if (!prev) return roleList[0];
            const found = roleList.find((r) => r.id === prev.id);
            return found || roleList[0];
          });
        }
      }

      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissions(Array.isArray(permsData) ? permsData : []);
      }

      if (empsRes.ok) {
        const empsData = await empsRes.json();
        const list = empsData.data || [];
        setTotalEmployees(list.length);
      }
    } catch (err) {
      console.error("Failed to load roles and permissions", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group permissions by prefix (e.g., "employees:read" -> "Employees")
  const permissionGroups = React.useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    permissions.forEach((p) => {
      const prefix = p.key.split(":")[0] || "general";
      const groupName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace("_", " ");
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(p);
    });
    return groups;
  }, [permissions]);

  const handleStartEdit = () => {
    if (!selectedRole) return;
    setEditedPermissions([...(selectedRole.permissions || [])]);
    setIsEditing(true);
  };

  const togglePermission = (key: string) => {
    setEditedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingPermissions(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ permissionNames: editedPermissions }),
      });

      if (res.ok) {
        toast.success("Permissions updated", `Saved permissions for ${selectedRole.name}.`);
        setIsEditing(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Save failed", err.detail || "Could not update permissions.");
      }
    } catch (err) {
      toast.error("Error", "An unexpected error occurred while saving.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setIsCreatingRole(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/roles`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          name: newRoleName.trim(),
          permissions: newRolePerms,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success("Role created", `Role ${created.name} was successfully created.`);
        setIsCreateModalOpen(false);
        setNewRoleName("");
        setNewRolePerms([]);
        await fetchData();
        setSelectedRole(created);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Creation failed", err.detail || "Could not create role.");
      }
    } catch (err) {
      toast.error("Error", "An unexpected error occurred.");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const customRolesCount = roles.filter((r) => r.isCustom).length;
  const adminRole = roles.find((r) => r.key === "company_owner" || r.key === "admin");
  const adminCount = adminRole?.memberCount || 1;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Control access with transparent, least-privilege roles."
        icon={<ShieldCheck size={28} />}
        actions={
          <button
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)" }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} /> Create role
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Active members",
              value: totalEmployees,
              icon: <Users size={20} />,
              color: "var(--primary)",
              description: "Total directory members",
            },
            {
              label: "Custom roles",
              value: customRolesCount,
              icon: <UserCog size={20} />,
              color: "var(--success)",
              description: "Organization tailored",
            },
            {
              label: "Super Admins",
              value: adminCount,
              icon: <LockKeyhole size={20} />,
              color: "var(--warning)",
              description: "Owner access level",
            },
            {
              label: "System Permissions",
              value: permissions.length,
              icon: <ShieldCheck size={20} />,
              color: "var(--text-4)",
              description: "Configurable privileges",
            },
          ]}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
            <Loader2 size={32} className="spin text-primary" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 20,
              marginTop: 20,
            }}
          >
            {/* Roles List Card */}
            <Card>
              <CardBody>
                <SectionHeading
                  title="Access roles"
                  description="Select a role to inspect permissions"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {roles.map((r) => {
                    const isSelected = selectedRole?.id === r.id;
                    return (
                      <DataRow
                        key={r.id}
                        title={r.name}
                        subtitle={`${r.memberCount} ${r.memberCount === 1 ? "member" : "members"} · ${r.isSystem ? "System role" : "Custom role"}`}
                        meta={
                          <StatusPill tone={isSelected ? "primary" : r.isSystem ? "neutral" : "success"}>
                            {r.isSystem ? "System" : "Custom"}
                          </StatusPill>
                        }
                        onClick={() => {
                          setSelectedRole(r);
                          setIsEditing(false);
                        }}
                      />
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Selected Role Permissions Card */}
            <Card>
              <CardBody>
                {selectedRole ? (
                  <>
                    <SectionHeading
                      title={`${selectedRole.name} permissions`}
                      description={`Applies to ${selectedRole.memberCount} members · ${selectedRole.isSystem ? "Read-only system role" : "Custom editable role"}`}
                      action={
                        selectedRole.isCustom && (
                          <div style={{ display: "flex", gap: 8 }}>
                            {isEditing ? (
                              <>
                                <button
                                  className="btn-neutral"
                                  onClick={() => setIsEditing(false)}
                                  disabled={isSavingPermissions}
                                >
                                  <X size={14} /> Cancel
                                </button>
                                <button
                                  className="btn-primary"
                                  onClick={handleSavePermissions}
                                  disabled={isSavingPermissions}
                                >
                                  {isSavingPermissions ? (
                                    <Loader2 size={14} className="spin mr-4" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                  Save changes
                                </button>
                              </>
                            ) : (
                              <button className="btn-secondary" onClick={handleStartEdit}>
                                Edit permissions
                              </button>
                            )}
                          </div>
                        )
                      }
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
                      {Object.entries(permissionGroups).map(([groupName, groupPerms]) => (
                        <div key={groupName} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "var(--text-4)",
                              marginBottom: 12,
                            }}
                          >
                            {groupName}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {groupPerms.map((perm) => {
                              const activePerms = isEditing ? editedPermissions : selectedRole.permissions || [];
                              const hasPerm = activePerms.includes(perm.key);

                              return (
                                <div
                                  key={perm.key}
                                  onClick={() => isEditing && togglePermission(perm.key)}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    background: hasPerm ? "rgba(22, 163, 74, 0.05)" : "var(--bg-page)",
                                    border: hasPerm ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid var(--border)",
                                    cursor: isEditing ? "pointer" : "default",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <div style={{ marginTop: 2 }}>
                                    {isEditing ? (
                                      hasPerm ? (
                                        <CheckSquare size={16} className="text-success" />
                                      ) : (
                                        <Square size={16} className="text-4" />
                                      )
                                    ) : hasPerm ? (
                                      <span
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 4,
                                          display: "grid",
                                          placeItems: "center",
                                          background: "rgba(22, 163, 74, 0.15)",
                                          color: "var(--success)",
                                        }}
                                      >
                                        <Check size={12} strokeWidth={3} />
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 4,
                                          display: "grid",
                                          placeItems: "center",
                                          background: "#E5E7EB",
                                          color: "#9CA3AF",
                                        }}
                                      >
                                        <LockKeyhole size={10} />
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                                      {perm.key}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>
                                      {perm.description}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 48, textAlign: "center", color: "var(--text-4)" }}>
                    Select a role on the left to inspect its permissions.
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </main>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Access Role"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Role Display Name
            </label>
            <Input
              placeholder="e.g. Finance Controller, Lead Recruiter"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Initial Permissions
            </label>
            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {permissions.map((p) => {
                const checked = newRolePerms.includes(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() =>
                      setNewRolePerms((prev) =>
                        prev.includes(p.key) ? prev.filter((k) => k !== p.key) : [...prev, p.key]
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: checked ? "rgba(22, 163, 74, 0.05)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {checked ? (
                      <CheckSquare size={16} className="text-success" />
                    ) : (
                      <Square size={16} className="text-4" />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.key}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)" }}>{p.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 12,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <button
              className="btn-neutral"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreatingRole}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || isCreatingRole}
            >
              {isCreatingRole && <Loader2 size={14} className="spin mr-4" />}
              Create Role
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
