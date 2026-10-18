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
  isHRAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { userProfile, company } = useCompany();
  const { user: clerkUser } = useUser();

  const realFirstName = userProfile?.firstName || clerkUser?.firstName || '';
  const realLastName = userProfile?.lastName || clerkUser?.lastName || '';
  const realEmail = userProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
  const realAvatar = userProfile?.avatarUrl || clerkUser?.imageUrl || '';
  const realTitle = userProfile?.role || 'Company Administrator';
  const realCompany = company?.name || '';
  const realLocation = company?.city ? `${company.city}, ${company.countryCode}` : '';

  // Dynamically resolve role based on real backend userProfile role
  const rawRole = (userProfile?.role || '').toLowerCase();
  let dynamicRole: Role = 'Employee';
  if (
    rawRole.includes('admin') ||
    rawRole.includes('owner') ||
    rawRole.includes('hr') ||
    rawRole.includes('founder') ||
    rawRole.includes('director') ||
    rawRole.includes('executive')
  ) {
    dynamicRole = 'HR Admin';
  } else if (rawRole.includes('manager') || rawRole.includes('lead') || rawRole.includes('head')) {
    dynamicRole = 'Manager';
  }

  const [overrideRole, setOverrideRole] = useState<Role | null>(null);
  const activeRole = overrideRole || dynamicRole;

  const currentUser: Employee = {
    ...currentHRAdmin,
    id: userProfile?.employeeId || userProfile?.id || clerkUser?.id || 'user',
    firstName: realFirstName,
    lastName: realLastName,
    email: realEmail,
    phone: userProfile?.phone || '',
    avatar: realAvatar,
    title: realTitle,
    department: activeRole === 'HR Admin' ? 'Leadership / HR' : activeRole === 'Manager' ? 'Management' : 'Team Member',
    division: realCompany,
    location: realLocation,
    hireDate: '2024-01-01',
    status: 'Active',
  };

  return (
    <RoleContext.Provider
      value={{
        role: activeRole,
        setRole: setOverrideRole,
        currentUser,
        isHRAdmin: activeRole === 'HR Admin',
        isManager: activeRole === 'Manager',
        isEmployee: activeRole === 'Employee',
      }}
    >
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
