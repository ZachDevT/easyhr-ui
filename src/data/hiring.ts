export interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: 'Applied' | 'Screen' | 'Interview' | 'Offer' | 'Hired';
  avatar: string;
  appliedDate: string;
  rating?: number;
  source: string;
  email: string;
  phone: string;
  location: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-Time' | 'Part-Time' | 'Contract';
  status: 'Open' | 'Draft' | 'Closed';
  postedDate: string;
  applicants: number;
}

export const jobOpenings: JobOpening[] = [
  { id: '1', title: 'Senior Software Engineer', department: 'Engineering', location: 'Nairobi', type: 'Full-Time', status: 'Open', postedDate: 'Aug 15, 2026', applicants: 24 },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'Remote', type: 'Full-Time', status: 'Open', postedDate: 'Aug 20, 2026', applicants: 18 },
  { id: '3', title: 'Marketing Specialist', department: 'Marketing', location: 'Nairobi', type: 'Full-Time', status: 'Open', postedDate: 'Aug 25, 2026', applicants: 12 },
  { id: '4', title: 'Sales Executive', department: 'Sales', location: 'Mombasa', type: 'Full-Time', status: 'Draft', postedDate: '--', applicants: 0 },
];

export const candidates: Candidate[] = [
  // Applied
  { id: 'c1', name: 'Kevin Ouma', role: 'Senior Software Engineer', stage: 'Applied', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', appliedDate: 'Aug 28', source: 'LinkedIn', email: 'kevin@email.com', phone: '+254 700 111', location: 'Nairobi' },
  { id: 'c2', name: 'Lilian Ndegwa', role: 'Senior Software Engineer', stage: 'Applied', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', appliedDate: 'Aug 29', source: 'Referral', email: 'lilian@email.com', phone: '+254 700 222', location: 'Nairobi' },
  { id: 'c3', name: 'Moses Kamau', role: 'Product Manager', stage: 'Applied', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', appliedDate: 'Aug 30', source: 'Website', email: 'moses@email.com', phone: '+254 700 333', location: 'Remote' },
  // Screen
  { id: 'c4', name: 'Wanjiru Karanja', role: 'Senior Software Engineer', stage: 'Screen', avatar: 'https://randomuser.me/api/portraits/women/55.jpg', appliedDate: 'Aug 20', source: 'LinkedIn', email: 'wanjiru@email.com', phone: '+254 700 444', location: 'Nairobi' },
  { id: 'c5', name: 'Ali Abdow', role: 'Product Manager', stage: 'Screen', avatar: 'https://randomuser.me/api/portraits/men/66.jpg', appliedDate: 'Aug 22', source: 'Website', email: 'ali@email.com', phone: '+254 700 555', location: 'Nairobi' },
  // Interview
  { id: 'c6', name: 'Sharon Maina', role: 'Marketing Specialist', stage: 'Interview', avatar: 'https://randomuser.me/api/portraits/women/77.jpg', appliedDate: 'Aug 15', rating: 4, source: 'Referral', email: 'sharon@email.com', phone: '+254 700 666', location: 'Nairobi' },
  { id: 'c7', name: 'Collins Ogola', role: 'Senior Software Engineer', stage: 'Interview', avatar: 'https://randomuser.me/api/portraits/men/88.jpg', appliedDate: 'Aug 16', rating: 5, source: 'LinkedIn', email: 'collins@email.com', phone: '+254 700 777', location: 'Nairobi' },
  // Offer
  { id: 'c8', name: 'Asha Diriye', role: 'Product Manager', stage: 'Offer', avatar: 'https://randomuser.me/api/portraits/women/19.jpg', appliedDate: 'Aug 5', rating: 5, source: 'Referral', email: 'asha@email.com', phone: '+254 700 888', location: 'Nairobi' },
  // Hired
  { id: 'c9', name: 'Tom Mutua', role: 'Marketing Specialist', stage: 'Hired', avatar: 'https://randomuser.me/api/portraits/men/13.jpg', appliedDate: 'Jul 28', rating: 4, source: 'Website', email: 'tom@email.com', phone: '+254 700 999', location: 'Mombasa' },
];
