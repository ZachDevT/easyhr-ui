export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  category: 'IT Setup' | 'HR' | 'Facilities' | 'Training' | 'Documents';
  done: boolean;
}

export interface OnboardingEmployee {
  id: string;
  name: string;
  role: string;
  startDate: string;
  avatar: string;
  progress: number;
  tasks: OnboardingTask[];
}

export const onboardingEmployees: OnboardingEmployee[] = [
  {
    id: '1',
    name: 'James Mwangi',
    role: 'Software Engineer',
    startDate: 'Sep 8, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    progress: 60,
    tasks: [
      { id: 't1', title: 'Complete personal info form', description: 'Fill in address, emergency contacts, and tax details.', assignedTo: 'James Mwangi', dueDate: 'Sep 1', category: 'HR', done: true },
      { id: 't2', title: 'Sign employment contract', description: 'Review and e-sign your contract via EasyHR.', assignedTo: 'James Mwangi', dueDate: 'Sep 1', category: 'Documents', done: true },
      { id: 't3', title: 'Laptop provisioned', description: 'IT will configure your MacBook Pro with required software.', assignedTo: 'IT Team', dueDate: 'Sep 5', category: 'IT Setup', done: true },
      { id: 't4', title: 'Office access badge', description: 'Pick up your access badge from reception.', assignedTo: 'Facilities', dueDate: 'Sep 8', category: 'Facilities', done: false },
      { id: 't5', title: 'Complete security training', description: 'Finish the online data security course (approx. 1 hour).', assignedTo: 'James Mwangi', dueDate: 'Sep 15', category: 'Training', done: false },
      { id: 't6', title: 'Meet with your manager', description: 'Intro 1:1 with James to align on Q4 goals.', assignedTo: 'Sarah Johnson', dueDate: 'Sep 8', category: 'HR', done: false },
      { id: 't7', title: 'Enroll in benefits', description: 'Select your medical and pension plan options.', assignedTo: 'James Mwangi', dueDate: 'Sep 22', category: 'HR', done: false },
      { id: 't8', title: 'GitHub & Slack access granted', description: 'Invitations sent to company workspace.', assignedTo: 'IT Team', dueDate: 'Sep 5', category: 'IT Setup', done: true },
    ],
  },
  {
    id: '2',
    name: 'Sharon Maina',
    role: 'Marketing Specialist',
    startDate: 'Sep 15, 2026',
    avatar: 'https://randomuser.me/api/portraits/women/77.jpg',
    progress: 25,
    tasks: [
      { id: 't9', title: 'Complete personal info form', description: 'Fill in address, emergency contacts, and tax details.', assignedTo: 'Sharon Maina', dueDate: 'Sep 10', category: 'HR', done: true },
      { id: 't10', title: 'Sign employment contract', description: 'Review and e-sign your contract via EasyHR.', assignedTo: 'Sharon Maina', dueDate: 'Sep 10', category: 'Documents', done: false },
      { id: 't11', title: 'Laptop provisioned', description: 'IT will configure your laptop.', assignedTo: 'IT Team', dueDate: 'Sep 12', category: 'IT Setup', done: false },
      { id: 't12', title: 'Office access badge', description: 'Pick up your access badge from reception.', assignedTo: 'Facilities', dueDate: 'Sep 15', category: 'Facilities', done: false },
    ],
  },
];
