"use client";

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Employee } from '../data/employees';
import { currentEmployee, currentManager, currentHRAdmin } from '../data/employees';

import { useUser } from '@clerk/nextjs';
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
  const { user: clerkUser } = useUser();

  const realFirstName = userProfile?.firstName || clerkUser?.firstName || 'HR';
  const realLastName = userProfile?.lastName || clerkUser?.lastName || 'Admin';
  const realEmail = userProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
  const realAvatar = userProfile?.avatarUrl || clerkUser?.imageUrl || '';
  const realTitle = userProfile?.role || 'Company Owner';
  const realCompany = company?.name || 'Company';

  let currentUser = currentEmployee;
  if (role === 'Manager') currentUser = currentManager;
  if (role === 'HR Admin') {
    currentUser = {
      ...currentHRAdmin,
      id: userProfile?.id || clerkUser?.id || currentHRAdmin.id,
      firstName: realFirstName,
      lastName: realLastName,
      email: realEmail,
      phone: userProfile?.phone || '',
      avatar: realAvatar,
      title: realTitle,
      department: 'Executive / HR',
      division: realCompany,
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
