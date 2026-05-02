import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Create or update company settings
    const existingSettings = await base44.entities.CompanySettings.list();
    if (existingSettings.length === 0) {
      await base44.entities.CompanySettings.create({
        company_name: 'AeroTech Industries',
        tagline: 'Advanced aerospace solutions and compliance',
        primary_color: '#7c3aed',
        industry: 'aerospace',
        scanner_label: 'Aerospace Intelligence Scanner',
        support_email: 'compliance@aerotech.io',
      });
    }

    // Seed demo contacts
    const contacts = await base44.entities.Contact.list();
    if (contacts.length === 0) {
      await base44.entities.Contact.bulkCreate([
        {
          first_name: 'Sarah',
          email: 'sarah.chen@aerotech.io',
          company_name: 'AeroTech Industries',
          job_title: 'VP of Compliance',
          status: 'customer',
          category: ['Intl BizAv Operators'],
          country: 'USA',
        },
        {
          first_name: 'Michael',
          email: 'michael.johnson@aerotech.io',
          company_name: 'AeroTech Industries',
          job_title: 'Security Director',
          status: 'customer',
          category: ['US Fractional Charter'],
          country: 'USA',
        },
        {
          first_name: 'Emma',
          email: 'emma.davis@skylogix.com',
          company_name: 'SkyLogix Aviation',
          job_title: 'Operations Manager',
          status: 'prospect',
          category: ['US Regional Airlines'],
          country: 'USA',
        },
      ]);
    }

    // Seed demo deals
    const deals = await base44.entities.Deal.list();
    if (deals.length === 0) {
      const contactsList = await base44.entities.Contact.list();
      const contact = contactsList[0];

      await base44.entities.Deal.bulkCreate([
        {
          title: 'SOC 2 Compliance Package - Enterprise',
          value: 150000,
          stage: 'negotiation',
          contact_id: contact?.id,
          company_id: contact?.company_id,
          probability: 75,
          expected_close_date: '2026-06-30',
          owner_email: 'sales@aerotech.io',
        },
        {
          title: 'CMMC Level 3 Implementation',
          value: 200000,
          stage: 'proposal',
          contact_id: contact?.id,
          company_id: contact?.company_id,
          probability: 60,
          expected_close_date: '2026-07-15',
          owner_email: 'sales@aerotech.io',
        },
      ]);
    }

    // Seed demo vendors
    const vendors = await base44.entities.Vendor.list();
    if (vendors.length === 0) {
      await base44.entities.Vendor.bulkCreate([
        {
          name: 'CloudSecure Solutions',
          type: 'vendor',
          email: 'support@cloudsecure.io',
          category: 'Software',
          status: 'active',
          total_spend: 45000,
        },
        {
          name: 'AuditPro Consulting',
          type: 'contractor',
          email: 'hello@auditpro.com',
          category: 'Services',
          status: 'active',
          total_spend: 78500,
        },
        {
          name: 'DataShield Encryption',
          type: 'vendor',
          email: 'sales@datashield.io',
          category: 'Software',
          status: 'active',
          total_spend: 32000,
        },
      ]);
    }

    // Seed demo finance transactions
    const transactions = await base44.entities.FinanceTransaction.list();
    if (transactions.length === 0) {
      const today = new Date();
      await base44.entities.FinanceTransaction.bulkCreate([
        {
          date: today.toISOString().split('T')[0],
          description: 'Software subscription - CloudSecure',
          type: 'expense',
          category: 'SaaS',
          amount: -3750,
          department: 'Security',
          status: 'cleared',
          vendor_or_client: 'CloudSecure Solutions',
        },
        {
          date: new Date(today.getTime() - 86400000)
            .toISOString()
            .split('T')[0],
          description: 'Compliance audit consulting',
          type: 'expense',
          category: 'Services',
          amount: -12500,
          department: 'Compliance',
          status: 'cleared',
          vendor_or_client: 'AuditPro Consulting',
        },
        {
          date: new Date(today.getTime() - 172800000)
            .toISOString()
            .split('T')[0],
          description: 'Security training program',
          type: 'expense',
          category: 'Training',
          amount: -5000,
          department: 'HR',
          status: 'cleared',
          vendor_or_client: 'Corporate Training Inc',
        },
      ]);
    }

    // Seed demo employees
    const employees = await base44.entities.HRISEmployee.list();
    if (employees.length === 0) {
      await base44.entities.HRISEmployee.bulkCreate([
        {
          full_name: 'Alice Rodriguez',
          email: 'alice.rodriguez@aerotech.io',
          department: 'Security',
          job_title: 'Chief Security Officer',
          employment_type: 'full_time',
          status: 'active',
          salary: 185000,
          location: 'San Francisco, CA',
        },
        {
          full_name: 'James Patterson',
          email: 'james.patterson@aerotech.io',
          department: 'Compliance',
          job_title: 'Compliance Manager',
          employment_type: 'full_time',
          status: 'active',
          salary: 125000,
          location: 'New York, NY',
        },
        {
          full_name: 'Priya Singh',
          email: 'priya.singh@aerotech.io',
          department: 'Engineering',
          job_title: 'Security Engineer',
          employment_type: 'full_time',
          status: 'active',
          salary: 145000,
          location: 'San Francisco, CA',
        },
      ]);
    }

    return Response.json({
      status: 'success',
      message: 'Demo data seeded successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});