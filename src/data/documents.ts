export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'Signed' | 'Pending' | 'Draft' | 'Expired';
  sentDate: string;
  signedDate?: string;
  signee: string;
  avatar: string;
  folder: 'Offer Letters' | 'Policies' | 'Tax Forms' | 'Contracts' | 'Certifications';
}

export const documents: Document[] = [
  {
    id: 'd1',
    name: 'Employment Contract - James Mwangi.pdf',
    type: 'PDF',
    status: 'Pending',
    sentDate: 'Sep 1, 2026',
    signee: 'James Mwangi',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    folder: 'Contracts',
  },
  {
    id: 'd2',
    name: 'Employee Handbook Acknowledgement.pdf',
    type: 'PDF',
    status: 'Pending',
    sentDate: 'Sep 1, 2026',
    signee: 'James Mwangi',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    folder: 'Policies',
  },
  {
    id: 'd3',
    name: 'Confidentiality Agreement.pdf',
    type: 'PDF',
    status: 'Signed',
    sentDate: 'Aug 20, 2026',
    signedDate: 'Aug 21, 2026',
    signee: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    folder: 'Contracts',
  },
  {
    id: 'd4',
    name: 'Q3 Bonus Scheme Letter.pdf',
    type: 'PDF',
    status: 'Draft',
    sentDate: '--',
    signee: 'All Employees',
    avatar: '',
    folder: 'Offer Letters',
  },
  {
    id: 'd5',
    name: 'First Aid Certification.pdf',
    type: 'PDF',
    status: 'Expired',
    sentDate: 'Jan 15, 2024',
    signedDate: 'Jan 16, 2024',
    signee: 'Peter Njoroge',
    avatar: 'https://randomuser.me/api/portraits/men/71.jpg',
    folder: 'Certifications',
  }
];
