"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Candidate = {
  id: number;
  name: string;
  role: string;
  stage: string; // 'Sourced' | 'Applied' | 'Interviewing' | 'Offer' | 'Hired'
  source: string;
  date: string;
  rating: number | null;
  avatar: string;
  email: string;
  phone: string;
};

export type OnboardingTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type OnboardingRecord = {
  id: number;
  candidateId: number;
  name: string;
  role: string;
  department: string;
  startDate: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Completed' | 'Not Started';
  tasks: OnboardingTask[];
};

interface HRContextType {
  candidates: Candidate[];
  updateCandidateStage: (id: number, stage: string) => void;
  onboardings: OnboardingRecord[];
  initiateOnboarding: (candidate: Candidate, startDate: string, department: string) => void;
}

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 1, name: 'Alex Johnson', role: 'Senior Frontend Engineer', stage: 'Interviewing', source: 'LinkedIn', date: '2 days ago', rating: 4, avatar: 'https://i.pravatar.cc/150?img=11', email: 'alex.j@example.com', phone: '+1 (555) 123-4567' },
  { id: 2, name: 'Maria Garcia', role: 'Senior Frontend Engineer', stage: 'Applied', source: 'Referral', date: '1 day ago', rating: null, avatar: 'https://i.pravatar.cc/150?img=5', email: 'maria.g@example.com', phone: '+1 (555) 987-6543' },
  { id: 3, name: 'Wei Chen', role: 'Senior Frontend Engineer', stage: 'Hired', source: 'Direct Website', date: '5 days ago', rating: 5, avatar: 'https://i.pravatar.cc/150?img=12', email: 'wei.c@example.com', phone: '+1 (555) 555-5555' },
  { id: 4, name: 'Jessica Smith', role: 'Product Manager', stage: 'Hired', source: 'Agency', date: 'Today', rating: null, avatar: 'https://i.pravatar.cc/150?img=47', email: 'jess.s@example.com', phone: '+1 (555) 111-2222' },
  { id: 5, name: 'David Kim', role: 'Senior Frontend Engineer', stage: 'Interviewing', source: 'Indeed', date: '3 days ago', rating: 3, avatar: 'https://i.pravatar.cc/150?img=15', email: 'david.k@example.com', phone: '+1 (555) 333-4444' },
];

const INITIAL_ONBOARDINGS: OnboardingRecord[] = [
  { 
    id: 101, candidateId: 99, name: 'Michael Chang', role: 'Sales Development Rep', department: 'Sales', startDate: 'Nov 1, 2026', progress: 10, status: 'Not Started',
    tasks: [
      { id: 't1', title: 'Sign Offer Letter', completed: true },
      { id: 't2', title: 'Submit Background Check', completed: false },
      { id: 't3', title: 'IT Equipment Setup', completed: false },
    ]
  },
  { 
    id: 102, candidateId: 98, name: 'Sarah Miller', role: 'Product Manager', department: 'Product', startDate: 'Oct 25, 2026', progress: 40, status: 'At Risk',
    tasks: [
      { id: 't1', title: 'Sign Offer Letter', completed: true },
      { id: 't2', title: 'Submit Background Check', completed: true },
      { id: 't3', title: 'Complete I-9 Form', completed: false },
      { id: 't4', title: 'IT Equipment Setup', completed: false },
    ]
  },
];

const HRContext = createContext<HRContextType | undefined>(undefined);

export function HRProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>(INITIAL_ONBOARDINGS);

  const updateCandidateStage = (id: number, stage: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
  };

  const initiateOnboarding = (candidate: Candidate, startDate: string, department: string) => {
    const newRecord: OnboardingRecord = {
      id: Date.now(),
      candidateId: candidate.id,
      name: candidate.name,
      role: candidate.role,
      department,
      startDate,
      progress: 0,
      status: 'On Track',
      tasks: [
        { id: `t1-${Date.now()}`, title: 'Send Welcome Email', completed: false },
        { id: `t2-${Date.now()}`, title: 'Setup IT Account', completed: false },
        { id: `t3-${Date.now()}`, title: 'Collect I-9 Form', completed: false },
      ]
    };
    setOnboardings(prev => [newRecord, ...prev]);
  };

  return (
    <HRContext.Provider value={{ candidates, updateCandidateStage, onboardings, initiateOnboarding }}>
      {children}
    </HRContext.Provider>
  );
}

export function useHR() {
  const context = useContext(HRContext);
  if (context === undefined) {
    throw new Error('useHR must be used within a HRProvider');
  }
  return context;
}
