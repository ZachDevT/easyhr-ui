"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useCompany } from "@/context/CompanyContext";
import { FilePicker } from "./FilePicker";
import { User, Phone, Check, AlertCircle, Loader2 } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { userProfile, updateProfile, uploadAvatar } = useCompany();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile && isOpen) {
      setFirstName(userProfile.firstName || "");
      setLastName(userProfile.lastName || "");
      setPhone(userProfile.phone || "");
      setAvatarDataUrl(userProfile.avatarUrl || "");
      setError("");
      setSuccess(false);
    }
  }, [userProfile, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      // 1. If avatar changed and is a new data URL, upload to Cloudflare R2
      if (avatarDataUrl && avatarDataUrl !== userProfile?.avatarUrl && avatarDataUrl.startsWith("data:")) {
        const uploadedUrl = await uploadAvatar(avatarDataUrl);
        if (!uploadedUrl) {
          throw new Error("Failed to upload avatar to Cloudflare storage.");
        }
      }

      // 2. Update user info in backend
      const ok = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });

      if (!ok) {
        throw new Error("Failed to update profile information.");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Your Profile">
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#B91C1C",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#15803D",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Check size={16} />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "340px" }}>
            <FilePicker
              label="Profile Photo (stored in Cloudflare R2)"
              value={avatarDataUrl}
              onChange={(url) => setAvatarDataUrl(url)}
              accept="image/png,image/jpeg,image/webp"
              maxSizeMB={5}
              placeholderText="Upload your avatar"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "13px"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "13px"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
            Phone Number
          </label>
          <div style={{ position: "relative" }}>
            <Phone size={14} style={{ position: "absolute", left: 10, top: 11, color: "#9CA3AF" }} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000000"
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "13px"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={onClose}
            style={{ padding: "8px 16px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
            style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
