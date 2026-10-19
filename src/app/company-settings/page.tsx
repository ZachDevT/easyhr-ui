"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Globe2,
  MapPin,
  Plus,
  Save,
  Settings2,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Palette,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { useCompany } from "@/context/CompanyContext";
import { FilePicker } from "@/components/ui/FilePicker";
import { Modal } from "@/components/ui/Modal";
import { CompanySettingsSkeleton } from "@/components/ui/Skeleton";

export default function CompanySettingsPage() {
  const {
    company,
    locations,
    isLoading,
    updateCompany,
    uploadLogo,
    addLocation,
  } = useCompany();

  const [tab, setTab] = useState("Company profile");

  // Form states initialized from company context
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [brandColor, setBrandColor] = useState("#2563EB");
  const [logoDataUrl, setLogoDataUrl] = useState("");

  // Location modal states
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocCity, setNewLocCity] = useState("Kampala");
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setLegalName(company.legalName || "");
      setRegistrationNumber(company.registrationNumber || "");
      setTaxIdentifier(company.taxIdentifier || "");
      setWebsiteUrl(company.websiteUrl || "");
      setContactEmail(company.contactEmail || "");
      setContactPhone(company.contactPhone || "");
      setIndustry(company.industry || "Technology");
      setAddressLine1(company.addressLine1 || "");
      setCity(company.city || "Kampala");
      setBrandColor(company.brandColor || "#2563EB");
      setLogoDataUrl(company.logoUrl || "");
    }
  }, [company]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const ok = await updateCompany({
        name,
        legalName,
        registrationNumber,
        taxIdentifier,
        websiteUrl,
        contactEmail,
        contactPhone,
        industry,
        addressLine1,
        city,
        brandColor,
      });

      if (!ok) {
        throw new Error("Could not save company settings. Please try again.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (newLogoUrl: string | null) => {
    setLogoDataUrl(newLogoUrl || "");
    if (!newLogoUrl || !newLogoUrl.startsWith("data:")) return;

    setLogoUploading(true);
    setLogoUploadSuccess(false);
    try {
      const savedUrl = await uploadLogo(newLogoUrl);
      if (savedUrl) {
        setLogoDataUrl(savedUrl);
        setLogoUploadSuccess(true);
        setTimeout(() => setLogoUploadSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    setIsAddingLoc(true);
    try {
      const ok = await addLocation({
        name: newLocName.trim(),
        addressLine1: newLocAddress.trim(),
        city: newLocCity.trim() || "Kampala",
        countryCode: company?.countryCode || "UG",
        timezone: company?.timezone || "Africa/Kampala",
      });

      if (ok) {
        setNewLocName("");
        setNewLocAddress("");
        setLocModalOpen(false);
      }
    } finally {
      setIsAddingLoc(false);
    }
  };

  if (isLoading && !company) {
    return <CompanySettingsSkeleton />;
  }

  return (
    <>
      <PageHeader
        title="Company Settings"
        subtitle="Configure the company foundation and brand shared by every EasyHR module."
        icon={<Settings2 size={18} />}
        tabs={["Company profile", "Locations", "Work calendar", "Branding"]}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <button
            className="btn-primary"
            style={{
              background: saveSuccess ? "#16A34A" : "white",
              color: saveSuccess ? "white" : "var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 14px",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              transition: "all 0.2s",
            }}
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save changes"}
          </button>
        }
      />

      <main style={{ padding: "0 0 32px" }}>
        {saveError && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#B91C1C",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#15803D",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Check size={16} />
            <span>Company details successfully updated and saved.</span>
          </div>
        )}

        {/* TAB 1: COMPANY PROFILE */}
        {tab === "Company profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.45fr .65fr", gap: 18, alignItems: "start" }}>
            <Card>
              <CardBody style={{ padding: 22 }}>
                <SectionHeading
                  title="Organization details"
                  description="Used across employee documents, contracts, payroll records, and official communications"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <Field label="Legal company name">
                    <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                  </Field>

                  <Field label="Display name (shown in Dashboard & apps)">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Registration number">
                      <Input
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="e.g. 800200034921"
                      />
                    </Field>
                    <Field label="Tax identification number (TIN)">
                      <Input
                        value={taxIdentifier}
                        onChange={(e) => setTaxIdentifier(e.target.value)}
                        placeholder="e.g. 1018459021"
                      />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Company website">
                      <Input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://acacia.co"
                      />
                    </Field>
                    <Field label="Industry">
                      <Input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. Technology"
                      />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Primary HR contact email">
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="people@acacia.co"
                      />
                    </Field>
                    <Field label="Contact phone">
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+256 700 000000"
                      />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr", gap: 16 }}>
                    <Field label="Physical address">
                      <Input
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Plot 14, Main Road"
                      />
                    </Field>
                    <Field label="City">
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Kampala"
                      />
                    </Field>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Company identity" />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 0" }}>
                  {company?.logoUrl ? (
                    <div style={{ width: 88, height: 88, borderRadius: 20, border: "1px solid #E5E7EB", display: "grid", placeItems: "center", overflow: "hidden", background: "#fff", marginBottom: 16, padding: 8 }}>
                      <img src={company.logoUrl} alt={company.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 20,
                        display: "grid",
                        placeItems: "center",
                        background: brandColor || "var(--gradient)",
                        color: "white",
                        fontSize: 30,
                        fontWeight: 800,
                        marginBottom: 16,
                      }}
                    >
                      {name ? name.charAt(0).toUpperCase() : "E"}
                    </div>
                  )}

                  <h3 className="m-0 text-lg fw-800 text-1">{name || "Your Company"}</h3>
                  <p className="text-sm text-4 mt-4">{industry || "Human Resources"}</p>

                  <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                    <StatusPill tone="success">Active Workspace</StatusPill>
                    <StatusPill tone="neutral">{company?.countryCode || "UG"}</StatusPill>
                  </div>

                  <div style={{ marginTop: 24, padding: "12px 16px", background: "#F9FAFB", borderRadius: 10, width: "100%", textAlign: "left", fontSize: 12 }}>
                    <span style={{ color: "#6B7280", display: "block" }}>Workspace Subdomain:</span>
                    <b style={{ color: "#111827", fontSize: 13 }}>https://{company?.subdomain || "acacia"}.easyhr.pro</b>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* TAB 2: LOCATIONS */}
        {tab === "Locations" && (
          <Card>
            <CardBody>
              <SectionHeading
                title="Offices & locations"
                description="Locations govern public holidays, shift scheduling, geofencing, and local attendance rules"
                action={
                  <button className="btn-neutral" onClick={() => setLocModalOpen(true)}>
                    <Plus size={15} /> Add location
                  </button>
                }
              />
              {locations.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#6B7280" }}>
                  <MapPin size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p>No locations recorded yet. Add your main headquarters below.</p>
                </div>
              ) : (
                locations.map((loc, i) => (
                  <DataRow
                    key={loc.id || i}
                    leading={<MapPin size={18} color="var(--primary)" />}
                    title={loc.name}
                    subtitle={`${loc.addressLine1 || loc.city || "Kampala"} · ${loc.timezone || "Africa/Kampala"}`}
                    meta={i === 0 ? <StatusPill tone="primary">Primary HQ</StatusPill> : <StatusPill tone="neutral">Active branch</StatusPill>}
                    onClick={() => {}}
                  />
                ))
              )}
            </CardBody>
          </Card>
        )}

        {/* TAB 3: WORK CALENDAR */}
        {tab === "Work calendar" && (
          <Card>
            <CardBody>
              <SectionHeading
                title="Regional work settings"
                description="Set the standard working hours, time zone, and operating currency for your team."
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Company timezone">
                  <Select defaultValue={company?.timezone || "kampala"}>
                    <option value="kampala">Africa/Kampala (UTC+3 / EAT)</option>
                    <option value="nairobi">Africa/Nairobi (UTC+3)</option>
                    <option value="kigali">Africa/Kigali (UTC+2)</option>
                    <option value="london">Europe/London (UTC+0 / GMT)</option>
                  </Select>
                </Field>
                <Field label="Default currency">
                  <Select defaultValue="ugx">
                    <option value="ugx">UGX — Ugandan Shilling</option>
                    <option value="kes">KES — Kenyan Shilling</option>
                    <option value="tzs">TZS — Tanzanian Shilling</option>
                    <option value="usd">USD — United States Dollar</option>
                  </Select>
                </Field>
                <Field label="Work week">
                  <Select defaultValue="mon_fri">
                    <option value="mon_fri">Monday – Friday (5 days)</option>
                    <option value="mon_sat">Monday – Saturday (6 days)</option>
                  </Select>
                </Field>
                <Field label="Standard weekly hours">
                  <Input type="number" defaultValue="40" />
                </Field>
              </div>
            </CardBody>
          </Card>
        )}

        {/* TAB 4: BRANDING (CLOUDFLARE R2 ASSETS) */}
        {tab === "Branding" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
            <Card>
              <CardBody>
                <SectionHeading
                  title="Company brand logo"
                  description="Your official brand logo will replace the EasyHR mark across the dashboard, employee emails, careers page, and contracts."
                />

                {logoUploadSuccess && (
                  <div
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #86EFAC",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "#15803D",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Logo successfully uploaded and saved!</span>
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <FilePicker
                    label="Upload company logo"
                    value={logoDataUrl}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    maxSizeMB={5}
                    placeholderText="Drop or select your brand logo here"
                  />
                  {logoUploading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: "var(--primary)" }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading logo...</span>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: "#E5E7EB", margin: "24px 0" }} />

                <SectionHeading
                  title="Brand primary color"
                  description="Changes the interactive accent color, gradient headers, and button highlights across your entire workspace."
                />

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        border: "2px solid #E5E7EB",
                        cursor: "pointer",
                        padding: 0,
                        background: "none",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, maxWidth: 220 }}>
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#2563EB"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["#2563EB", "#059669", "#EA580C", "#DC2626", "#4F46E5", "#0F172A"].map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setBrandColor(swatch)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: swatch,
                          border: brandColor === swatch ? "2px solid #000" : "1px solid rgba(0,0,0,0.1)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <button
                    className="btn-primary"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    style={{ padding: "9px 24px" }}
                  >
                    {isSaving ? "Saving..." : "Apply branding"}
                  </button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Live brand preview" />
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#F9FAFB",
                  }}
                >
                  {/* Top Bar Preview */}
                  <div
                    style={{
                      height: 50,
                      background: "#fff",
                      borderBottom: "1px solid #E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      gap: 12,
                    }}
                  >
                    {logoDataUrl ? (
                      <img
                        src={logoDataUrl}
                        alt="Brand preview"
                        style={{ maxHeight: 26, maxWidth: 100, objectFit: "contain" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: brandColor,
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {name ? name.charAt(0).toUpperCase() : "E"}
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {name || "Your Company"}
                    </span>
                  </div>

                  {/* Header Preview */}
                  <div
                    style={{
                      padding: "20px 16px",
                      background: `linear-gradient(135deg, ${brandColor} 0%, #2D144B 100%)`,
                      color: "#fff",
                    }}
                  >
                    <small style={{ opacity: 0.8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Employee Portal Preview
                    </small>
                    <h4 style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 800 }}>
                      Welcome to {name || "EasyHR"}
                    </h4>
                  </div>

                  {/* Action Preview */}
                  <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Primary Button Sample</span>
                    <button
                      type="button"
                      style={{
                        background: brandColor,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "default",
                      }}
                    >
                      Clock in
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 6 }}>
                    Workspace Portal Address
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#F3F4F6",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      https://{company?.subdomain || "acacia"}.easyhr.pro
                    </span>
                    <Globe2 size={16} color="var(--primary)" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </main>

      {/* Add Location Modal */}
      <Modal isOpen={locModalOpen} onClose={() => setLocModalOpen(false)} title="Add Company Office / Branch">
        <form onSubmit={handleAddLocationSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Location / Branch Name">
            <Input
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              placeholder="e.g. Entebbe Regional Hub"
              required
            />
          </Field>
          <Field label="Street Address">
            <Input
              value={newLocAddress}
              onChange={(e) => setNewLocAddress(e.target.value)}
              placeholder="e.g. Plot 4, Airport Road"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City">
              <Input
                value={newLocCity}
                onChange={(e) => setNewLocCity(e.target.value)}
                placeholder="Kampala"
              />
            </Field>
            <Field label="Timezone">
              <Select defaultValue="Africa/Kampala">
                <option value="Africa/Kampala">Africa/Kampala (UTC+3)</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-neutral" onClick={() => setLocModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isAddingLoc} style={{ padding: "8px 20px" }}>
              {isAddingLoc ? "Saving..." : "Add Location"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", display: "block" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
