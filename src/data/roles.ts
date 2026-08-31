// Shared roles data — these come from the Departments module
// In a real app this would come from an API/database

export interface Role {
  id: number;
  title: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  department: string;
  reportsTo: string;
  payType: 'Salaried' | 'Hourly';
  currency: string;
  min: string;
  max: string;
}

export const ROLES: Role[] = [
  // Engineering
  { id: 1,  title: 'Junior Frontend Developer',   level: 'Junior',    department: 'Engineering',  reportsTo: 'Frontend Team Lead',      payType: 'Salaried', currency: 'USD', min: '60k',   max: '80k'   },
  { id: 2,  title: 'Frontend Developer',           level: 'Mid',       department: 'Engineering',  reportsTo: 'Frontend Team Lead',      payType: 'Salaried', currency: 'USD', min: '80k',   max: '100k'  },
  { id: 3,  title: 'Senior Frontend Developer',    level: 'Senior',    department: 'Engineering',  reportsTo: 'Frontend Team Lead',      payType: 'Salaried', currency: 'USD', min: '105k',  max: '130k'  },
  { id: 4,  title: 'Frontend Team Lead',           level: 'Lead',      department: 'Engineering',  reportsTo: 'VP Engineering',          payType: 'Salaried', currency: 'USD', min: '120k',  max: '150k'  },
  { id: 5,  title: 'Junior Backend Engineer',      level: 'Junior',    department: 'Engineering',  reportsTo: 'Engineering Manager',     payType: 'Salaried', currency: 'USD', min: '65k',   max: '85k'   },
  { id: 6,  title: 'Backend Engineer',             level: 'Mid',       department: 'Engineering',  reportsTo: 'Engineering Manager',     payType: 'Salaried', currency: 'USD', min: '85k',   max: '110k'  },
  { id: 7,  title: 'Senior Backend Engineer',      level: 'Senior',    department: 'Engineering',  reportsTo: 'Engineering Manager',     payType: 'Salaried', currency: 'USD', min: '110k',  max: '140k'  },
  { id: 8,  title: 'Engineering Manager',          level: 'Lead',      department: 'Engineering',  reportsTo: 'VP Engineering',          payType: 'Salaried', currency: 'USD', min: '130k',  max: '160k'  },
  { id: 9,  title: 'VP Engineering',              level: 'Executive', department: 'Engineering',  reportsTo: 'CEO',                     payType: 'Salaried', currency: 'USD', min: '180k',  max: '240k'  },
  { id: 10, title: 'QA Tester',                   level: 'Mid',       department: 'Engineering',  reportsTo: 'QA Manager',              payType: 'Hourly',   currency: 'CAD', min: '45/hr', max: '65/hr' },
  { id: 11, title: 'Senior QA Engineer',          level: 'Senior',    department: 'Engineering',  reportsTo: 'QA Manager',              payType: 'Hourly',   currency: 'CAD', min: '65/hr', max: '85/hr' },

  // Sales
  { id: 12, title: 'Sales Representative',        level: 'Junior',    department: 'Sales',        reportsTo: 'Sales Manager',           payType: 'Salaried', currency: 'USD', min: '50k',   max: '70k'   },
  { id: 13, title: 'Senior Sales Representative', level: 'Senior',    department: 'Sales',        reportsTo: 'Sales Manager',           payType: 'Salaried', currency: 'USD', min: '75k',   max: '95k'   },
  { id: 14, title: 'Sales Manager',               level: 'Lead',      department: 'Sales',        reportsTo: 'VP Sales',                payType: 'Salaried', currency: 'USD', min: '100k',  max: '130k'  },
  { id: 15, title: 'VP Sales',                    level: 'Executive', department: 'Sales',        reportsTo: 'CEO',                     payType: 'Salaried', currency: 'USD', min: '160k',  max: '210k'  },

  // Product
  { id: 16, title: 'Product Designer',            level: 'Mid',       department: 'Product',      reportsTo: 'Product Manager',         payType: 'Salaried', currency: 'USD', min: '85k',   max: '110k'  },
  { id: 17, title: 'Senior Product Designer',     level: 'Senior',    department: 'Product',      reportsTo: 'Product Manager',         payType: 'Salaried', currency: 'USD', min: '110k',  max: '135k'  },
  { id: 18, title: 'Product Manager',             level: 'Lead',      department: 'Product',      reportsTo: 'VP Product',              payType: 'Salaried', currency: 'USD', min: '120k',  max: '150k'  },
  { id: 19, title: 'Senior Product Manager',      level: 'Senior',    department: 'Product',      reportsTo: 'VP Product',              payType: 'Salaried', currency: 'USD', min: '140k',  max: '170k'  },
  { id: 20, title: 'VP Product',                  level: 'Executive', department: 'Product',      reportsTo: 'CEO',                     payType: 'Salaried', currency: 'USD', min: '170k',  max: '220k'  },

  // Marketing
  { id: 21, title: 'Marketing Specialist',        level: 'Mid',       department: 'Marketing',    reportsTo: 'Marketing Manager',       payType: 'Salaried', currency: 'USD', min: '60k',   max: '80k'   },
  { id: 22, title: 'Senior Marketing Specialist', level: 'Senior',    department: 'Marketing',    reportsTo: 'Marketing Manager',       payType: 'Salaried', currency: 'USD', min: '80k',   max: '100k'  },
  { id: 23, title: 'Marketing Manager',           level: 'Lead',      department: 'Marketing',    reportsTo: 'CMO',                     payType: 'Salaried', currency: 'USD', min: '95k',   max: '125k'  },
  { id: 24, title: 'CMO',                         level: 'Executive', department: 'Marketing',    reportsTo: 'CEO',                     payType: 'Salaried', currency: 'USD', min: '160k',  max: '200k'  },

  // People / HR
  { id: 25, title: 'HR Coordinator',              level: 'Junior',    department: 'People (HR)',  reportsTo: 'HR Manager',              payType: 'Salaried', currency: 'USD', min: '50k',   max: '65k'   },
  { id: 26, title: 'HR Specialist',               level: 'Mid',       department: 'People (HR)',  reportsTo: 'HR Manager',              payType: 'Salaried', currency: 'USD', min: '65k',   max: '85k'   },
  { id: 27, title: 'HR Manager',                  level: 'Lead',      department: 'People (HR)',  reportsTo: 'CHRO',                    payType: 'Salaried', currency: 'USD', min: '90k',   max: '115k'  },
  { id: 28, title: 'CHRO',                        level: 'Executive', department: 'People (HR)',  reportsTo: 'CEO',                     payType: 'Salaried', currency: 'USD', min: '160k',  max: '200k'  },
];

export const LEVEL_ORDER: Record<string, number> = {
  Junior: 1,
  Mid: 2,
  Senior: 3,
  Lead: 4,
  Executive: 5,
};

export const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
  Junior:    { bg: '#F3F4F6', color: '#6B7280' },
  Mid:       { bg: '#EFF6FF', color: '#3B82F6' },
  Senior:    { bg: '#F0FDF4', color: '#22C55E' },
  Lead:      { bg: '#FEF3C7', color: '#D97706' },
  Executive: { bg: '#F5F3FF', color: '#7C3AED' },
};
