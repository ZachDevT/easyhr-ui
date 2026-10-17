"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { OPTIONAL_WIDGETS } from '../components/widgets';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';

export const MAX_WIDGETS = 4;
const STORAGE_KEY = "easyhr_active_dashboard_widgets";

interface WidgetContextType {
  activeWidgets: string[];
  setActiveWidgets: (widgets: string[]) => void;
  addWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (dragIndex: number, hoverIndex: number) => void;
  resetToDefault: () => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function WidgetProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [activeWidgets, setActiveWidgetsState] = useState<string[]>(() =>
    OPTIONAL_WIDGETS.filter((w) => w.default).map((w) => w.id)
  );

  // Hydrate saved widgets on client mount to avoid SSR hydration mismatch (#418)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveWidgetsState(parsed);
        }
      }
    } catch {}
  }, []);

  // Sync with backend preferences
  useEffect(() => {
    if (!isSignedIn) return;

    let isMounted = true;
    async function loadBackendPreferences() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/user/preferences`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.activeWidgets && Array.isArray(data.activeWidgets) && isMounted) {
            setActiveWidgetsState(data.activeWidgets);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.activeWidgets));
            } catch {}
          }
        }
      } catch {
        // Fallback silently to localStorage
      }
    }
    loadBackendPreferences();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken]);

  // Persist helper
  const persistWidgets = useCallback(async (widgets: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {}

    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/v1/user/preferences`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ activeWidgets: widgets }),
      });
    } catch {}
  }, [isSignedIn, getToken]);

  const setActiveWidgets = (widgets: string[]) => {
    setActiveWidgetsState(widgets);
    persistWidgets(widgets);
  };

  const addWidget = (id: string) => {
    setActiveWidgetsState((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_WIDGETS) return prev;
      const next = [...prev, id];
      persistWidgets(next);
      return next;
    });
  };

  const removeWidget = (id: string) => {
    setActiveWidgetsState((prev) => {
      const next = prev.filter((wId) => wId !== id);
      persistWidgets(next);
      return next;
    });
  };

  const reorderWidgets = (dragIndex: number, hoverIndex: number) => {
    setActiveWidgetsState((prev) => {
      const newWidgets = [...prev];
      const [draggedItem] = newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, draggedItem);
      persistWidgets(newWidgets);
      return newWidgets;
    });
  };

  const resetToDefault = () => {
    const defaults = OPTIONAL_WIDGETS.filter((w) => w.default).map((w) => w.id);
    setActiveWidgetsState(defaults);
    persistWidgets(defaults);
  };

  return (
    <WidgetContext.Provider
      value={{
        activeWidgets,
        setActiveWidgets,
        addWidget,
        removeWidget,
        reorderWidgets,
        resetToDefault,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
}
