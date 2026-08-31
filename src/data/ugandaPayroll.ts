import { UgandaTaxEngine, PayrollInput } from '@/utils/payrollCalc';

export interface PayrollRecord {
  id: string;
  employeeName: string;
  avatar: string;
  department: string;
  baseSalary: number;
  expectedHours: number;
  actualHours: number;
  absentHours: number;
  overtimeHours: number;
  allowances: number;
  bonuses: number;
  // Computed fields
  results: ReturnType<typeof UgandaTaxEngine.calculate>;
}

// Generate realistic mock data based on Ugandan salary averages (UGX)
const rawMockData = [
  { id: '1', name: 'Sarah Johnson', dept: 'HR', baseSalary: 2500000, absentHours: 0, overtimeHours: 5, allowances: 200000, bonuses: 0, avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '2', name: 'James Mwangi', dept: 'Engineering', baseSalary: 5500000, absentHours: 8, overtimeHours: 0, allowances: 300000, bonuses: 500000, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '3', name: 'Amina Hassan', dept: 'Marketing', baseSalary: 3200000, absentHours: 0, overtimeHours: 12, allowances: 150000, bonuses: 0, avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: '4', name: 'David Kimani', dept: 'Sales', baseSalary: 1800000, absentHours: 16, overtimeHours: 0, allowances: 500000, bonuses: 250000, avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { id: '5', name: 'Grace Otieno', dept: 'Finance', baseSalary: 4100000, absentHours: 0, overtimeHours: 0, allowances: 200000, bonuses: 0, avatar: 'https://randomuser.me/api/portraits/women/28.jpg' },
  { id: '6', name: 'Brian Ochieng', dept: 'Product', baseSalary: 3800000, absentHours: 4, overtimeHours: 8, allowances: 100000, bonuses: 0, avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { id: '7', name: 'Fatuma Ali', dept: 'Support', baseSalary: 1200000, absentHours: 0, overtimeHours: 20, allowances: 50000, bonuses: 0, avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
];

export const ugandaPayrollRecords: PayrollRecord[] = rawMockData.map(emp => {
  const input: PayrollInput = {
    baseSalary: emp.baseSalary,
    allowances: emp.allowances,
    bonuses: emp.bonuses,
    absentHours: emp.absentHours,
    overtimeHours: emp.overtimeHours
  };

  const results = UgandaTaxEngine.calculate(input);

  return {
    id: emp.id,
    employeeName: emp.name,
    avatar: emp.avatar,
    department: emp.dept,
    baseSalary: emp.baseSalary,
    expectedHours: UgandaTaxEngine.config.standardMonthlyHours,
    actualHours: UgandaTaxEngine.config.standardMonthlyHours - emp.absentHours + emp.overtimeHours,
    absentHours: emp.absentHours,
    overtimeHours: emp.overtimeHours,
    allowances: emp.allowances,
    bonuses: emp.bonuses,
    results
  };
});

// Compute grand totals for the dashboard
export const payrollTotals = ugandaPayrollRecords.reduce((acc, record) => {
  acc.totalGross += record.results.adjustedGross;
  acc.totalNet += record.results.netPay;
  acc.totalNssfEmployee += record.results.nssfEmployee;
  acc.totalNssfEmployer += record.results.nssfEmployer;
  acc.totalPaye += record.results.paye;
  acc.totalLst += record.results.lst;
  acc.totalEmployerCost += record.results.totalEmployerCost;
  return acc;
}, {
  totalGross: 0,
  totalNet: 0,
  totalNssfEmployee: 0,
  totalNssfEmployer: 0,
  totalPaye: 0,
  totalLst: 0,
  totalEmployerCost: 0
});
