export type AttendanceStatus = 'Clocked In' | 'Clocked Out' | 'Late' | 'Missing';

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
  totalWorkedToday: string | null; // e.g., "6h 12m"
  lastLocation: string | null; // "HQ Office - WiFi"
}

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
    lastLocation: 'HQ Office - Desktop app'
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
    lastLocation: 'Mobile App - Geo: -1.2921, 36.8219'
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
    lastLocation: 'HQ Office - Web app'
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
    lastLocation: null
  },
  {
    id: '5',
    employeeName: 'Grace Otieno',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    department: 'Finance',
    status: 'Clocked In',
    clockInTime: '08:30 AM',
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: '4h 35m',
    lastLocation: 'HQ Office - WiFi'
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
    lastLocation: 'Web app'
  },
  {
    id: '7',
    employeeName: 'Fatuma Ali',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
    department: 'Support',
    status: 'Clocked In',
    clockInTime: '08:58 AM',
    clockOutTime: null,
    expectedStartTime: '09:00 AM',
    latenessMinutes: 0,
    totalWorkedToday: '4h 07m',
    lastLocation: 'HQ Office - Desktop app'
  },
];
