import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return Response.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      companiesCreated: 0,
      contactsCreated: 0,
      errors: [],
    };

    for (const row of data) {
      try {
        // Parse company data
        const companyData = {
          business_id: user.current_business_id,
          name: row.Company?.trim(),
          website: row.Website?.trim(),
          contact_page_url: row['Contact Page URL']?.trim(),
          category: row.Category?.trim(),
          industry: 'aviation',
          city: row['HQ City']?.trim(),
          country: row['Country/Region']?.trim(),
          hq_city: row['HQ City']?.trim(),
          tier: row.Tier?.trim(),
          loi_summary: row['LOI / MOU / Prior Conditional Orders (Summary)']?.trim(),
          loi_source_urls: row['LOI/MOU Source URLs']
            ?.trim()
            ?.split(';')
            .filter(Boolean)
            .map((u) => u.trim()),
          notes_angle: row['Notes / Angle']?.trim(),
          contact_sources_urls: row['Contact Sources (URLs)']
            ?.trim()
            ?.split(';')
            .filter(Boolean)
            .map((u) => u.trim()),
          general_emails: row['General Email(s)']
            ?.trim()
            ?.split(';')
            .filter(Boolean)
            .map((e) => e.trim()),
          general_phones: row['General Phone(s)']
            ?.trim()
            ?.split(';')
            .filter(Boolean)
            .map((p) => p.trim()),
        };

        // Filter out empty values
        Object.keys(companyData).forEach((key) => {
          if (
            !companyData[key] ||
            (Array.isArray(companyData[key]) && companyData[key].length === 0)
          ) {
            delete companyData[key];
          }
        });

        if (!companyData.name) {
          results.errors.push('Row missing company name');
          continue;
        }

        // Create company
        const company = await base44.entities.Company.create(companyData);
        results.companiesCreated++;

        // Create contacts for this company
        const roles = [
          {
            titleKey: 'Role 1 (Primary) - Title',
            nameKey: 'Role 1 - Name',
            emailKey: 'Role 1 - Email',
            phoneKey: 'Role 1 - Phone',
          },
          {
            titleKey: 'Role 2 - Title',
            nameKey: 'Role 2 - Name',
            emailKey: 'Role 2 - Email',
            phoneKey: 'Role 2 - Phone',
          },
          {
            titleKey: 'Signer / Exec Sponsor - Title',
            nameKey: 'Signer - Name',
            emailKey: 'Signer - Email',
            phoneKey: 'Signer - Phone',
          },
        ];

        for (const role of roles) {
          const name = row[role.nameKey]?.trim();
          const email = row[role.emailKey]?.trim();
          const phone = row[role.phoneKey]?.trim();
          const jobTitle = row[role.titleKey]?.trim();

          // Only create contact if we have at least name or email
          if (name || email) {
            const nameParts = (name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const contactData = {
              business_id: user.current_business_id,
              first_name: firstName || 'Unknown',
              last_name: lastName,
              email: email,
              phone: phone,
              company_id: company.id,
              company_name: companyData.name,
              job_title: jobTitle,
              source: 'import',
            };

            await base44.entities.Contact.create(contactData);
            results.contactsCreated++;
          }
        }
      } catch (error) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
