"use client";

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Employee } from '../data/employees';
import { currentEmployee, currentManager, currentHRAdmin } from '../data/employees';

import { useCompany } from './CompanyContext';

export type Role = 'Employee' | 'Manager' | 'HR Admin';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: Employee;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('HR Admin');
  const { userProfile, company } = useCompany();

  let currentUser = currentEmployee;
  if (role === 'Manager') currentUser = currentManager;
  if (role === 'HR Admin') {
    currentUser = {
      ...currentHRAdmin,
      id: userProfile?.id || currentHRAdmin.id,
      firstName: userProfile?.firstName || currentHRAdmin.firstName,
      lastName: userProfile?.lastName || currentHRAdmin.lastName,
      email: userProfile?.email || currentHRAdmin.email,
      phone: userProfile?.phone || currentHRAdmin.phone,
      avatar: userProfile?.avatarUrl || currentHRAdmin.avatar,
      title: userProfile?.role || 'Company Owner',
      department: 'Executive / HR',
      division: company?.name || currentHRAdmin.division,
    };
  }

  return (
    <RoleContext.Provider value={{ role, setRole, currentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
