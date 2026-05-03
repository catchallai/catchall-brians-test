/**
 * Department-based RBAC system
 * Maps departments to accessible modules
 */

export const DEPARTMENTS = [
  'Business Dev',
  'Sales',
  'Marketing',
  'Human Resources',
  'Legal',
  'Finance',
  'Engineering',
  'Information Technology',
  'Admin',
  'SuperAdmin',
];

// Module groupings for easier management
const MODULES = {
  BUS_DEV: ['Business Dev'],
  CRM: ['CRM', 'Marketing'],
  SALES: ['Sales'],
  CUSTOMER_SUCCESS: ['Customer Success'],
  TEAM_COLLAB: ['Team Collaboration'],
  DOCUMENTATION: ['Documentation'],
  COMMUNICATIONS: ['Communications'],
  PROFILE: ['Profile Settings'],
  HRIS: ['HRIS'],
  PEOPLE_OPS: ['People Ops'],
  CULTURE: ['Culture'],
  TALENT: ['Talent'],
  COMPLIANCE: ['Compliance'],
  LEGAL: ['Legal'],
  FINANCE: ['Finance'],
  PAYMENTS: ['Payments'],
  SUPPORT: ['Support'],
  AI_TOOLS: ['AI Tools'],
  ASSETS: ['Assets'],
  SEO: ['SEO'],
  WEB: ['Web'],
  SOCIAL: ['Social'],
  EXECUTIVE: ['Executive Dashboard'],
};

/**
 * Department Permission Map
 * Defines which modules each department can access
 */
export const DEPARTMENT_PERMISSIONS = {
  'Business Dev': [
    'Bus Dev',
    'CRM',
    'SALES',
    'Customer Success',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
  ],
  'Sales': [
    'CRM',
    'SALES',
    'Customer Success',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
  ],
  'Marketing': [
    'CRM',
    'Customer Success',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'SEO',
    'Marketing',
    'Web',
    'Social',
    'Assets',
  ],
  'Human Resources': [
    'HRIS',
    'People Ops',
    'Culture',
    'Talent',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'Compliance',
  ],
  'Legal': [
    'Bus Dev',
    'Legal',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'Compliance',
  ],
  'Finance': [
    'Finance',
    'SALES',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'Payments',
  ],
  'Engineering': [
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
  ],
  'Information Technology': [
    'Support',
    'AI Tools',
    'Assets',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'Compliance',
  ],
  'Admin': [
    // All modules EXCEPT: Financial Data, Payroll, Employee Payroll Data
    'Bus Dev',
    'CRM',
    'SALES',
    'Customer Success',
    'HRIS', // Excluding payroll operations
    'People Ops',
    'Culture',
    'Talent',
    'Legal',
    'Compliance',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'SEO',
    'Marketing',
    'Web',
    'Social',
    'Assets',
    'AI Tools',
  ],
  'SuperAdmin': [
    // All modules EXCEPT: Support
    'Bus Dev',
    'CRM',
    'SALES',
    'Customer Success',
    'HRIS',
    'People Ops',
    'Culture',
    'Talent',
    'Legal',
    'Finance',
    'Compliance',
    'Team Collaboration',
    'Documentation',
    'Communications',
    'Profile Settings',
    'SEO',
    'Marketing',
    'Web',
    'Social',
    'Assets',
    'AI Tools',
    'Executive Dashboard',
    'Payments',
  ],
};

/**
 * Check if a user has access to a module based on their department
 */
export function hasModuleAccess(department, moduleName) {
  if (!department || !DEPARTMENT_PERMISSIONS[department]) {
    return false;
  }
  return DEPARTMENT_PERMISSIONS[department].includes(moduleName);
}

/**
 * Get all modules accessible by a department
 */
export function getDepartmentModules(department) {
  return DEPARTMENT_PERMISSIONS[department] || [];
}

/**
 * Check if user has financial data access (Admins and SuperAdmins cannot access payroll/financial data)
 */
export function canAccessFinancialData(role) {
  // Only SuperAdmin at Executive level can view all financial data
  // Regular Admins have limited access (no payroll/employee payroll)
  return role === 'SuperAdmin';
}

/**
 * Check if user can access payroll
 */
export function canAccessPayroll(role, department) {
  // Only Finance department and SuperAdmin can access payroll
  return department === 'Finance' || role === 'SuperAdmin';
}