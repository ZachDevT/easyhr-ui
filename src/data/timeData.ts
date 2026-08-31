export interface TimeEntry {
  id: string;
  day: string;
  date: string;
  hoursWorked: string;
  clockIn?: string;
  clockOut?: string;
  isToday?: boolean;
}

export interface TimeSummary {
  today: string;
  thisWeek: string;
  payPeriod: string;
  isClocked: boolean;
  clockedInAt?: string;
}

export const timeSummary: TimeSummary = {
  today: '6h 24m',
  thisWeek: '32h 15m',
  payPeriod: '64h 30m',
  isClocked: true,
  clockedInAt: 'Today at 9:00 AM',
};

export const weekEntries: TimeEntry[] = [
  { id: '1', day: 'Mon', date: 'Sep 1', hoursWorked: '8h 00m', clockIn: '9:00 AM', clockOut: '5:00 PM' },
  { id: '2', day: 'Tue', date: 'Sep 2', hoursWorked: '8h 30m', clockIn: '8:30 AM', clockOut: '5:00 PM' },
  { id: '3', day: 'Wed', date: 'Sep 3', hoursWorked: '7h 45m', clockIn: '9:15 AM', clockOut: '5:00 PM' },
  { id: '4', day: 'Thu', date: 'Sep 4', hoursWorked: '8h 00m', clockIn: '9:00 AM', clockOut: '5:00 PM' },
  { id: '5', day: 'Fri', date: 'Sep 5', hoursWorked: '6h 24m', clockIn: '9:00 AM', clockOut: '--', isToday: true },
  { id: '6', day: 'Sat', date: 'Sep 6', hoursWorked: '0h 00m' },
  { id: '7', day: 'Sun', date: 'Sep 7', hoursWorked: '0h 00m' },
];

export interface PayrollRow {
  name: string;
  manager: string;
  regular: number;
  overtime: number;
  holiday: number;
  pto: number;
  total: number;
  approved: boolean;
  avatar: string;
}

export const payrollData: PayrollRow[] = [
  { name: 'James Mwangi', manager: 'Sarah Johnson', regular: 64, overtime: 0, holiday: 0, pto: 0, total: 64, approved: false, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Amina Hassan', manager: 'Sarah Johnson', regular: 72, overtime: 8, holiday: 0, pto: 0, total: 80, approved: true, avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { name: 'David Kimani', manager: 'Amina Hassan', regular: 40, overtime: 0, holiday: 8, pto: 0, total: 48, approved: true, avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { name: 'Grace Otieno', manager: 'Sarah Johnson', regular: 24, overtime: 0, holiday: 0, pto: 40, total: 64, approved: false, avatar: 'https://randomuser.me/api/portraits/women/28.jpg' },
  { name: 'Brian Ochieng', manager: 'James Mwangi', regular: 80, overtime: 4, holiday: 0, pto: 0, total: 84, approved: true, avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { name: 'Fatuma Ali', manager: 'Sarah Johnson', regular: 64, overtime: 0, holiday: 0, pto: 0, total: 64, approved: false, avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
  { name: 'Peter Njoroge', manager: 'James Mwangi', regular: 56, overtime: 12, holiday: 0, pto: 0, total: 68, approved: true, avatar: 'https://randomuser.me/api/portraits/men/71.jpg' },
];
