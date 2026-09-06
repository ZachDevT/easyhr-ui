export const permissionRoles = [
  { name: 'HR Admin', people: 3, scope: 'Full company', level: 'Full access', color: 'var(--primary)' },
  { name: 'Manager', people: 14, scope: 'Direct reports', level: 'Team access', color: 'var(--success)' },
  { name: 'Employee', people: 107, scope: 'Own records', level: 'Self-service', color: 'var(--warning)' },
];
export const permissionAreas = ['Employee records', 'Compensation', 'Payroll', 'Time off', 'Performance', 'Documents'];
export const documents = [
  { title: 'Employment Agreement', person: 'Sarah Johnson', category: 'Contracts', updated: 'Aug 28, 2026', status: 'Current', expires: '—' },
  { title: 'National ID', person: 'Daniel Okello', category: 'Identity', updated: 'Aug 26, 2026', status: 'Expiring', expires: 'Sep 19, 2026' },
  { title: 'Data Protection Certificate', person: 'Amina Nsubuga', category: 'Certification', updated: 'Aug 22, 2026', status: 'Current', expires: 'Mar 14, 2027' },
  { title: 'Work Permit', person: 'James Mwangi', category: 'Compliance', updated: 'Aug 18, 2026', status: 'Action needed', expires: 'Sep 08, 2026' },
];
export const inboxItems = [
  { id: 1, title: 'Annual leave · 3 days', person: 'Sarah Johnson', source: 'Time Off', time: '12 min ago', urgency: 'Normal' },
  { id: 2, title: 'Compensation adjustment', person: 'Daniel Okello', source: 'People', time: '1h ago', urgency: 'High' },
  { id: 3, title: 'Equipment replacement', person: 'Amina Nsubuga', source: 'Operations', time: '3h ago', urgency: 'Normal' },
];
export const offboardings = [
  { person: 'Michael Kato', role: 'Account Executive', lastDay: 'Sep 12, 2026', progress: 68, owner: 'Grace Atim', risk: 'On track' },
  { person: 'Joan Namusoke', role: 'Operations Associate', lastDay: 'Sep 05, 2026', progress: 42, owner: 'Amina Nsubuga', risk: 'At risk' },
  { person: 'Peter Ochieng', role: 'Frontend Engineer', lastDay: 'Aug 30, 2026', progress: 100, owner: 'Grace Atim', risk: 'Complete' },
];
export const shifts = [
  { person: 'Sarah Johnson', initials: 'SJ', shifts: ['08:00–17:00', '08:00–17:00', 'Remote', '08:00–17:00', '08:00–15:00'] },
  { person: 'Daniel Okello', initials: 'DO', shifts: ['07:00–16:00', '07:00–16:00', '07:00–16:00', 'Off', '07:00–16:00'] },
  { person: 'Amina Nsubuga', initials: 'AN', shifts: ['09:00–18:00', 'Remote', '09:00–18:00', '09:00–18:00', '09:00–18:00'] },
  { person: 'James Mwangi', initials: 'JM', shifts: ['Off', '10:00–19:00', '10:00–19:00', '10:00–19:00', '10:00–19:00'] },
];
