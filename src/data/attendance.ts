export type AttendanceStatus = 'Clocked In' | 'Clocked Out' | 'Late' | 'Missing';
export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'Off';

export interface ShiftSchedule {
  monday: ShiftType;
  tuesday: ShiftType;
  wednesday: ShiftType;
  thursday: ShiftType;
  friday: ShiftType;
  saturday: ShiftType;
  sunday: ShiftType;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  avatar: string;
  department: string;
  status: AttendanceStatus;
  clockInTime: string | null;
  clockOutTime: string | null;
  expectedStartTime: string;
  latenessMinutes: number;
  totalWorkedToday: string | null;
  lastLocation: string | null;
  hasShiftToday: boolean;
  weeklySchedule: ShiftSchedule;
}

const defaultSchedule: ShiftSchedule = {
  monday: 'Morning',
  tuesday: 'Morning',
  wednesday: 'Morning',
  thursday: 'Morning',
  friday: 'Morning',
  saturday: 'Off',
  sunday: 'Off'
};

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    employeeName: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    department: 'HR',
    status: 'Clocked In',
    clockInTime: '08:50 AM',
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: '4h 15m',
    lastLocation: 'HQ Office - Desktop app',
    hasShiftToday: true,
    weeklySchedule: defaultSchedule
  },
  {
    id: '2',
    employeeName: 'James Mwangi',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    department: 'Engineering',
    status: 'Late',
    clockInTime: '09:45 AM',
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 45,
    totalWorkedToday: '3h 20m',
    lastLocation: 'Mobile App',
    hasShiftToday: true,
    weeklySchedule: { ...defaultSchedule, tuesday: 'Evening' }
  },
  {
    id: '3',
    employeeName: 'Amina Hassan',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    department: 'Marketing',
    status: 'Clocked Out',
    clockInTime: '08:45 AM',
    clockOutTime: '01:30 PM',
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: '4h 45m',
    lastLocation: 'HQ Office',
    hasShiftToday: true,
    weeklySchedule: defaultSchedule
  },
  {
    id: '4',
    employeeName: 'David Kimani',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    department: 'Sales',
    status: 'Missing',
    clockInTime: null,
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: null,
    lastLocation: null,
    hasShiftToday: true,
    weeklySchedule: defaultSchedule
  },
  {
    id: '5',
    employeeName: 'Grace Otieno',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    department: 'Finance',
    status: 'Missing', // Even if data says missing, if hasShiftToday is false, it shouldn't show in live tracker
    clockInTime: null,
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: null,
    lastLocation: null,
    hasShiftToday: false, // OFF TODAY
    weeklySchedule: { ...defaultSchedule, tuesday: 'Off', wednesday: 'Off' }
  },
  {
    id: '6',
    employeeName: 'Brian Ochieng',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    department: 'Product',
    status: 'Late',
    clockInTime: '09:15 AM',
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 15,
    totalWorkedToday: '3h 50m',
    lastLocation: 'Web app',
    hasShiftToday: true,
    weeklySchedule: defaultSchedule
  },
  {
    id: '7',
    employeeName: 'Fatuma Ali',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
    department: 'Support',
    status: 'Clocked In',
    clockInTime: '22:00 PM',
    clockOutTime: null,
    expectedStartTime: '22:00 PM',
    latenessMinutes: 0,
    totalWorkedToday: '1h 00m',
    lastLocation: 'Remote',
    hasShiftToday: true,
    weeklySchedule: { ...defaultSchedule, monday: 'Night', tuesday: 'Night', wednesday: 'Night', thursday: 'Night', friday: 'Night' }
  },
];
