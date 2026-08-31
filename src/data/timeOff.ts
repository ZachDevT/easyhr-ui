export interface TimeOffRequest {
  id: string;
  employeeName: string;
  avatar: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  note?: string;
}

export interface TimeOffBalance {
  type: string;
  icon: string;
  hoursAvailable: number;
  hoursUsed: number;
  accrualRate: string;
}

export const timeOffBalances: TimeOffBalance[] = [
  { type: 'Vacation', icon: '🌴', hoursAvailable: 120, hoursUsed: 32, accrualRate: '10 days/year' },
  { type: 'Sick Leave', icon: '🏥', hoursAvailable: 64, hoursUsed: 8, accrualRate: '8 days/year' },
  { type: 'Floating Holiday', icon: '📅', hoursAvailable: 16, hoursUsed: 0, accrualRate: '2 days/year' },
];

export const timeOffRequests: TimeOffRequest[] = [
  {
    id: '1',
    employeeName: 'Grace Otieno',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    type: 'Vacation',
    startDate: 'Sep 15, 2026',
    endDate: 'Sep 20, 2026',
    days: 5,
    status: 'Pending',
    note: 'Family vacation planned since March.',
  },
  {
    id: '2',
    employeeName: 'David Kimani',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    type: 'Sick Leave',
    startDate: 'Sep 10, 2026',
    endDate: 'Sep 10, 2026',
    days: 1,
    status: 'Approved',
  },
  {
    id: '3',
    employeeName: 'Brian Ochieng',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    type: 'Floating Holiday',
    startDate: 'Oct 3, 2026',
    endDate: 'Oct 3, 2026',
    days: 1,
    status: 'Pending',
  },
  {
    id: '4',
    employeeName: 'Fatuma Ali',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
    type: 'Vacation',
    startDate: 'Nov 1, 2026',
    endDate: 'Nov 7, 2026',
    days: 5,
    status: 'Approved',
    note: 'Annual leave.',
  },
];

// Team calendar events (who's off)
export const teamAbsences = [
  { day: 15, name: 'Grace O.', color: '#A238FF', type: 'Vacation' },
  { day: 16, name: 'Grace O.', color: '#A238FF', type: 'Vacation' },
  { day: 17, name: 'Grace O.', color: '#A238FF', type: 'Vacation' },
  { day: 10, name: 'David K.', color: '#0F9D58', type: 'Sick' },
];
