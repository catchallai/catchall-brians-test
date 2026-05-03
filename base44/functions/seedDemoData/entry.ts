import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const d = (daysAgo) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().split('T')[0];
};

const dt = (daysAgo) => {
  const x = new Date();
  x.setDate(x.getDate() - daysAgo);
  return x.toISOString();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const results = {};

    // ─── COMPANY SETTINGS ─────────────────────────────────────────────────
    const existingSettings = await base44.asServiceRole.entities.CompanySettings.list();
    if (existingSettings.length === 0) {
      await base44.asServiceRole.entities.CompanySettings.create({
        company_name: 'AeroTech Industries',
        tagline: 'Advanced aerospace solutions and compliance',
        primary_color: '#7c3aed',
        industry: 'aerospace',
        scanner_label: 'Aerospace Intelligence Scanner',
        support_email: 'compliance@aerotech.io',
      });
    }

    // ─── CONTACTS ─────────────────────────────────────────────────────────
    const existingContacts = await base44.asServiceRole.entities.Contact.list();
    if (existingContacts.length < 5) {
      await base44.asServiceRole.entities.Contact.bulkCreate([
        { first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@aerotech.io', company_name: 'AeroTech Industries', job_title: 'VP of Compliance', status: 'customer', country: 'USA', hq_city: 'San Francisco', phone: '415-555-0101', tags: ['vip', 'compliance'], last_contacted: dt(2) },
        { first_name: 'Michael', last_name: 'Johnson', email: 'michael.johnson@aerotech.io', company_name: 'AeroTech Industries', job_title: 'Security Director', status: 'customer', country: 'USA', hq_city: 'New York', phone: '212-555-0102', tags: ['security'], last_contacted: dt(5) },
        { first_name: 'Emma', last_name: 'Davis', email: 'emma.davis@skylogix.com', company_name: 'SkyLogix Aviation', job_title: 'Operations Manager', status: 'prospect', country: 'USA', hq_city: 'Dallas', phone: '214-555-0103', tags: ['aviation'], last_contacted: dt(10) },
        { first_name: 'Carlos', last_name: 'Martinez', email: 'carlos.m@defenseplus.com', company_name: 'Defense Plus', job_title: 'CTO', status: 'lead', country: 'USA', hq_city: 'Washington DC', phone: '202-555-0104', tags: ['defense'], last_contacted: dt(3) },
        { first_name: 'Ling', last_name: 'Wei', email: 'ling.wei@orbitdynamics.com', company_name: 'Orbit Dynamics', job_title: 'CEO', status: 'prospect', country: 'USA', hq_city: 'Los Angeles', phone: '310-555-0105', tags: ['aerospace', 'vip'], last_contacted: dt(1) },
        { first_name: 'James', last_name: 'Holloway', email: 'james.h@raptorair.com', company_name: 'Raptor Air', job_title: 'VP Sales', status: 'customer', country: 'USA', hq_city: 'Atlanta', phone: '404-555-0106', tags: ['aviation'], last_contacted: dt(7) },
        { first_name: 'Priya', last_name: 'Kapoor', email: 'priya.k@stellartech.io', company_name: 'Stellar Tech', job_title: 'Director of Engineering', status: 'lead', country: 'USA', hq_city: 'Austin', phone: '512-555-0107', tags: ['tech'], last_contacted: dt(14) },
        { first_name: 'Robert', last_name: 'Blake', email: 'r.blake@nationalaero.gov', company_name: 'National Aerospace Agency', job_title: 'Program Director', status: 'customer', country: 'USA', hq_city: 'Houston', phone: '713-555-0108', tags: ['government', 'vip'], last_contacted: dt(4) },
        { first_name: 'Nadia', last_name: 'Okonkwo', email: 'nadia.o@stratusfleet.com', company_name: 'Stratus Fleet', job_title: 'Procurement Lead', status: 'prospect', country: 'USA', hq_city: 'Chicago', phone: '312-555-0109', tags: ['procurement'], last_contacted: dt(20) },
        { first_name: 'David', last_name: 'Park', email: 'd.park@vertexsystems.io', company_name: 'Vertex Systems', job_title: 'Chief Compliance Officer', status: 'customer', country: 'USA', hq_city: 'Seattle', phone: '206-555-0110', tags: ['compliance', 'vip'], last_contacted: dt(6) },
      ]);
      results.contacts = 'seeded 10';
    }

    // ─── DEALS ────────────────────────────────────────────────────────────
    const existingDeals = await base44.asServiceRole.entities.Deal.list();
    if (existingDeals.length < 5) {
      await base44.asServiceRole.entities.Deal.bulkCreate([
        { title: 'SOC 2 Compliance Package - Enterprise', value: 150000, stage: 'negotiation', probability: 75, expected_close_date: d(-15), owner_email: user.email, description: 'Full SOC 2 Type II implementation' },
        { title: 'CMMC Level 3 Implementation', value: 200000, stage: 'proposal', probability: 60, expected_close_date: d(-45), owner_email: user.email, description: 'Defense contractor CMMC certification' },
        { title: 'Aerospace Scanner Annual License', value: 85000, stage: 'won', probability: 100, expected_close_date: d(30), owner_email: user.email },
        { title: 'HRIS + Payroll Integration', value: 45000, stage: 'qualified', probability: 40, expected_close_date: d(-60), owner_email: user.email },
        { title: 'Export Control Training Program', value: 32000, stage: 'lead', probability: 20, expected_close_date: d(-90), owner_email: user.email },
        { title: 'Data Room Enterprise Tier', value: 120000, stage: 'proposal', probability: 55, expected_close_date: d(-30), owner_email: user.email },
        { title: 'Legal Document Automation', value: 67000, stage: 'negotiation', probability: 80, expected_close_date: d(-10), owner_email: user.email },
        { title: 'Platform Full Suite - 3yr', value: 450000, stage: 'proposal', probability: 45, expected_close_date: d(-75), owner_email: user.email },
        { title: 'CRM + Sales Hub Onboarding', value: 28000, stage: 'won', probability: 100, expected_close_date: d(60), owner_email: user.email },
        { title: 'Marketing Automation Suite', value: 55000, stage: 'lost', probability: 0, expected_close_date: d(45), lost_reason: 'Chose competitor with lower price', owner_email: user.email },
      ]);
      results.deals = 'seeded 10';
    }

    // ─── VENDORS ──────────────────────────────────────────────────────────
    const existingVendors = await base44.asServiceRole.entities.Vendor.list();
    if (existingVendors.length < 5) {
      await base44.asServiceRole.entities.Vendor.bulkCreate([
        { name: 'CloudSecure Solutions', type: 'vendor', email: 'support@cloudsecure.io', category: 'Software', status: 'active', total_spend: 45000, payment_terms: 'Net 30' },
        { name: 'AuditPro Consulting', type: 'contractor', email: 'hello@auditpro.com', category: 'Services', status: 'active', total_spend: 78500, payment_terms: 'Net 45' },
        { name: 'DataShield Encryption', type: 'vendor', email: 'sales@datashield.io', category: 'Software', status: 'active', total_spend: 32000, payment_terms: 'Net 30' },
        { name: 'Vertex Legal Group', type: 'partner', email: 'contracts@vertexlegal.com', category: 'Legal Services', status: 'active', total_spend: 120000, payment_terms: 'Net 60' },
        { name: 'TechForce Staffing', type: 'contractor', email: 'hr@techforce.io', category: 'Staffing', status: 'active', total_spend: 65000, payment_terms: 'Net 15' },
        { name: 'AWSCloud Enterprise', type: 'vendor', email: 'enterprise@aws.com', category: 'Infrastructure', status: 'active', total_spend: 210000, payment_terms: 'Net 30' },
        { name: 'NetSuite ERP', type: 'vendor', email: 'support@netsuite.com', category: 'Software', status: 'active', total_spend: 48000, payment_terms: 'Annual' },
        { name: 'OfficePrime Inc', type: 'supplier', email: 'orders@officeprime.com', category: 'Office Supplies', status: 'active', total_spend: 8200, payment_terms: 'Net 30' },
      ]);
      results.vendors = 'seeded 8';
    }

    // ─── FINANCE TRANSACTIONS ─────────────────────────────────────────────
    const existingTx = await base44.asServiceRole.entities.FinanceTransaction.list();
    if (existingTx.length < 10) {
      await base44.asServiceRole.entities.FinanceTransaction.bulkCreate([
        { date: d(0), description: 'Software subscription - CloudSecure', type: 'expense', category: 'SaaS', amount: -3750, department: 'Security', status: 'cleared', vendor_or_client: 'CloudSecure Solutions', account: 'operating' },
        { date: d(1), description: 'Compliance audit consulting', type: 'expense', category: 'Services', amount: -12500, department: 'Compliance', status: 'cleared', vendor_or_client: 'AuditPro Consulting', account: 'operating' },
        { date: d(2), description: 'Customer payment - SOC2 Package', type: 'revenue', category: 'Professional Services', amount: 150000, department: 'Sales', status: 'cleared', vendor_or_client: 'AeroTech Industries', account: 'operating' },
        { date: d(5), description: 'AWS infrastructure - monthly', type: 'expense', category: 'Infrastructure', amount: -18500, department: 'Engineering', status: 'cleared', vendor_or_client: 'AWSCloud Enterprise', account: 'operating' },
        { date: d(7), description: 'Security training program', type: 'expense', category: 'Training', amount: -5000, department: 'HR', status: 'cleared', vendor_or_client: 'Corporate Training Inc', account: 'operating' },
        { date: d(10), description: 'Customer payment - Scanner License', type: 'revenue', category: 'SaaS', amount: 85000, department: 'Sales', status: 'cleared', vendor_or_client: 'Orbit Dynamics', account: 'operating' },
        { date: d(12), description: 'Office rent - Q2', type: 'expense', category: 'Rent', amount: -22000, department: 'Operations', status: 'cleared', vendor_or_client: 'Commercial Properties LLC', account: 'operating' },
        { date: d(15), description: 'Marketing campaign - LinkedIn', type: 'expense', category: 'Marketing', amount: -8500, department: 'Marketing', status: 'cleared', vendor_or_client: 'LinkedIn Ads', account: 'operating' },
        { date: d(18), description: 'Payroll - April', type: 'payroll', category: 'Salaries', amount: -285000, department: 'All', status: 'cleared', vendor_or_client: 'Internal Payroll', account: 'payroll' },
        { date: d(20), description: 'Customer payment - Data Room', type: 'revenue', category: 'SaaS', amount: 120000, department: 'Sales', status: 'cleared', vendor_or_client: 'Stratus Fleet', account: 'operating' },
        { date: d(22), description: 'Legal services - contracts', type: 'expense', category: 'Legal', amount: -15000, department: 'Legal', status: 'cleared', vendor_or_client: 'Vertex Legal Group', account: 'operating' },
        { date: d(25), description: 'Customer payment - CRM Onboarding', type: 'revenue', category: 'Professional Services', amount: 28000, department: 'Sales', status: 'cleared', vendor_or_client: 'Raptor Air', account: 'operating' },
        { date: d(28), description: 'NetSuite ERP annual license', type: 'expense', category: 'Software', amount: -48000, department: 'Finance', status: 'cleared', vendor_or_client: 'NetSuite ERP', account: 'operating' },
        { date: d(30), description: 'Customer payment - Legal Automation', type: 'revenue', category: 'Professional Services', amount: 67000, department: 'Sales', status: 'cleared', vendor_or_client: 'Defense Plus', account: 'operating' },
        { date: d(33), description: 'Conference & travel - Q2 Summit', type: 'expense', category: 'Travel', amount: -9200, department: 'Sales', status: 'cleared', vendor_or_client: 'Travel Expenses', account: 'operating' },
        { date: d(35), description: 'Customer payment - CMMC Program', type: 'revenue', category: 'Professional Services', amount: 200000, department: 'Sales', status: 'cleared', vendor_or_client: 'National Aerospace Agency', account: 'operating' },
        { date: d(38), description: 'DataShield annual subscription', type: 'expense', category: 'Software', amount: -32000, department: 'Security', status: 'cleared', vendor_or_client: 'DataShield Encryption', account: 'operating' },
        { date: d(40), description: 'Payroll - March', type: 'payroll', category: 'Salaries', amount: -285000, department: 'All', status: 'cleared', vendor_or_client: 'Internal Payroll', account: 'payroll' },
        { date: d(45), description: 'Staffing - contract engineers', type: 'expense', category: 'Staffing', amount: -28000, department: 'Engineering', status: 'cleared', vendor_or_client: 'TechForce Staffing', account: 'operating' },
        { date: d(50), description: 'Customer payment - HRIS Integration', type: 'revenue', category: 'Professional Services', amount: 45000, department: 'Sales', status: 'cleared', vendor_or_client: 'Stellar Tech', account: 'operating' },
      ]);
      results.transactions = 'seeded 20';
    }

    // ─── FINANCE BUDGETS ──────────────────────────────────────────────────
    const existingBudgets = await base44.asServiceRole.entities.FinanceBudget.list();
    if (existingBudgets.length < 3) {
      await base44.asServiceRole.entities.FinanceBudget.bulkCreate([
        { name: 'Q2 2026 Operating Budget', fiscal_year: 2026, period: 'q2', department: 'Engineering', category: 'operating', status: 'active', total_budgeted: 420000, total_spent: 318500, owner_name: 'Alice Rodriguez', owner_email: user.email },
        { name: 'Q2 2026 Marketing Budget', fiscal_year: 2026, period: 'q2', department: 'Marketing', category: 'marketing', status: 'active', total_budgeted: 85000, total_spent: 42300, owner_name: 'Simone Baudet', owner_email: user.email },
        { name: 'Q2 2026 Sales Budget', fiscal_year: 2026, period: 'q2', department: 'Sales', category: 'operating', status: 'active', total_budgeted: 150000, total_spent: 98700, owner_name: 'Marcus Webb', owner_email: user.email },
        { name: 'Annual 2026 R&D Budget', fiscal_year: 2026, period: 'annual', department: 'Engineering', category: 'rd', status: 'active', total_budgeted: 800000, total_spent: 310000, owner_name: 'Leo Yamamoto', owner_email: user.email },
        { name: 'Q2 2026 HR Budget', fiscal_year: 2026, period: 'q2', department: 'HR', category: 'payroll', status: 'active', total_budgeted: 920000, total_spent: 855000, owner_name: 'Diane Foster', owner_email: user.email },
      ]);
      results.budgets = 'seeded 5';
    }

    // ─── FINANCE FORECAST ─────────────────────────────────────────────────
    const existingForecasts = await base44.asServiceRole.entities.FinanceForecast.list();
    if (existingForecasts.length < 2) {
      await base44.asServiceRole.entities.FinanceForecast.bulkCreate([
        {
          name: 'Q2 2026 Revenue Forecast', fiscal_year: 2026, period: 'q2', status: 'published',
          revenue_forecast: 1200000, expense_forecast: 750000, payroll_forecast: 285000, ebitda_forecast: 450000,
          assumptions: 'Based on Q1 actuals + 15% growth. Three large enterprise deals expected to close.',
          monthly_breakdown: [
            { month: 'Apr 2026', revenue: 380000, expenses: 245000, payroll: 95000 },
            { month: 'May 2026', revenue: 410000, expenses: 248000, payroll: 95000 },
            { month: 'Jun 2026', revenue: 410000, expenses: 257000, payroll: 95000 },
          ],
        },
        {
          name: 'FY 2026 Annual Forecast', fiscal_year: 2026, period: 'annual', status: 'published',
          revenue_forecast: 4800000, expense_forecast: 2900000, payroll_forecast: 1140000, ebitda_forecast: 1900000,
          assumptions: 'Target 25% YoY growth. New enterprise products launching in Q3.',
          monthly_breakdown: [
            { month: 'Jan 2026', revenue: 340000, expenses: 230000, payroll: 90000 },
            { month: 'Feb 2026', revenue: 360000, expenses: 235000, payroll: 90000 },
            { month: 'Mar 2026', revenue: 390000, expenses: 240000, payroll: 90000 },
            { month: 'Apr 2026', revenue: 380000, expenses: 245000, payroll: 95000 },
            { month: 'May 2026', revenue: 410000, expenses: 248000, payroll: 95000 },
            { month: 'Jun 2026', revenue: 410000, expenses: 257000, payroll: 95000 },
          ],
        },
      ]);
      results.forecasts = 'seeded 2';
    }

    // ─── HRIS EMPLOYEES ───────────────────────────────────────────────────
    const existingEmployees = await base44.asServiceRole.entities.HRISEmployee.list();
    if (existingEmployees.length < 5) {
      await base44.asServiceRole.entities.HRISEmployee.bulkCreate([
        { full_name: 'Alice Rodriguez', email: 'alice.rodriguez@aerotech.io', department: 'Security', job_title: 'Chief Security Officer', employment_type: 'full_time', status: 'active', salary: 185000, location: 'San Francisco, CA', start_date: '2021-03-01', skills: ['CISSP', 'Risk Management', 'SOC 2'], vacation_balance: 12, sick_balance: 8 },
        { full_name: 'James Patterson', email: 'james.patterson@aerotech.io', department: 'Compliance', job_title: 'Compliance Manager', employment_type: 'full_time', status: 'active', salary: 125000, location: 'New York, NY', start_date: '2022-01-15', skills: ['CMMC', 'ISO 27001', 'Auditing'], vacation_balance: 15, sick_balance: 10 },
        { full_name: 'Priya Singh', email: 'priya.singh@aerotech.io', department: 'Engineering', job_title: 'Security Engineer', employment_type: 'full_time', status: 'active', salary: 145000, location: 'San Francisco, CA', start_date: '2022-06-01', skills: ['Python', 'AWS', 'Terraform'], vacation_balance: 10, sick_balance: 10 },
        { full_name: 'Marcus Webb', email: 'marcus.webb@aerotech.io', department: 'Sales', job_title: 'Account Executive', employment_type: 'full_time', status: 'active', salary: 95000, location: 'Austin, TX', start_date: '2023-02-01', skills: ['Salesforce', 'Negotiation', 'SaaS Sales'], vacation_balance: 18, sick_balance: 10 },
        { full_name: 'Diane Foster', email: 'diane.foster@aerotech.io', department: 'HR', job_title: 'HR Director', employment_type: 'full_time', status: 'active', salary: 130000, location: 'Chicago, IL', start_date: '2020-09-01', skills: ['Recruiting', 'Benefits', 'HR Compliance'], vacation_balance: 20, sick_balance: 10 },
        { full_name: 'Leo Yamamoto', email: 'leo.y@aerotech.io', department: 'Engineering', job_title: 'Senior Developer', employment_type: 'full_time', status: 'active', salary: 155000, location: 'Seattle, WA', start_date: '2021-11-15', skills: ['React', 'Node.js', 'PostgreSQL', 'Deno'], vacation_balance: 8, sick_balance: 6 },
        { full_name: 'Simone Baudet', email: 'simone.b@aerotech.io', department: 'Marketing', job_title: 'Marketing Manager', employment_type: 'full_time', status: 'active', salary: 115000, location: 'Los Angeles, CA', start_date: '2022-08-01', skills: ['HubSpot', 'SEO', 'Content Strategy'], vacation_balance: 14, sick_balance: 10 },
        { full_name: 'Omar Hassan', email: 'omar.h@aerotech.io', department: 'Finance', job_title: 'Financial Controller', employment_type: 'full_time', status: 'active', salary: 140000, location: 'New York, NY', start_date: '2021-07-01', skills: ['NetSuite', 'GAAP', 'Financial Modeling'], vacation_balance: 15, sick_balance: 10 },
        { full_name: 'Grace Liu', email: 'grace.liu@aerotech.io', department: 'Legal', job_title: 'General Counsel', employment_type: 'full_time', status: 'active', salary: 200000, location: 'Washington, DC', start_date: '2020-04-15', skills: ['Contract Law', 'IP Law', 'Regulatory Affairs'], vacation_balance: 20, sick_balance: 10 },
        { full_name: 'Tyler Brooks', email: 'tyler.b@aerotech.io', department: 'Sales', job_title: 'SDR', employment_type: 'full_time', status: 'onboarding', salary: 65000, location: 'Austin, TX', start_date: d(-7), skills: ['Cold Outreach', 'CRM'], vacation_balance: 15, sick_balance: 10 },
      ]);
      results.employees = 'seeded 10';
    }

    // ─── COMPLIANCE ITEMS ─────────────────────────────────────────────────
    const existingCompliance = await base44.asServiceRole.entities.ComplianceItem.list();
    if (existingCompliance.length < 5) {
      await base44.asServiceRole.entities.ComplianceItem.bulkCreate([
        { name: 'Access Control Policy', category: 'access_control', description: 'Define and enforce role-based access controls', status: 'completed', priority: 'critical', owner_email: 'alice.rodriguez@aerotech.io', start_date: d(90), due_date: d(30), completion_date: d(35), compliance_framework: ['SOC2', 'CMMC'] },
        { name: 'Encryption Key Management', category: 'encryption', description: 'Implement AES-256 encryption with AWS KMS key rotation', status: 'completed', priority: 'critical', owner_email: 'priya.singh@aerotech.io', start_date: d(80), due_date: d(20), completion_date: d(22), compliance_framework: ['SOC2', 'HIPAA'] },
        { name: 'SOC 2 Type II Audit Prep', category: 'soc2', description: 'Prepare all documentation and evidence for SOC 2 Type II audit', status: 'in_progress', priority: 'critical', owner_email: 'james.patterson@aerotech.io', start_date: d(60), due_date: d(-30), compliance_framework: ['SOC2'] },
        { name: 'SCIM Provisioning Setup', category: 'scim', description: 'Automate user provisioning via Okta SCIM 2.0', status: 'in_progress', priority: 'high', owner_email: 'alice.rodriguez@aerotech.io', start_date: d(45), due_date: d(-15), compliance_framework: ['SOC2'] },
        { name: 'Disaster Recovery Plan', category: 'disaster_recovery', description: 'Document and test DR procedures with 4hr RTO / 1hr RPO', status: 'in_progress', priority: 'high', owner_email: 'priya.singh@aerotech.io', start_date: d(30), due_date: d(-20), compliance_framework: ['SOC2', 'CMMC'] },
        { name: 'Audit Log Infrastructure', category: 'audit', description: 'Implement immutable tamper-evident audit logging', status: 'completed', priority: 'critical', owner_email: 'priya.singh@aerotech.io', start_date: d(100), due_date: d(50), completion_date: d(52), compliance_framework: ['SOC2', 'HIPAA', 'CMMC'] },
        { name: 'SSO Implementation', category: 'sso', description: 'Deploy SAML 2.0 and OIDC single sign-on', status: 'completed', priority: 'high', owner_email: 'alice.rodriguez@aerotech.io', start_date: d(70), due_date: d(10), completion_date: d(12), compliance_framework: ['SOC2'] },
        { name: 'CMMC Level 2 Assessment', category: 'soc2', description: 'Prepare for CMMC Level 2 third-party assessment (110 practices)', status: 'not_started', priority: 'critical', owner_email: 'james.patterson@aerotech.io', start_date: d(-30), due_date: d(-90), compliance_framework: ['CMMC'] },
        { name: 'Personnel Security Screening', category: 'personnel', description: 'Background checks and security clearance tracking', status: 'in_progress', priority: 'medium', owner_email: 'diane.foster@aerotech.io', start_date: d(20), due_date: d(-10), compliance_framework: ['CMMC'] },
        { name: 'Data Retention Policy', category: 'data_retention', description: 'Define retention schedules and automated archiving', status: 'not_started', priority: 'medium', owner_email: 'grace.liu@aerotech.io', start_date: d(-15), due_date: d(-60), compliance_framework: ['SOC2', 'HIPAA'] },
        { name: 'SLA Documentation', category: 'sla', description: 'Formalize 99.9% uptime SLA with credit calculations', status: 'completed', priority: 'high', owner_email: 'alice.rodriguez@aerotech.io', start_date: d(85), due_date: d(40), completion_date: d(40), compliance_framework: ['SOC2'] },
        { name: 'Security Awareness Training', category: 'personnel', description: 'Quarterly security awareness training for all employees', status: 'in_progress', priority: 'medium', owner_email: 'diane.foster@aerotech.io', start_date: d(15), due_date: d(-5), compliance_framework: ['SOC2', 'CMMC'] },
      ]);
      results.compliance = 'seeded 12';
    }

    // ─── HRIS PAYROLL ─────────────────────────────────────────────────────
    const employees = await base44.asServiceRole.entities.HRISEmployee.list();
    const existingPayroll = await base44.asServiceRole.entities.HRISPayroll.list();
    if (existingPayroll.length < 3 && employees.length > 0) {
      const emp = employees[0];
      await base44.asServiceRole.entities.HRISPayroll.bulkCreate([
        { employee_id: emp.id, employee_name: 'All Staff', employee_email: emp.email, department: 'All', pay_period_start: d(45), pay_period_end: d(31), pay_date: d(30), status: 'paid', base_salary: 285000, gross_pay: 285000, federal_tax: 57000, state_tax: 14250, social_security: 17670, medicare: 4133, total_deductions: 14250, net_pay: 177697 },
        { employee_id: emp.id, employee_name: 'All Staff', employee_email: emp.email, department: 'All', pay_period_start: d(75), pay_period_end: d(61), pay_date: d(60), status: 'paid', base_salary: 282000, gross_pay: 282000, federal_tax: 56400, state_tax: 14100, social_security: 17484, medicare: 4089, total_deductions: 14100, net_pay: 175827 },
        { employee_id: emp.id, employee_name: 'All Staff', employee_email: emp.email, department: 'All', pay_period_start: d(105), pay_period_end: d(91), pay_date: d(90), status: 'paid', base_salary: 278000, gross_pay: 278000, federal_tax: 55600, state_tax: 13900, social_security: 17236, medicare: 4031, total_deductions: 13900, net_pay: 173333 },
        { employee_id: emp.id, employee_name: 'All Staff', employee_email: emp.email, department: 'All', pay_period_start: d(15), pay_period_end: d(1), pay_date: d(0), status: 'processing', base_salary: 288000, gross_pay: 288000, federal_tax: 57600, state_tax: 14400, social_security: 17856, medicare: 4176, total_deductions: 14400, net_pay: 179568 },
      ]);
      results.payroll = 'seeded 4';
    }

    // ─── HRIS TIME OFF ────────────────────────────────────────────────────
    const existingTimeOff = await base44.asServiceRole.entities.HRISTimeOffRequest.list();
    if (existingTimeOff.length < 3 && employees.length > 0) {
      const empMap = {};
      employees.forEach(e => { empMap[e.email] = e.id; });
      const emp = employees[0];
      await base44.asServiceRole.entities.HRISTimeOffRequest.bulkCreate([
        { employee_id: empMap['marcus.webb@aerotech.io'] || emp.id, employee_name: 'Marcus Webb', employee_email: 'marcus.webb@aerotech.io', type: 'vacation', start_date: d(20), end_date: d(16), days_requested: 5, status: 'approved', reason: 'Family vacation', manager_decision: 'approved', hr_decision: 'approved' },
        { employee_id: empMap['priya.singh@aerotech.io'] || emp.id, employee_name: 'Priya Singh', employee_email: 'priya.singh@aerotech.io', type: 'sick', start_date: d(3), end_date: d(3), days_requested: 1, status: 'approved', reason: 'Medical appointment', manager_decision: 'approved', hr_decision: 'approved' },
        { employee_id: empMap['leo.y@aerotech.io'] || emp.id, employee_name: 'Leo Yamamoto', employee_email: 'leo.y@aerotech.io', type: 'vacation', start_date: d(40), end_date: d(36), days_requested: 4, status: 'approved', reason: 'Personal time', manager_decision: 'approved', hr_decision: 'approved' },
        { employee_id: empMap['simone.b@aerotech.io'] || emp.id, employee_name: 'Simone Baudet', employee_email: 'simone.b@aerotech.io', type: 'personal', start_date: d(7), end_date: d(7), days_requested: 1, status: 'approved', reason: 'Personal day', manager_decision: 'approved', hr_decision: 'approved' },
        { employee_id: empMap['omar.h@aerotech.io'] || emp.id, employee_name: 'Omar Hassan', employee_email: 'omar.h@aerotech.io', type: 'vacation', start_date: d(25), end_date: d(21), days_requested: 5, status: 'rejected', reason: 'Vacation', manager_decision: 'rejected', hr_decision: 'pending' },
        { employee_id: empMap['james.patterson@aerotech.io'] || emp.id, employee_name: 'James Patterson', employee_email: 'james.patterson@aerotech.io', type: 'vacation', start_date: d(55), end_date: d(49), days_requested: 7, status: 'approved', reason: 'Annual vacation', manager_decision: 'approved', hr_decision: 'approved' },
      ]);
      results.timeoff = 'seeded 6';
    }

    // ─── HRIS PERFORMANCE REVIEWS ─────────────────────────────────────────
    const existingReviews = await base44.asServiceRole.entities.HRISPerformanceReview.list();
    if (existingReviews.length < 3 && employees.length > 0) {
      const empMap = {};
      employees.forEach(e => { empMap[e.email] = e.id; });
      const emp = employees[0];
      await base44.asServiceRole.entities.HRISPerformanceReview.bulkCreate([
        { employee_id: empMap['priya.singh@aerotech.io'] || emp.id, employee_name: 'Priya Singh', reviewer_id: empMap['alice.rodriguez@aerotech.io'] || emp.id, reviewer_name: 'Alice Rodriguez', review_period: 'Q1 2026', review_type: 'quarterly', status: 'completed', overall_rating: 5, completed_date: d(30), manager_review: { comments: 'Exceptional performance. Led security infrastructure overhaul.', strengths: 'Technical excellence, proactive problem solving', areas_for_improvement: 'Public speaking' } },
        { employee_id: empMap['marcus.webb@aerotech.io'] || emp.id, employee_name: 'Marcus Webb', reviewer_id: empMap['alice.rodriguez@aerotech.io'] || emp.id, reviewer_name: 'Alice Rodriguez', review_period: 'Q1 2026', review_type: 'quarterly', status: 'completed', overall_rating: 4, completed_date: d(28), manager_review: { comments: 'Strong sales performance. Exceeded quota by 18%.', strengths: 'Customer relationships, closing skills', areas_for_improvement: 'CRM hygiene' } },
        { employee_id: empMap['james.patterson@aerotech.io'] || emp.id, employee_name: 'James Patterson', reviewer_id: empMap['alice.rodriguez@aerotech.io'] || emp.id, reviewer_name: 'Alice Rodriguez', review_period: 'Q1 2026', review_type: 'quarterly', status: 'completed', overall_rating: 4, completed_date: d(25), manager_review: { comments: 'Solid compliance management. SOC2 audit prep on track.', areas_for_improvement: 'Delegation skills' } },
        { employee_id: empMap['simone.b@aerotech.io'] || emp.id, employee_name: 'Simone Baudet', reviewer_id: empMap['alice.rodriguez@aerotech.io'] || emp.id, reviewer_name: 'Alice Rodriguez', review_period: 'Q1 2026', review_type: 'quarterly', status: 'completed', overall_rating: 3, completed_date: d(20), manager_review: { comments: 'Meets expectations. Campaign performance improving.', areas_for_improvement: 'Data-driven decision making' } },
      ]);
      results.reviews = 'seeded 4';
    }

    // ─── HRIS PERFORMANCE GOALS ───────────────────────────────────────────
    const existingGoals = await base44.asServiceRole.entities.HRISPerformanceGoal.list();
    if (existingGoals.length < 3 && employees.length > 0) {
      const empMap = {};
      employees.forEach(e => { empMap[e.email] = e.id; });
      const emp = employees[0];
      await base44.asServiceRole.entities.HRISPerformanceGoal.bulkCreate([
        { employee_id: empMap['marcus.webb@aerotech.io'] || emp.id, employee_name: 'Marcus Webb', title: 'Close $500K in new ARR', description: 'Achieve $500K in new annual recurring revenue by Q2 end', category: 'performance', status: 'in_progress', progress: 72, target_date: d(-45), set_by: empMap['alice.rodriguez@aerotech.io'] || emp.id, set_by_name: 'Alice Rodriguez' },
        { employee_id: empMap['priya.singh@aerotech.io'] || emp.id, employee_name: 'Priya Singh', title: 'Complete SOC 2 infrastructure readiness', description: 'Implement all technical controls for SOC 2 Type II', category: 'project', status: 'in_progress', progress: 85, target_date: d(-30), set_by: empMap['alice.rodriguez@aerotech.io'] || emp.id, set_by_name: 'Alice Rodriguez' },
        { employee_id: empMap['simone.b@aerotech.io'] || emp.id, employee_name: 'Simone Baudet', title: 'Increase MQL volume by 40%', description: 'Drive 40% more marketing qualified leads through campaigns', category: 'performance', status: 'in_progress', progress: 55, target_date: d(-45), set_by: empMap['alice.rodriguez@aerotech.io'] || emp.id, set_by_name: 'Alice Rodriguez' },
        { employee_id: empMap['james.patterson@aerotech.io'] || emp.id, employee_name: 'James Patterson', title: 'CMMC Level 2 Gap Assessment', description: 'Complete gap assessment against all 110 CMMC Level 2 practices', category: 'project', status: 'completed', progress: 100, target_date: d(15), set_by: empMap['alice.rodriguez@aerotech.io'] || emp.id, set_by_name: 'Alice Rodriguez' },
      ]);
      results.goals = 'seeded 4';
    }

    // ─── HRIS ANNOUNCEMENTS ───────────────────────────────────────────────
    const existingAnnouncements = await base44.asServiceRole.entities.HRISAnnouncement.list();
    if (existingAnnouncements.length < 3) {
      await base44.asServiceRole.entities.HRISAnnouncement.bulkCreate([
        { title: '🎉 Q1 2026 All-Hands Recap', body: 'Thank you everyone who joined our Q1 all-hands! Revenue grew 32% YoY, we onboarded 8 new enterprise customers, and our SOC 2 audit prep is on track. See the full recording in the team wiki.', category: 'company_news', priority: 'high', status: 'published', author_name: 'Alice Rodriguez', published_at: dt(7), pinned: true },
        { title: '📋 New Security Policy: MFA Required', body: 'Starting May 15, multi-factor authentication will be required for all system access. Please enroll your device in Okta before the deadline. Contact IT support if you need help.', category: 'policy', priority: 'urgent', status: 'published', author_name: 'Alice Rodriguez', published_at: dt(3), pinned: true },
        { title: '🏖️ Summer PTO Reminder', body: 'As we head into summer, please submit vacation requests at least 2 weeks in advance. Blackout dates are June 30 - July 2. Enjoy your time off!', category: 'hr', priority: 'normal', status: 'published', author_name: 'Diane Foster', published_at: dt(1) },
        { title: '🚀 Data Room V2 Launch!', body: 'We are thrilled to announce Data Room V2 with portal access, granular permissions, and AI-powered document summaries. Big milestone for the product team!', category: 'company_news', priority: 'high', status: 'published', author_name: 'Alice Rodriguez', published_at: dt(14) },
      ]);
      results.announcements = 'seeded 4';
    }

    // ─── HRIS RECOGNITION ─────────────────────────────────────────────────
    const existingRecognition = await base44.asServiceRole.entities.HRISRecognition.list();
    if (existingRecognition.length < 3) {
      await base44.asServiceRole.entities.HRISRecognition.bulkCreate([
        { recipient_name: 'Priya Singh', recipient_department: 'Engineering', giver_name: 'Alice Rodriguez', category: 'innovation', message: 'Priya completely revamped our security monitoring in record time. The new system is already catching threats we missed before. Incredible work!', points: 500, badge: 'rocket', is_public: true },
        { recipient_name: 'Marcus Webb', recipient_department: 'Sales', giver_name: 'Alice Rodriguez', category: 'above_and_beyond', message: 'Marcus closed three enterprise deals this quarter, exceeding quota by 18%. His persistence and customer relationships are unmatched!', points: 300, badge: 'trophy', is_public: true },
        { recipient_name: 'James Patterson', recipient_department: 'Compliance', giver_name: 'Priya Singh', category: 'teamwork', message: "James went above and beyond to help me understand compliance requirements. Couldn't have done it without his expertise!", points: 200, badge: 'heart', is_public: true },
        { recipient_name: 'Grace Liu', recipient_department: 'Legal', giver_name: 'Alice Rodriguez', category: 'leadership', message: 'Grace negotiated an amazing deal with our enterprise customer, saving significant legal costs while protecting our IP. True leadership!', points: 400, badge: 'star', is_public: true },
      ]);
      results.recognition = 'seeded 4';
    }

    // ─── CAMPAIGNS ────────────────────────────────────────────────────────
    const existingCampaigns = await base44.asServiceRole.entities.Campaign.list();
    if (existingCampaigns.length < 3) {
      await base44.asServiceRole.entities.Campaign.bulkCreate([
        { name: 'Q2 Aerospace Outreach', type: 'email', status: 'active', budget: 15000, spent: 8500, target_leads: 50, start_date: d(30), end_date: d(-15), goal: 'Generate 50 MQLs from aerospace decision-makers', description: 'Multi-touch email campaign targeting aerospace executives' },
        { name: 'SOC2 Readiness Webinar', type: 'event', status: 'completed', budget: 8000, spent: 7200, target_leads: 100, start_date: d(45), end_date: d(45), goal: 'Drive 100 registrations and 20 SQLs', description: 'Live webinar on SOC 2 implementation best practices' },
        { name: 'Defense Contractor LinkedIn', type: 'social_media', status: 'active', budget: 12000, spent: 5400, target_leads: 30, start_date: d(20), end_date: d(-30), goal: 'Reach defense compliance decision-makers', description: 'LinkedIn sponsored content for defense compliance' },
        { name: 'Export Control Email Series', type: 'email', status: 'draft', budget: 5000, spent: 0, target_leads: 40, start_date: d(-7), end_date: d(-37), goal: 'Nurture international trade compliance leads', description: '5-part email series on export compliance' },
      ]);
      results.campaigns = 'seeded 4';
    }

    // ─── LEGAL MATTERS ────────────────────────────────────────────────────
    const existingMatters = await base44.asServiceRole.entities.LegalMatter.list();
    if (existingMatters.length < 3) {
      await base44.asServiceRole.entities.LegalMatter.bulkCreate([
        { title: 'Enterprise SaaS Agreement - Defense Plus', matter_type: 'contract', status: 'in_progress', priority: 'high', assigned_attorney: 'Grace Liu', client_name: 'Defense Plus', open_date: d(45), deadline: d(-15), estimated_cost: 15000, actual_cost: 8500, billing_type: 'hourly', description: 'Negotiating 3-year enterprise agreement with custom compliance terms' },
        { title: 'IP Protection - Scanner Algorithm', matter_type: 'ip', status: 'in_progress', priority: 'urgent', assigned_attorney: 'Grace Liu', client_name: 'AeroTech (Internal)', open_date: d(60), deadline: d(-30), estimated_cost: 25000, actual_cost: 12000, billing_type: 'flat_fee', description: 'Patent filing for proprietary aerospace intelligence algorithm' },
        { title: 'Vendor Contract - AWSCloud Renewal', matter_type: 'contract', status: 'closed', priority: 'medium', assigned_attorney: 'Grace Liu', client_name: 'AWSCloud Enterprise', open_date: d(120), close_date: d(90), estimated_cost: 10000, actual_cost: 9800, billing_type: 'hourly', description: 'Annual enterprise AWS agreement with custom DPA' },
        { title: 'Contractor Classification Dispute', matter_type: 'employment', status: 'in_progress', priority: 'high', assigned_attorney: 'Grace Liu', client_name: 'Former Contractor', opposing_party: 'TechForce Staffing', open_date: d(30), deadline: d(-60), estimated_cost: 40000, actual_cost: 15000, billing_type: 'hourly', description: 'Contractor classification and wage dispute' },
      ]);
      results.legalMatters = 'seeded 4';
    }

    // ─── LEGAL DOCUMENTS ──────────────────────────────────────────────────
    const existingLegalDocs = await base44.asServiceRole.entities.LegalDocument.list();
    if (existingLegalDocs.length < 3) {
      await base44.asServiceRole.entities.LegalDocument.bulkCreate([
        { title: 'Master Services Agreement - Defense Plus', document_type: 'contractor_agreement', status: 'signed', recipient_name: 'Carlos Martinez', recipient_email: 'carlos.m@defenseplus.com', company_name: 'Defense Plus', content: 'This Master Services Agreement governs the provision of compliance platform services...', sent_date: dt(30), signed_date: dt(25), view_count: 5, email_opened: true, email_clicked: true },
        { title: 'NDA - SkyLogix Aviation', document_type: 'nda', status: 'signed', recipient_name: 'Emma Davis', recipient_email: 'emma.davis@skylogix.com', company_name: 'SkyLogix Aviation', content: 'This Non-Disclosure Agreement is entered into between AeroTech Industries and SkyLogix Aviation...', sent_date: dt(20), signed_date: dt(18), view_count: 3, email_opened: true, email_clicked: true },
        { title: 'NDA - Orbit Dynamics', document_type: 'nda', status: 'sent', recipient_name: 'Ling Wei', recipient_email: 'ling.wei@orbitdynamics.com', company_name: 'Orbit Dynamics', content: 'This Non-Disclosure Agreement is entered into between AeroTech Industries and Orbit Dynamics...', sent_date: dt(5), view_count: 2, email_opened: true, email_clicked: false },
        { title: 'Consulting Agreement - AuditPro', document_type: 'contractor_agreement', status: 'signed', recipient_name: 'AuditPro Team', recipient_email: 'hello@auditpro.com', company_name: 'AuditPro Consulting', content: 'This Consulting Agreement governs audit services provided by AuditPro Consulting...', sent_date: dt(45), signed_date: dt(43), view_count: 4, email_opened: true, email_clicked: true },
        { title: 'NDA - Stratus Fleet', document_type: 'nda', status: 'draft', recipient_name: 'Nadia Okonkwo', recipient_email: 'nadia.o@stratusfleet.com', company_name: 'Stratus Fleet', content: 'This Non-Disclosure Agreement...', view_count: 0 },
      ]);
      results.legalDocs = 'seeded 5';
    }

    // ─── PROJECTS ─────────────────────────────────────────────────────────
    const existingProjects = await base44.asServiceRole.entities.Project.list();
    if (existingProjects.length < 3) {
      await base44.asServiceRole.entities.Project.bulkCreate([
        { name: 'SOC 2 Audit Preparation', status: 'active', priority: 'critical', description: 'Full SOC 2 Type II readiness program including documentation, controls, and evidence', start_date: d(90), end_date: d(-30), progress: 72, budget: 45000, budget_spent: 32000, team_members: ['james.patterson@aerotech.io', 'priya.singh@aerotech.io', 'alice.rodriguez@aerotech.io'] },
        { name: 'Platform v3.0 Launch', status: 'active', priority: 'high', description: 'Major platform release including new data room, enhanced CRM, and AI features', start_date: d(60), end_date: d(-45), progress: 58, budget: 120000, budget_spent: 69000, team_members: ['leo.y@aerotech.io', 'priya.singh@aerotech.io'] },
        { name: 'CMMC Level 2 Certification', status: 'planning', priority: 'high', description: 'Achieve CMMC Level 2 certification for defense contract eligibility', start_date: d(-15), end_date: d(-120), progress: 15, budget: 80000, budget_spent: 12000, team_members: ['james.patterson@aerotech.io', 'alice.rodriguez@aerotech.io'] },
        { name: 'Q2 Marketing Campaign Suite', status: 'active', priority: 'medium', description: 'Coordinated multi-channel marketing push for Q2 pipeline generation', start_date: d(45), end_date: d(-15), progress: 65, budget: 35000, budget_spent: 22750, team_members: ['simone.b@aerotech.io'] },
        { name: 'Customer Portal Redesign', status: 'completed', priority: 'medium', description: 'Redesign customer-facing portal with improved UX and self-service', start_date: d(120), end_date: d(30), progress: 100, budget: 25000, budget_spent: 23500, team_members: ['leo.y@aerotech.io', 'simone.b@aerotech.io'] },
      ]);
      results.projects = 'seeded 5';
    }

    // ─── EQUITY POOLS + GRANTS ─────────────────────────────────────────────
    const existingPools = await base44.asServiceRole.entities.EquityPool.list();
    if (existingPools.length < 1) {
      const pool = await base44.asServiceRole.entities.EquityPool.create({
        name: 'AeroTech 2024 Equity Incentive Plan',
        total_shares: 10000000,
        shares_granted: 1280000,
        shares_reserved: 500000,
        share_class: 'common',
        effective_date: d(720),
        is_active: true,
        notes: 'Series A equity incentive plan for employees and advisors',
      });

      const empList = await base44.asServiceRole.entities.HRISEmployee.list();
      const empMap = {};
      empList.forEach(e => { empMap[e.email] = e.id; });
      const fallbackId = empList[0]?.id || 'emp-001';

      await base44.asServiceRole.entities.EquityGrant.bulkCreate([
        { employee_id: empMap['alice.rodriguez@aerotech.io'] || fallbackId, employee_name: 'Alice Rodriguez', employee_email: 'alice.rodriguez@aerotech.io', department: 'Security', pool_id: pool.id, grant_type: 'iso', shares_granted: 500000, strike_price: 1.50, current_price: 4.25, grant_date: d(700), vesting_start_date: d(700), vesting_schedule: '4yr_1yr_cliff', shares_vested: 375000, shares_exercised: 100000, status: 'active' },
        { employee_id: empMap['grace.liu@aerotech.io'] || fallbackId, employee_name: 'Grace Liu', employee_email: 'grace.liu@aerotech.io', department: 'Legal', pool_id: pool.id, grant_type: 'iso', shares_granted: 350000, strike_price: 1.50, current_price: 4.25, grant_date: d(690), vesting_start_date: d(690), vesting_schedule: '4yr_1yr_cliff', shares_vested: 262500, shares_exercised: 0, status: 'active' },
        { employee_id: empMap['priya.singh@aerotech.io'] || fallbackId, employee_name: 'Priya Singh', employee_email: 'priya.singh@aerotech.io', department: 'Engineering', pool_id: pool.id, grant_type: 'iso', shares_granted: 200000, strike_price: 2.50, current_price: 4.25, grant_date: d(450), vesting_start_date: d(450), vesting_schedule: '4yr_1yr_cliff', shares_vested: 100000, shares_exercised: 0, status: 'active' },
        { employee_id: empMap['james.patterson@aerotech.io'] || fallbackId, employee_name: 'James Patterson', employee_email: 'james.patterson@aerotech.io', department: 'Compliance', pool_id: pool.id, grant_type: 'iso', shares_granted: 150000, strike_price: 2.50, current_price: 4.25, grant_date: d(430), vesting_start_date: d(430), vesting_schedule: '4yr_1yr_cliff', shares_vested: 75000, shares_exercised: 0, status: 'active' },
        { employee_id: empMap['marcus.webb@aerotech.io'] || fallbackId, employee_name: 'Marcus Webb', employee_email: 'marcus.webb@aerotech.io', department: 'Sales', pool_id: pool.id, grant_type: 'nso', shares_granted: 80000, strike_price: 3.25, current_price: 4.25, grant_date: d(280), vesting_start_date: d(280), vesting_schedule: '4yr_1yr_cliff', shares_vested: 20000, shares_exercised: 0, status: 'active' },
      ]);
      results.equity = 'pool + 5 grants seeded';
    }

    // ─── HRIS DEPARTMENTS ─────────────────────────────────────────────────
    const existingDepts = await base44.asServiceRole.entities.HRISDepartment.list();
    if (existingDepts.length < 3) {
      await base44.asServiceRole.entities.HRISDepartment.bulkCreate([
        { name: 'Engineering', code: 'ENG', head_employee_name: 'Alice Rodriguez', location: 'San Francisco, CA', budget: 800000, headcount_target: 8, description: 'Product development, infrastructure, and security engineering', is_active: true },
        { name: 'Sales', code: 'SLS', head_employee_name: 'Marcus Webb', location: 'Austin, TX', budget: 150000, headcount_target: 5, description: 'Enterprise sales, business development, and customer acquisition', is_active: true },
        { name: 'Compliance', code: 'CMP', head_employee_name: 'James Patterson', location: 'New York, NY', budget: 120000, headcount_target: 3, description: 'Regulatory compliance, risk management, and audit preparation', is_active: true },
        { name: 'Marketing', code: 'MKT', head_employee_name: 'Simone Baudet', location: 'Los Angeles, CA', budget: 85000, headcount_target: 3, description: 'Brand, demand generation, content, and social media', is_active: true },
        { name: 'Legal', code: 'LGL', head_employee_name: 'Grace Liu', location: 'Washington, DC', budget: 200000, headcount_target: 2, description: 'Corporate legal, IP, contracts, and regulatory affairs', is_active: true },
        { name: 'Finance', code: 'FIN', head_employee_name: 'Omar Hassan', location: 'New York, NY', budget: 50000, headcount_target: 2, description: 'Financial operations, reporting, payroll, and planning', is_active: true },
        { name: 'HR', code: 'HR', head_employee_name: 'Diane Foster', location: 'Chicago, IL', budget: 60000, headcount_target: 2, description: 'Talent acquisition, employee experience, and people operations', is_active: true },
      ]);
      results.departments = 'seeded 7';
    }

    // ─── AUDIT LOGS ───────────────────────────────────────────────────────
    const existingAuditLogs = await base44.asServiceRole.entities.AuditLog.list();
    if (existingAuditLogs.length < 5) {
      await base44.asServiceRole.entities.AuditLog.bulkCreate([
        { event_type: 'user_login', actor_email: 'alice.rodriguez@aerotech.io', actor_ip: '72.14.1.100', resource_type: 'System', action: 'Authenticated via SSO', status: 'success', severity: 'low', timestamp: dt(0) },
        { event_type: 'data_modify', actor_email: 'james.patterson@aerotech.io', actor_ip: '98.12.4.22', resource_type: 'ComplianceItem', resource_id: 'CMP-001', action: 'Updated compliance item status to in_progress', status: 'success', severity: 'medium', timestamp: dt(1) },
        { event_type: 'permission_change', actor_email: 'alice.rodriguez@aerotech.io', actor_ip: '72.14.1.100', resource_type: 'User', resource_id: 'USR-042', action: 'Elevated user role to admin', status: 'success', severity: 'high', timestamp: dt(2) },
        { event_type: 'export_data', actor_email: 'omar.h@aerotech.io', actor_ip: '45.33.2.11', resource_type: 'FinanceTransaction', action: 'Exported Q1 transactions to CSV', status: 'success', severity: 'medium', timestamp: dt(3) },
        { event_type: 'sso_login', actor_email: 'priya.singh@aerotech.io', actor_ip: '104.21.3.55', resource_type: 'System', action: 'Authenticated via Okta SAML 2.0', status: 'success', severity: 'low', timestamp: dt(4) },
        { event_type: 'data_access', actor_email: 'marcus.webb@aerotech.io', actor_ip: '67.88.1.200', resource_type: 'Deal', resource_id: 'DEAL-007', action: 'Viewed enterprise deal details', status: 'success', severity: 'low', timestamp: dt(5) },
        { event_type: 'security_event', actor_email: 'unknown', actor_ip: '185.220.101.34', resource_type: 'System', action: 'Failed login attempt - blocked by rate limiter', status: 'failure', severity: 'high', timestamp: dt(6) },
        { event_type: 'config_change', actor_email: 'alice.rodriguez@aerotech.io', actor_ip: '72.14.1.100', resource_type: 'CompanySettings', action: 'Updated primary brand color and company tagline', status: 'success', severity: 'medium', timestamp: dt(7) },
        { event_type: 'data_delete', actor_email: 'james.patterson@aerotech.io', actor_ip: '98.12.4.22', resource_type: 'ComplianceEvidence', resource_id: 'EVD-015', action: 'Deleted duplicate evidence file', status: 'success', severity: 'high', timestamp: dt(8) },
        { event_type: 'admin_action', actor_email: 'alice.rodriguez@aerotech.io', actor_ip: '72.14.1.100', resource_type: 'SCIMUser', action: 'Ran manual SCIM sync with Okta', status: 'success', severity: 'medium', timestamp: dt(9) },
      ]);
      results.auditLogs = 'seeded 10';
    }

    // ─── TICKETS ──────────────────────────────────────────────────────────
    const existingTickets = await base44.asServiceRole.entities.Ticket.list();
    if (existingTickets.length < 3) {
      await base44.asServiceRole.entities.Ticket.bulkCreate([
        { ticket_name: 'Cannot export compliance report to PDF', ticket_number: 'TKT-001', pipeline: 'Technical Pipeline', status: 'In Progress', priority: 'High', source: 'Email', ticket_description: 'When clicking Export PDF on the compliance dashboard, the file downloads but is blank after the first page.', owner_email: user.email, owner_name: 'Support Team', create_date: d(2) },
        { ticket_name: 'Request: Bulk user import for SCIM provisioning', ticket_number: 'TKT-002', pipeline: 'Technical Pipeline', status: 'In Progress', priority: 'Medium', source: 'Web Form', ticket_description: 'We need to import 200+ users from Azure AD. Can we get SCIM bulk provisioning enabled for our tenant?', owner_email: user.email, owner_name: 'Support Team', create_date: d(5) },
        { ticket_name: 'SSO login loop on mobile Safari', ticket_number: 'TKT-003', pipeline: 'Technical Pipeline', status: 'Closed', priority: 'High', source: 'Chat', ticket_description: 'Users on iOS Safari get stuck in login redirect loop when using SSO. Works fine on desktop Chrome.', owner_email: user.email, owner_name: 'Support Team', create_date: d(15), close_date: d(12), time_to_close: 72 },
        { ticket_name: 'Add custom fields to Contact entity', ticket_number: 'TKT-004', pipeline: 'Support Pipeline', status: 'New', priority: 'Low', source: 'Email', ticket_description: 'We need to track clearance level and security classification for contacts. Can custom fields be added to the Contact entity?', owner_email: user.email, owner_name: 'Support Team', create_date: d(3) },
        { ticket_name: 'Billing invoice shows wrong company name', ticket_number: 'TKT-005', pipeline: 'Billing Pipeline', status: 'Waiting on Contact', priority: 'Medium', source: 'Email', ticket_description: 'Our last 3 invoices show "AeroTech Inc" but our legal name is "AeroTech Industries LLC". Please update.', owner_email: user.email, owner_name: 'Support Team', create_date: d(1) },
      ]);
      results.tickets = 'seeded 5';
    }

    // ─── SOCIAL POSTS ─────────────────────────────────────────────────────
    const existingSocialPosts = await base44.asServiceRole.entities.SocialPost.list();
    if (existingSocialPosts.length < 5) {
      // SocialPost requires social_account_id - use a placeholder
      const accts = await base44.asServiceRole.entities.SocialAccount.list();
      const acctId = accts[0]?.id || 'placeholder-acct';
      await base44.asServiceRole.entities.SocialPost.bulkCreate([
        { social_account_id: acctId, platform: 'linkedin', content: '🚀 AeroTech Industries has achieved SOC 2 Type II certification! This reflects our commitment to enterprise security. #SOC2 #Compliance', post_type: 'text', post_date: dt(5), likes: 234, comments: 28, shares: 45, impressions: 12400, reach: 9800, engagement_rate: 2.47, sentiment: 'positive', performance_score: 88, best_performing: true },
        { social_account_id: acctId, platform: 'linkedin', content: "What does a real compliance program look like? We're sharing our SOC 2 roadmap — the good, bad, and ugly. Transparency builds trust. #Compliance #Startup", post_type: 'text', post_date: dt(12), likes: 312, comments: 41, shares: 67, impressions: 18900, reach: 15200, engagement_rate: 2.22, sentiment: 'positive', performance_score: 94, best_performing: true },
        { social_account_id: acctId, platform: 'linkedin', content: "We're hiring a Senior Compliance Engineer! San Francisco or remote. Passionate about security and critical infrastructure? Apply today 🛡️", post_type: 'text', post_date: dt(18), likes: 145, comments: 33, shares: 28, impressions: 9800, reach: 7900, engagement_rate: 2.1, sentiment: 'positive', performance_score: 75 },
        { social_account_id: acctId, platform: 'linkedin', content: 'Our Q1 2026 Aerospace Intelligence Report is live. Key finding: 67% of aerospace companies are not CMMC ready despite the 2025 deadline.', post_type: 'text', post_date: dt(25), likes: 189, comments: 22, shares: 55, impressions: 14200, reach: 11000, engagement_rate: 1.87, sentiment: 'neutral', performance_score: 80 },
        { social_account_id: acctId, platform: 'linkedin', content: 'Export compliance is more complex than ever. Our team just published a guide to ITAR, EAR, and OFAC compliance for aerospace companies. Link in bio.', post_type: 'link', post_date: dt(35), likes: 98, comments: 15, shares: 42, impressions: 7600, reach: 6200, engagement_rate: 2.04, sentiment: 'neutral', performance_score: 72 },
        { social_account_id: acctId, platform: 'linkedin', content: '5 reasons why defense contractors fail CMMC audits — and how to avoid them. Thread 🧵👇', post_type: 'text', post_date: dt(42), likes: 267, comments: 58, shares: 89, impressions: 21500, reach: 17000, engagement_rate: 1.93, sentiment: 'positive', performance_score: 91, best_performing: true },
      ]);
      results.socialPosts = 'seeded 6';
    }

    // ─── SALES CALLS ──────────────────────────────────────────────────────
    const existingCalls = await base44.asServiceRole.entities.SalesCall.list();
    if (existingCalls.length < 3) {
      const contacts = await base44.asServiceRole.entities.Contact.list();
      const contactMap = {};
      contacts.forEach(c => { contactMap[c.email] = c.id; });
      await base44.asServiceRole.entities.SalesCall.bulkCreate([
        { contact_id: contactMap['carlos.m@defenseplus.com'] || '', contact_name: 'Carlos Martinez', contact_email: 'carlos.m@defenseplus.com', call_type: 'discovery', duration_minutes: 45, sentiment: 'positive', call_date: dt(3), call_time: '14:00', notes: 'Great fit for enterprise package. Mentioned budget of $150-200K. Interested in demo next week.', recording_url: '', outcome: 'scheduled_next_call', next_follow_up: d(10), owner_email: 'marcus.webb@aerotech.io' },
        { contact_id: contactMap['ling.wei@orbitdynamics.com'] || '', contact_name: 'Ling Wei', contact_email: 'ling.wei@orbitdynamics.com', call_type: 'demo', duration_minutes: 60, sentiment: 'positive', call_date: dt(1), call_time: '10:30', notes: 'Walked through scanner and data room. Client excited about compliance features. Requested proposal with pricing.', recording_url: '', outcome: 'proposal_sent', next_follow_up: d(7), owner_email: 'marcus.webb@aerotech.io' },
        { contact_id: contactMap['emma.davis@skylogix.com'] || '', contact_name: 'Emma Davis', contact_email: 'emma.davis@skylogix.com', call_type: 'qualification', duration_minutes: 30, sentiment: 'neutral', call_date: dt(8), call_time: '15:00', notes: 'Initial conversation about pain points. Currently using competitor for compliance. Wants to see comparison.', recording_url: '', outcome: 'needs_analysis_sent', next_follow_up: d(14), owner_email: 'marcus.webb@aerotech.io' },
      ]);
      results.salesCalls = 'seeded 3';
    }

    // ─── SALES QUOTAS ─────────────────────────────────────────────────────
    const existingQuotas = await base44.asServiceRole.entities.SalesQuota.list();
    if (existingQuotas.length < 2) {
      const employees = await base44.asServiceRole.entities.HRISEmployee.list();
      const empMap = {};
      employees.forEach(e => { empMap[e.email] = e.id; });
      await base44.asServiceRole.entities.SalesQuota.bulkCreate([
        { rep_id: empMap['marcus.webb@aerotech.io'] || '', rep_name: 'Marcus Webb', rep_email: 'marcus.webb@aerotech.io', quota_period: 'Q2 2026', quota_amount: 500000, quota_type: 'arr', currency: 'USD', achieved_amount: 360000, achievement_percentage: 72, status: 'on_track', last_updated: dt(0) },
        { rep_id: empMap['james.patterson@aerotech.io'] || '', rep_name: 'James Patterson', rep_email: 'james.patterson@aerotech.io', quota_period: 'Q2 2026', quota_amount: 300000, quota_type: 'arr', currency: 'USD', achieved_amount: 245000, achievement_percentage: 82, status: 'on_track', last_updated: dt(0) },
      ]);
      results.quotas = 'seeded 2';
    }

    // ─── SALES SEQUENCES ──────────────────────────────────────────────────
    const existingSequences = await base44.asServiceRole.entities.SalesSequence.list();
    if (existingSequences.length < 2) {
      await base44.asServiceRole.entities.SalesSequence.bulkCreate([
        { name: 'Enterprise SOC2 Outreach', description: 'Multi-touch email and LinkedIn sequence for enterprise compliance decision-makers', sequence_type: 'email', status: 'active', created_by: user.email, step_count: 5, avg_open_rate: 42.5, avg_click_rate: 18.3, conversion_rate: 12.8 },
        { name: 'Defense Contractor Nurture', description: '7-step sequence for CMMC-focused companies', sequence_type: 'email', status: 'active', created_by: user.email, step_count: 7, avg_open_rate: 38.9, avg_click_rate: 15.2, conversion_rate: 9.4 },
      ]);
      results.sequences = 'seeded 2';
    }

    // ─── SEQUENCE ENROLLMENTS ──────────────────────────────────────────────
    const existingEnrollments = await base44.asServiceRole.entities.SequenceEnrollment.list();
    if (existingEnrollments.length < 3) {
      const contactsList = await base44.asServiceRole.entities.Contact.list();
      const contactMap = {};
      contactsList.forEach(c => { contactMap[c.email] = c.id; });
      const sequences = await base44.asServiceRole.entities.SalesSequence.list();
      const seq1 = sequences[0]?.id || 'seq-001';
      const seq2 = sequences[1]?.id || 'seq-002';
      await base44.asServiceRole.entities.SequenceEnrollment.bulkCreate([
        { sequence_id: seq1, contact_id: contactMap['emma.davis@skylogix.com'] || '', contact_name: 'Emma Davis', contact_email: 'emma.davis@skylogix.com', enrollment_date: dt(14), status: 'in_progress', current_step: 2, steps_completed: 2, last_engaged: dt(2), engagement_score: 72 },
        { sequence_id: seq2, contact_id: contactMap['carlos.m@defenseplus.com'] || '', contact_name: 'Carlos Martinez', contact_email: 'carlos.m@defenseplus.com', enrollment_date: dt(21), status: 'in_progress', current_step: 3, steps_completed: 3, last_engaged: dt(3), engagement_score: 85 },
        { sequence_id: seq1, contact_id: contactMap['nadia.o@stratusfleet.com'] || '', contact_name: 'Nadia Okonkwo', contact_email: 'nadia.o@stratusfleet.com', enrollment_date: dt(35), status: 'in_progress', current_step: 1, steps_completed: 0, last_engaged: dt(0), engagement_score: 0 },
      ]);
      results.sequenceEnrollments = 'seeded 3';
    }

    // ─── PROPOSALS ────────────────────────────────────────────────────────
    const existingProposals = await base44.asServiceRole.entities.Proposal.list();
    if (existingProposals.length < 3) {
      const contactsList = await base44.asServiceRole.entities.Contact.list();
      const contactMap = {};
      contactsList.forEach(c => { contactMap[c.email] = c.id; });
      await base44.asServiceRole.entities.Proposal.bulkCreate([
        { deal_id: '', opportunity_id: '', contact_id: contactMap['ling.wei@orbitdynamics.com'] || '', contact_name: 'Ling Wei', contact_email: 'ling.wei@orbitdynamics.com', title: 'Enterprise Scanner + Data Room - Orbit Dynamics', proposal_value: 185000, currency: 'USD', status: 'sent', issue_date: d(7), expiration_date: d(-23), created_by: 'marcus.webb@aerotech.io', viewed_count: 4, last_viewed: dt(2), accepted: false },
        { deal_id: '', opportunity_id: '', contact_id: contactMap['carlos.m@defenseplus.com'] || '', contact_name: 'Carlos Martinez', contact_email: 'carlos.m@defenseplus.com', title: 'CMMC Readiness Program - Defense Plus', proposal_value: 200000, currency: 'USD', status: 'viewed', issue_date: d(4), expiration_date: d(-26), created_by: 'marcus.webb@aerotech.io', viewed_count: 6, last_viewed: dt(0), accepted: false },
        { deal_id: '', opportunity_id: '', contact_id: contactMap['james.h@raptorair.com'] || '', contact_name: 'James Holloway', contact_email: 'james.h@raptorair.com', title: 'CRM + Sales Hub Implementation - Raptor Air', proposal_value: 45000, currency: 'USD', status: 'accepted', issue_date: d(20), expiration_date: d(-10), created_by: 'marcus.webb@aerotech.io', viewed_count: 3, last_viewed: dt(15), accepted_date: dt(15) },
      ]);
      results.proposals = 'seeded 3';
    }

    // ─── RESERVATIONS ─────────────────────────────────────────────────────
    const existingReservations = await base44.asServiceRole.entities.SalesReservation.list();
    if (existingReservations.length < 2) {
      const employees = await base44.asServiceRole.entities.HRISEmployee.list();
      const empMap = {};
      employees.forEach(e => { empMap[e.email] = e.id; });
      await base44.asServiceRole.entities.SalesReservation.bulkCreate([
        { rep_id: empMap['marcus.webb@aerotech.io'] || '', rep_name: 'Marcus Webb', rep_email: 'marcus.webb@aerotech.io', reservation_period: 'Q2 2026', reserved_amount: 360000, currency: 'USD', status: 'active', reason: 'Opportunity pipeline for SOC2 enterprise deals', last_updated: dt(0) },
        { rep_id: empMap['james.patterson@aerotech.io'] || '', rep_name: 'James Patterson', rep_email: 'james.patterson@aerotech.io', reservation_period: 'Q2 2026', reserved_amount: 245000, currency: 'USD', status: 'active', reason: 'Scheduled CMMC implementation projects', last_updated: dt(0) },
      ]);
      results.reservations = 'seeded 2';
    }

    // ─── SALES FORECASTS ──────────────────────────────────────────────────
    const existingForecasts2 = await base44.asServiceRole.entities.SalesForecast.list();
    if (existingForecasts2.length < 1) {
      await base44.asServiceRole.entities.SalesForecast.bulkCreate([
        { forecast_period: 'Q2 2026', forecast_type: 'pipeline', total_pipeline: 1850000, expected_revenue: 1200000, forecast_confidence: 75, forecast_by: user.email, created_date: dt(0), assumptions: 'Based on current deal pipeline and historical close rates. Three enterprise deals expected to close by end of Q2. Average deal size $280K.' },
      ]);
      results.forecast = 'seeded 1';
    }

    return Response.json({ status: 'success', message: 'Demo data seeded successfully', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});