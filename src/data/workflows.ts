export const workflows = [
  { id: 1, name: 'Time-off approval', category: 'Time Off', trigger: 'Request submitted', steps: 2, owner: 'People Ops', status: 'Active', runs: 38 },
  { id: 2, name: 'Equipment request', category: 'Operations', trigger: 'Form submitted', steps: 3, owner: 'IT Operations', status: 'Active', runs: 11 },
  { id: 3, name: 'Compensation adjustment', category: 'People', trigger: 'Change proposed', steps: 3, owner: 'HR Director', status: 'Draft', runs: 0 },
  { id: 4, name: 'Policy exception', category: 'Compliance', trigger: 'Exception requested', steps: 2, owner: 'People Ops', status: 'Active', runs: 6 },
];

export const approvals = [
  { id: 1, person: 'Sarah Johnson', request: 'Annual leave · 3 days', workflow: 'Time-off approval', age: '2h', priority: 'Normal' },
  { id: 2, person: 'Daniel Okello', request: 'MacBook Pro replacement', workflow: 'Equipment request', age: '5h', priority: 'High' },
  { id: 3, person: 'Amina Nsubuga', request: 'Remote work exception', workflow: 'Policy exception', age: '1d', priority: 'Normal' },
];
