import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_PERMISSIONS } from '@/lib/departmentPermissions';

export default function DepartmentPermissionsManager() {
  const [selectedDept, setSelectedDept] = useState('Business Dev');

  const deptModules = DEPARTMENT_PERMISSIONS[selectedDept] || [];

  const departmentDescriptions = {
    'Business Dev':
      'Business development team - full access to business operations and customer success',
    'Sales': 'Sales team - access to CRM, sales pipeline, and customer success',
    'Marketing': 'Marketing team - access to marketing tools, SEO, social, and web analytics',
    'Human Resources': 'HR team - access to all people management and talent systems',
    'Legal': 'Legal team - access to legal documents, compliance, and business dev',
    'Finance': 'Finance team - access to financial systems, payroll, and transactions',
    'Engineering': 'Engineering team - access to documentation and collaboration tools',
    'Information Technology': 'IT team - access to support, AI tools, compliance, and assets',
    'Admin':
      'Administrators - access to all modules except financial data, payroll, and employee payroll',
    'SuperAdmin':
      'Super administrators - executive level access to all modules except support',
  };

  const moduleDescriptions = {
    'Bus Dev': 'Business development and opportunity management',
    'CRM': 'Customer relationship management',
    'SALES': 'Sales pipeline, deals, and forecasting',
    'Customer Success': 'Customer success and account management',
    'HRIS': 'Human resources information system',
    'People Ops': 'People operations and HR processes',
    'Culture': 'Company culture and recognition programs',
    'Talent': 'Talent management, training, and development',
    'Legal': 'Legal matters, documents, and litigation',
    'Finance': 'Financial planning, budgets, and transactions',
    'Compliance': 'Compliance policies, training, and audits',
    'Team Collaboration': 'Team projects, communication, and collaboration',
    'Documentation': 'Wikis, spaces, and knowledge base',
    'Communications': 'ICS messaging and communications',
    'Profile Settings': 'Personal profile and account settings',
    'SEO': 'Search engine optimization tools',
    'Marketing': 'Marketing campaigns and analytics',
    'Web': 'Web analytics and landing pages',
    'Social': 'Social media management',
    'Assets': 'Media library and asset management',
    'AI Tools': 'AI-powered features and assistants',
    'Executive Dashboard': 'Executive-level reporting and insights',
    'Payments': 'Payment processing and billing',
    'Support': 'Support tickets and customer service',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Department-Based Access Control</h2>
        <p className="text-gray-600 dark:text-gray-400">
          View module permissions for each department. Permissions are automatically assigned based on department membership.
        </p>
      </div>

      <Tabs value={selectedDept} onValueChange={setSelectedDept} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          {DEPARTMENTS.map((dept) => (
            <TabsTrigger key={dept} value={dept} className="text-xs lg:text-sm">
              {dept.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {DEPARTMENTS.map((dept) => (
          <TabsContent key={dept} value={dept} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{dept}</CardTitle>
                <CardDescription>{departmentDescriptions[dept]}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Accessible Modules ({DEPARTMENT_PERMISSIONS[dept].length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(moduleDescriptions).map(([moduleName, description]) => {
                      const hasAccess = DEPARTMENT_PERMISSIONS[dept].includes(moduleName);
                      return (
                        <div
                          key={moduleName}
                          className={`p-3 rounded-lg border transition-all ${
                            hasAccess
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {hasAccess ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{moduleName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Restrictions */}
            {(dept === 'Admin' || dept === 'SuperAdmin') && (
              <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <CardHeader>
                  <CardTitle className="text-base">Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {dept === 'Admin' && (
                    <>
                      <p>
                        <strong>Cannot access:</strong> Financial data, Payroll operations, Employee payroll data
                      </p>
                    </>
                  )}
                  {dept === 'SuperAdmin' && (
                    <>
                      <p>
                        <strong>Cannot access:</strong> Support Module
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        SuperAdmins have executive-level access to all other modules
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">How Department Permissions Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Users are assigned a department during onboarding. Their module access is automatically determined by their
            department membership.
          </p>
          <p>
            <strong>Key Features:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All departments have access to Team Collaboration, Documentation, Communications, and Profile Settings</li>
            <li>Admins cannot access financial/payroll data for audit and compliance reasons</li>
            <li>SuperAdmins have executive-level visibility except for the Support module</li>
            <li>Finance department has exclusive access to Payments and payroll systems</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}