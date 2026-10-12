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

  const realFirstName = userProfile?.firstName || clerkUser?.firstName || '';
  const realLastName = userProfile?.lastName || clerkUser?.lastName || '';
  const realEmail = userProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
  const realAvatar = userProfile?.avatarUrl || clerkUser?.imageUrl || '';
  const realTitle = userProfile?.role || 'Company Administrator';
  const realCompany = company?.name || '';
  const realLocation = company?.city ? `${company.city}, ${company.countryCode}` : '';

  let currentUser: Employee = currentEmployee;
  if (role === 'Manager') currentUser = currentManager;
  if (role === 'HR Admin') {
    currentUser = {
      ...currentHRAdmin,
      id: userProfile?.id || clerkUser?.id || 'admin',
      firstName: realFirstName,
      lastName: realLastName,
      email: realEmail,
      phone: userProfile?.phone || '',
      avatar: realAvatar, // Empty string means initials or custom avatar, never dummy Sarah Johnson
      title: realTitle,
      department: 'Leadership / HR',
      division: realCompany,
      location: realLocation,
      hireDate: '2024-01-01',
      status: 'Active',
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
