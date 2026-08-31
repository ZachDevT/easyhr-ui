"use client";

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { OPTIONAL_WIDGETS } from '../components/widgets';

export const MAX_WIDGETS = 4;

interface WidgetContextType {
  activeWidgets: string[];
  setActiveWidgets: (widgets: string[]) => void;
  addWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (dragIndex: number, hoverIndex: number) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(
    OPTIONAL_WIDGETS.filter((w) => w.default).map((w) => w.id)
  );

  const addWidget = (id: string) => {
    setActiveWidgets((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_WIDGETS) return prev;
      return [...prev, id];
    });
  };

  const removeWidget = (id: string) => {
    setActiveWidgets((prev) => prev.filter((wId) => wId !== id));
  };

  const reorderWidgets = (dragIndex: number, hoverIndex: number) => {
    setActiveWidgets((prev) => {
      const newWidgets = [...prev];
      const [draggedItem] = newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, draggedItem);
      return newWidgets;
    });
  };

  return (
    <WidgetContext.Provider value={{ activeWidgets, setActiveWidgets, addWidget, removeWidget, reorderWidgets }}>
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
