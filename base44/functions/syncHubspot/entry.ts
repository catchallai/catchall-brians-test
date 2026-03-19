import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { syncType, direction } = await req.json();

    // Get HubSpot access token
    const hubspotToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    const results = {
      contactsCreated: 0,
      contactsUpdated: 0,
      companiesCreated: 0,
      companiesUpdated: 0,
      errors: [],
    };

    // Sync Contacts
    if (syncType === 'contacts' || syncType === 'both') {
      if (direction === 'to_hubspot' || direction === 'bidirectional') {
        // Push Catchall contacts to HubSpot
        const contacts = await base44.asServiceRole.entities.Contact.list();

        for (const contact of contacts) {
          try {
            const hsContact = {
              properties: {
                email: contact.email,
                firstname: contact.first_name,
                lastname: contact.last_name,
                phone: contact.phone,
                jobtitle: contact.job_title,
                company: contact.company_name,
                website: contact.website,
                hs_lead_status: contact.status,
              },
            };

            // Search for existing contact by email
            const searchResponse = await fetch(
              `https://api.hubapi.com/crm/v3/objects/contacts/search`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filterGroups: [
                    {
                      filters: [
                        {
                          propertyName: 'email',
                          operator: 'EQ',
                          value: contact.email,
                        },
                      ],
                    },
                  ],
                }),
              }
            );

            const searchData = await searchResponse.json();

            if (searchData.results && searchData.results.length > 0) {
              // Update existing contact
              const hsContactId = searchData.results[0].id;
              await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hsContactId}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(hsContact),
              });
              results.contactsUpdated++;
            } else {
              // Create new contact
              await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(hsContact),
              });
              results.contactsCreated++;
            }
          } catch (error) {
            results.errors.push(`Contact ${contact.email}: ${error.message}`);
          }
        }
      }

      if (direction === 'from_hubspot' || direction === 'bidirectional') {
        // Pull contacts from HubSpot to Catchall
        let after = undefined;
        let hasMore = true;

        while (hasMore) {
          const url = after
            ? `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&after=${after}`
            : `https://api.hubapi.com/crm/v3/objects/contacts?limit=100`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          for (const hsContact of data.results || []) {
            try {
              const props = hsContact.properties;

              // Check if contact exists in Catchall
              const existingContacts = await base44.asServiceRole.entities.Contact.filter({
                email: props.email,
              });

              const contactData = {
                email: props.email,
                first_name: props.firstname || '',
                last_name: props.lastname || '',
                phone: props.phone || '',
                job_title: props.jobtitle || '',
                company_name: props.company || '',
                website: props.website || '',
                status: props.hs_lead_status || 'lead',
              };

              if (existingContacts.length > 0) {
                await base44.asServiceRole.entities.Contact.update(
                  existingContacts[0].id,
                  contactData
                );
                results.contactsUpdated++;
              } else {
                await base44.asServiceRole.entities.Contact.create(contactData);
                results.contactsCreated++;
              }
            } catch (error) {
              results.errors.push(`HubSpot Contact ${hsContact.id}: ${error.message}`);
            }
          }

          hasMore = !!data.paging?.next;
          after = data.paging?.next?.after;
        }
      }
    }

    // Sync Companies
    if (syncType === 'companies' || syncType === 'both') {
      if (direction === 'to_hubspot' || direction === 'bidirectional') {
        // Push Catchall companies to HubSpot
        const companies = await base44.asServiceRole.entities.Company.list();

        for (const company of companies) {
          try {
            const hsCompany = {
              properties: {
                name: company.name,
                domain: company.website,
                industry: company.industry,
                city: company.city || company.hq_city,
                country: company.country,
                phone: company.phone,
                description: company.description,
                numberofemployees: company.size,
                annualrevenue: company.annual_revenue,
              },
            };

            // Search for existing company by domain
            const searchResponse = await fetch(
              `https://api.hubapi.com/crm/v3/objects/companies/search`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filterGroups: [
                    {
                      filters: [
                        {
                          propertyName: 'domain',
                          operator: 'EQ',
                          value: company.website,
                        },
                      ],
                    },
                  ],
                }),
              }
            );

            const searchData = await searchResponse.json();

            if (searchData.results && searchData.results.length > 0) {
              // Update existing company
              const hsCompanyId = searchData.results[0].id;
              await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${hsCompanyId}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(hsCompany),
              });
              results.companiesUpdated++;
            } else {
              // Create new company
              await fetch(`https://api.hubapi.com/crm/v3/objects/companies`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${hubspotToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(hsCompany),
              });
              results.companiesCreated++;
            }
          } catch (error) {
            results.errors.push(`Company ${company.name}: ${error.message}`);
          }
        }
      }

      if (direction === 'from_hubspot' || direction === 'bidirectional') {
        // Pull companies from HubSpot to Catchall
        let after = undefined;
        let hasMore = true;

        while (hasMore) {
          const url = after
            ? `https://api.hubapi.com/crm/v3/objects/companies?limit=100&after=${after}`
            : `https://api.hubapi.com/crm/v3/objects/companies?limit=100`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          for (const hsCompany of data.results || []) {
            try {
              const props = hsCompany.properties;

              // Check if company exists in Catchall
              const existingCompanies = await base44.asServiceRole.entities.Company.filter({
                website: props.domain,
              });

              const companyData = {
                name: props.name,
                website: props.domain,
                industry: props.industry,
                city: props.city,
                country: props.country,
                phone: props.phone,
                description: props.description,
                size: props.numberofemployees,
                annual_revenue: parseFloat(props.annualrevenue) || null,
              };

              if (existingCompanies.length > 0) {
                await base44.asServiceRole.entities.Company.update(
                  existingCompanies[0].id,
                  companyData
                );
                results.companiesUpdated++;
              } else {
                await base44.asServiceRole.entities.Company.create(companyData);
                results.companiesCreated++;
              }
            } catch (error) {
              results.errors.push(`HubSpot Company ${hsCompany.id}: ${error.message}`);
            }
          }

          hasMore = !!data.paging?.next;
          after = data.paging?.next?.after;
        }
      }
    }

    return Response.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('HubSpot sync error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
});
