"use client";

import { API_BASE_URL, getAuthHeaders, getWorkspaceSubdomain, getWorkspaceUrl, extractSubdomain } from "@/lib/api";
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
  employeeStatus?: string;
  employeeId?: string;
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

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyBrandColor = useCallback((color: string) => {
    if (!color || typeof document === "undefined") return;
    const cleanColor = color.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) return;
    document.documentElement.style.setProperty("--primary", cleanColor);
    document.documentElement.style.setProperty("--gradient", `linear-gradient(135deg, ${cleanColor} 0%, #2D144B 100%)`);
    document.documentElement.style.setProperty("--primary-tint", `${cleanColor}18`);
  }, []);

  // Hydrate cached company, userProfile, and locations on client mount (prevents SSR hydration mismatch #418)
  useEffect(() => {
    try {
      const cachedComp = localStorage.getItem(CACHE_KEYS.company);
      if (cachedComp) {
        const parsedComp = JSON.parse(cachedComp);
        setCompany((prev) => prev || parsedComp);
        setIsLoading(false);
        if (parsedComp?.brandColor) {
          applyBrandColor(parsedComp.brandColor);
        }
      }
      const cachedUser = localStorage.getItem(CACHE_KEYS.user);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setUserProfile((prev) => prev || parsedUser);
      }
      const cachedLocs = localStorage.getItem(CACHE_KEYS.locations);
      if (cachedLocs) {
        const parsedLocs = JSON.parse(cachedLocs);
        if (Array.isArray(parsedLocs)) {
          setLocations((prev) => (prev.length > 0 ? prev : parsedLocs));
        }
      }
    } catch {}
  }, [applyBrandColor]);

  // Immediate brand color injection when company brandColor changes
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

    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (
        path.startsWith("/company/register") ||
        path.startsWith("/auth") ||
        path.startsWith("/careers") ||
        path === "/workspace-not-found"
      ) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = await getToken();
      if (!token) return;

      const headers = getAuthHeaders(token);
      let res = await fetch(`${API_BASE_URL}/api/v1/me`, { headers });

      // If user attempted to access a workspace they do not belong to (HTTP 403 Forbidden)
      if (res.status === 403) {
        // Fallback: check their default active membership without the requested workspace selector
        const fallbackRes = await fetch(`${API_BASE_URL}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const targetSub = fallbackData.workspace?.subdomain;
          if (targetSub && typeof window !== "undefined") {
            toast.error(
              "Switched Workspace",
              `You are not a member of the requested workspace. Redirecting to your workspace (${targetSub})...`
            );
            window.location.href = getWorkspaceUrl(targetSub, "/dashboard");
            return;
          }
        } else {
          // User has no active organization workspace at all in the database
          setCompany(null);
          setUserProfile(null);
          try {
            localStorage.removeItem(CACHE_KEYS.company);
            localStorage.removeItem(CACHE_KEYS.user);
          } catch {}
          if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (
              !path.startsWith("/company/register") &&
              !path.startsWith("/auth") &&
              !path.startsWith("/careers") &&
              !path.startsWith("/my-onboarding")
            ) {
              window.location.href = "/company/register";
              return;
            }
          }
        }
      } else if (res.status === 404) {
        // User record does not exist in backend
        setCompany(null);
        setUserProfile(null);
        try {
          localStorage.removeItem(CACHE_KEYS.company);
          localStorage.removeItem(CACHE_KEYS.user);
        } catch {}
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          if (
            !path.startsWith("/company/register") &&
            !path.startsWith("/auth") &&
            !path.startsWith("/careers") &&
            !path.startsWith("/my-onboarding")
          ) {
            window.location.href = "/company/register";
            return;
          }
        }
      }

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
          employeeStatus: data.user?.employeeStatus || "",
          employeeId: data.user?.employeeId || "",
        };

        setCompany(comp);
        setUserProfile(prof);
        applyBrandColor(comp.brandColor);

        if (comp.subdomain && typeof window !== "undefined") {
          const isLocalhost = window.location.hostname.includes("localhost");
          const domainAttr = isLocalhost ? "" : "; Domain=.easyhr.pro";
          document.cookie = `easyhr_current_workspace=${encodeURIComponent(comp.subdomain)}; Path=/${domainAttr}; SameSite=Lax; max-age=2592000`;

          // If on apex domain easyhr.pro or plain localhost:3000, redirect to their workspace subdomain
          const hostSub = extractSubdomain(window.location.hostname);
          if (!hostSub && comp.subdomain && (window.location.hostname === "easyhr.pro" || window.location.hostname === "www.easyhr.pro" || window.location.hostname === "localhost")) {
            const currentPath = window.location.pathname;
            window.location.href = getWorkspaceUrl(comp.subdomain, currentPath);
            return;
          }
        }

        try {
          localStorage.setItem(CACHE_KEYS.company, JSON.stringify(comp));
          localStorage.setItem(CACHE_KEYS.user, JSON.stringify(prof));
        } catch {}
      }

      // Fetch locations with workspace context
      const locRes = await fetch(`${API_BASE_URL}/api/v1/locations`, { headers: getAuthHeaders(token) });
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
        headers: getAuthHeaders(token),
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
        headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
          body: JSON.stringify({ logoDataUrl: fileOrDataUrl }),
        });
      } else {
        const formData = new FormData();
        formData.append("logo", fileOrDataUrl);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const sub = getWorkspaceSubdomain();
        if (sub) headers["X-EasyHR-Workspace"] = sub;

        res = await fetch(`${API_BASE_URL}/api/v1/branding/logo`, {
          method: "POST",
          headers,
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
          headers: getAuthHeaders(token),
          body: JSON.stringify({ avatarDataUrl: fileOrDataUrl }),
        });
      } else {
        const formData = new FormData();
        formData.append("avatar", fileOrDataUrl);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const sub = getWorkspaceSubdomain();
        if (sub) headers["X-EasyHR-Workspace"] = sub;

        res = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
          method: "POST",
          headers,
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
        headers: getAuthHeaders(token),
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
