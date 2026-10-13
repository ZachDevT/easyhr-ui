"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/Toast";

export interface CompanyData {
  id: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  taxIdentifier: string;
  websiteUrl: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  brandColor: string;
  logoUrl: string;
  subdomain: string;
  countryCode: string;
  timezone: string;
  addressLine1: string;
  city: string;
}

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: string;
}

export interface LocationItem {
  id: string;
  name: string;
  countryCode: string;
  timezone: string;
  addressLine1: string;
  city: string;
  status: string;
}

interface CompanyContextType {
  company: CompanyData | null;
  userProfile: UserProfileData | null;
  locations: LocationItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateCompany: (input: Partial<CompanyData>) => Promise<boolean>;
  updateProfile: (input: { firstName?: string; lastName?: string; phone?: string }) => Promise<boolean>;
  uploadLogo: (fileOrDataUrl: File | string) => Promise<string | null>;
  uploadAvatar: (fileOrDataUrl: File | string) => Promise<string | null>;
  addLocation: (location: { name: string; countryCode?: string; timezone?: string; addressLine1?: string; city?: string }) => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const CACHE_KEYS = {
  company: "easyhr_company_cache",
  user: "easyhr_user_cache",
  locations: "easyhr_locations_cache",
};

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [company, setCompany] = useState<CompanyData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEYS.company);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEYS.user);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [locations, setLocations] = useState<LocationItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEYS.locations);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(!company);

  const applyBrandColor = useCallback((color: string) => {
    if (!color || typeof document === "undefined") return;
    const cleanColor = color.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) return;
    document.documentElement.style.setProperty("--primary", cleanColor);
    document.documentElement.style.setProperty("--gradient", `linear-gradient(135deg, ${cleanColor} 0%, #2D144B 100%)`);
    document.documentElement.style.setProperty("--primary-tint", `${cleanColor}18`);
  }, []);

  // Immediate brand color injection on mount from cached company
  useEffect(() => {
    if (company?.brandColor) {
      applyBrandColor(company.brandColor);
    }
  }, [company?.brandColor, applyBrandColor]);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/me`, { headers });
      if (res.ok) {
        const data = await res.json();

        const comp: CompanyData = {
          id: data.organization?.id || "",
          name: data.organization?.name || "",
          legalName: data.legalProfile?.legalName || data.organization?.name || "",
          registrationNumber: data.legalProfile?.registrationNumber || "",
          taxIdentifier: data.legalProfile?.taxIdentifier || "",
          websiteUrl: data.legalProfile?.websiteUrl || "",
          contactEmail: data.legalProfile?.contactEmail || data.user?.email || "",
          contactPhone: data.legalProfile?.contactPhone || "",
          industry: data.legalProfile?.industry || "",
          brandColor: data.workspace?.brandColor || "#A238FF",
          logoUrl: data.workspace?.logoUrl || "",
          subdomain: data.workspace?.subdomain || "",
          countryCode: data.organization?.countryCode || "UG",
          timezone: data.organization?.timezone || "Africa/Kampala",
          addressLine1: data.legalProfile?.addressLine1 || "",
          city: data.legalProfile?.city || "",
        };

        const prof: UserProfileData = {
          id: data.user?.id || "",
          firstName: data.user?.firstName || clerkUser?.firstName || "",
          lastName: data.user?.lastName || clerkUser?.lastName || "",
          email: data.user?.email || clerkUser?.primaryEmailAddress?.emailAddress || "",
          phone: data.user?.phone || "",
          avatarUrl: data.user?.avatarUrl || clerkUser?.imageUrl || "",
          role: data.user?.role || "Company Administrator",
        };

        setCompany(comp);
        setUserProfile(prof);
        applyBrandColor(comp.brandColor);

        try {
          localStorage.setItem(CACHE_KEYS.company, JSON.stringify(comp));
          localStorage.setItem(CACHE_KEYS.user, JSON.stringify(prof));
        } catch {}
      }

      // Fetch locations
      const locRes = await fetch(`${API_BASE_URL}/api/v1/locations`, { headers });
      if (locRes.ok) {
        const locData = await locRes.json();
        const locs = locData.data || [];
        setLocations(locs);
        try {
          localStorage.setItem(CACHE_KEYS.locations, JSON.stringify(locs));
        } catch {}
      }
    } catch (err) {
      console.warn("Could not load company/user details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn, clerkUser, applyBrandColor]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refresh();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, refresh]);

  const updateCompany = async (input: Partial<CompanyData>): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}/api/v1/organization/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: input.name,
          legalName: input.legalName,
          registrationNumber: input.registrationNumber,
          taxIdentifier: input.taxIdentifier,
          websiteUrl: input.websiteUrl,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          industry: input.industry,
          addressLine1: input.addressLine1,
          city: input.city,
          brandColor: input.brandColor,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved", "Company profile updated successfully.");
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateProfile = async (input: { firstName?: string; lastName?: string; phone?: string }): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        toast.success("Profile updated", "Personal profile updated successfully.");
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const uploadLogo = async (fileOrDataUrl: File | string): Promise<string | null> => {
    try {
      const token = await getToken();
      if (!token) return null;

      let res: Response;
      if (typeof fileOrDataUrl === "string") {
        res = await fetch(`${API_BASE_URL}/api/v1/branding/logo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ logoDataUrl: fileOrDataUrl }),
        });
      } else {
        const formData = new FormData();
        formData.append("logo", fileOrDataUrl);
        res = await fetch(`${API_BASE_URL}/api/v1/branding/logo`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (res.ok) {
        const data = await res.json();
        toast.success("Logo updated", "Brand logo updated successfully.");
        await refresh();
        return data.logoUrl;
      }
      return null;
    } catch {
      return null;
    }
  };

  const uploadAvatar = async (fileOrDataUrl: File | string): Promise<string | null> => {
    try {
      const token = await getToken();
      if (!token) return null;

      let res: Response;
      if (typeof fileOrDataUrl === "string") {
        res = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarDataUrl: fileOrDataUrl }),
        });
      } else {
        const formData = new FormData();
        formData.append("avatar", fileOrDataUrl);
        res = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (res.ok) {
        const data = await res.json();
        toast.success("Avatar updated", "Profile photo updated successfully.");
        await refresh();
        return data.avatarUrl;
      }
      return null;
    } catch {
      return null;
    }
  };

  const addLocation = async (location: { name: string; countryCode?: string; timezone?: string; addressLine1?: string; city?: string }): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}/api/v1/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });

      if (res.ok) {
        toast.success("Location added", `"${location.name}" added to company locations.`);
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        userProfile,
        locations,
        isLoading,
        refresh,
        updateCompany,
        updateProfile,
        uploadLogo,
        uploadAvatar,
        addLocation,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
