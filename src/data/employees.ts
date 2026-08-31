// Dummy employee data with randomuser.me avatars
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  title: string;
  department: string;
  division: string;
  location: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  hireDate: string;
  employeeNumber: string;
  manager?: string;
  avatar: string;
  gender: string;
  birthDate: string;
  compensation: string;
  payType: 'Salary' | 'Hourly';
  directReports?: string[];
}

export const employees: Employee[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'HR Administrator',
    department: 'Human Resources',
    division: 'Operations',
    location: 'Nairobi, Kenya',
    email: 'sarah.johnson@easyhr.co',
    phone: '+254 700 123 456',
    status: 'Active',
    hireDate: '2022-03-15',
    employeeNumber: '001',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    gender: 'Female',
    birthDate: '1990-07-12',
    compensation: 'KES 180,000 / Year',
    payType: 'Salary',
    directReports: ['2', '3'],
  },
  {
    id: '2',
    firstName: 'James',
    lastName: 'Mwangi',
    title: 'Software Engineer',
    department: 'Engineering',
    division: 'Technology',
    location: 'Nairobi, Kenya',
    email: 'james.mwangi@easyhr.co',
    phone: '+254 700 234 567',
    status: 'Active',
    hireDate: '2023-01-10',
    employeeNumber: '002',
    manager: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    gender: 'Male',
    birthDate: '1995-03-22',
    compensation: 'KES 220,000 / Year',
    payType: 'Salary',
  },
  {
    id: '3',
    firstName: 'Amina',
    lastName: 'Hassan',
    title: 'Marketing Manager',
    department: 'Marketing',
    division: 'Commercial',
    location: 'Mombasa, Kenya',
    email: 'amina.hassan@easyhr.co',
    phone: '+254 700 345 678',
    status: 'Active',
    hireDate: '2021-08-20',
    employeeNumber: '003',
    manager: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    gender: 'Female',
    birthDate: '1988-11-05',
    compensation: 'KES 195,000 / Year',
    payType: 'Salary',
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Kimani',
    title: 'Sales Representative',
    department: 'Sales',
    division: 'Commercial',
    location: 'Kisumu, Kenya',
    email: 'david.kimani@easyhr.co',
    phone: '+254 700 456 789',
    status: 'Active',
    hireDate: '2024-02-01',
    employeeNumber: '004',
    manager: 'Amina Hassan',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    gender: 'Male',
    birthDate: '1997-06-18',
    compensation: 'KES 120,000 / Year',
    payType: 'Salary',
  },
  {
    id: '5',
    firstName: 'Grace',
    lastName: 'Otieno',
    title: 'Finance Analyst',
    department: 'Finance',
    division: 'Operations',
    location: 'Nairobi, Kenya',
    email: 'grace.otieno@easyhr.co',
    phone: '+254 700 567 890',
    status: 'On Leave',
    hireDate: '2022-11-14',
    employeeNumber: '005',
    manager: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    gender: 'Female',
    birthDate: '1993-09-30',
    compensation: 'KES 165,000 / Year',
    payType: 'Salary',
  },
  {
    id: '6',
    firstName: 'Brian',
    lastName: 'Ochieng',
    title: 'UX Designer',
    department: 'Product',
    division: 'Technology',
    location: 'Nairobi, Kenya',
    email: 'brian.ochieng@easyhr.co',
    phone: '+254 700 678 901',
    status: 'Active',
    hireDate: '2023-05-22',
    employeeNumber: '006',
    manager: 'James Mwangi',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    gender: 'Male',
    birthDate: '1996-01-14',
    compensation: 'KES 175,000 / Year',
    payType: 'Salary',
  },
  {
    id: '7',
    firstName: 'Fatuma',
    lastName: 'Ali',
    title: 'Customer Support Lead',
    department: 'Customer Success',
    division: 'Commercial',
    location: 'Nairobi, Kenya',
    email: 'fatuma.ali@easyhr.co',
    phone: '+254 700 789 012',
    status: 'Active',
    hireDate: '2020-06-01',
    employeeNumber: '007',
    manager: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
    gender: 'Female',
    birthDate: '1987-04-25',
    compensation: 'KES 145,000 / Year',
    payType: 'Salary',
  },
  {
    id: '8',
    firstName: 'Peter',
    lastName: 'Njoroge',
    title: 'DevOps Engineer',
    department: 'Engineering',
    division: 'Technology',
    location: 'Nairobi, Kenya',
    email: 'peter.njoroge@easyhr.co',
    phone: '+254 700 890 123',
    status: 'Active',
    hireDate: '2023-09-11',
    employeeNumber: '008',
    manager: 'James Mwangi',
    avatar: 'https://randomuser.me/api/portraits/men/71.jpg',
    gender: 'Male',
    birthDate: '1991-12-03',
    compensation: 'KES 240,000 / Year',
    payType: 'Salary',
  },
];

export const currentEmployee = employees[1]; // James Mwangi - Employee view
export const currentManager = employees[2];  // Amina Hassan - Manager view
export const currentHRAdmin = employees[0];  // Sarah Johnson - HR Admin view
