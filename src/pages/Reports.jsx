import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart } from "lucide-react";
import ReportBuilder, { FIELD_OPTIONS } from '@/components/reports/ReportBuilder';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';

export default function Reports() {
  const [reportConfig, setReportConfig] = useState({
    reportType: '',
    selectedFields: [],
    startDate: '',
    endDate: '',
  });
  const [filters, setFilters] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 500),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 1000),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 1000),
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 1000),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 100),
  });

  const generateReport = () => {
    const { reportType, selectedFields, startDate, endDate } = reportConfig;
    let data = [];

    switch (reportType) {
      case 'campaign_performance':
        data = campaigns.map(campaign => {
          const linkedContacts = contacts.filter(c => campaign.contact_ids?.includes(c.id));
          const linkedDeals = deals.filter(d => campaign.deal_ids?.includes(d.id));
          const wonDeals = linkedDeals.filter(d => d.stage === 'won');
          const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
          const spent = campaign.spent || 0;
          const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
          
          return {
            campaign_name: campaign.name,
            campaign_type: campaign.type,
            campaign_status: campaign.status,
            leads_count: linkedContacts.length,
            deals_count: linkedDeals.length,
            won_deals: wonDeals.length,
            revenue,
            budget: campaign.budget || 0,
            spent,
            roi,
            created_date: campaign.created_date,
          };
        });
        break;

      case 'contacts_by_source':
        data = contacts.map(contact => {
          const company = companies.find(c => c.id === contact.company_id);
          const campaign = campaigns.find(c => c.contact_ids?.includes(contact.id));
          return {
            contact_name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            company: company?.name || '-',
            status: contact.status,
            source: contact.source || '-',
            created_date: contact.created_date,
            campaign: campaign?.name || '-',
            campaign_id: campaign?.id,
          };
        });
        break;

      case 'deals_pipeline':
        data = deals.map(deal => {
          const contact = contacts.find(c => c.id === deal.contact_id);
          const company = companies.find(c => c.id === deal.company_id);
          const campaign = campaigns.find(c => c.deal_ids?.includes(deal.id));
          return {
            deal_title: deal.title,
            value: deal.value || 0,
            stage: deal.stage,
            contact: contact ? `${contact.first_name} ${contact.last_name}` : '-',
            company: company?.name || '-',
            probability: deal.probability || 0,
            expected_close: deal.expected_close_date,
            campaign: campaign?.name || '-',
            campaign_id: campaign?.id,
            created_date: deal.created_date,
          };
        });
        break;

      case 'keyword_rankings':
        data = keywords.map(kw => {
          const website = websites.find(w => w.id === kw.website_id);
          const campaign = campaigns.find(c => c.keyword_ids?.includes(kw.id));
          const change = (kw.previous_position || 0) - (kw.current_position || 0);
          return {
            keyword: kw.keyword,
            website: website?.name || '-',
            website_id: kw.website_id,
            position: kw.current_position || '-',
            change,
            volume: kw.search_volume || 0,
            difficulty: kw.difficulty || 0,
            campaign: campaign?.name || '-',
            campaign_id: campaign?.id,
          };
        });
        break;

      case 'backlink_profile':
        data = backlinks.map(bl => {
          const campaign = campaigns.find(c => c.backlink_ids?.includes(bl.id));
          return {
            source_domain: bl.source_domain,
            target_url: bl.target_url,
            anchor_text: bl.anchor_text || '-',
            domain_authority: bl.domain_authority || 0,
            link_type: bl.link_type,
            status: bl.status,
            campaign: campaign?.name || '-',
            campaign_id: campaign?.id,
            created_date: bl.created_date,
          };
        });
        break;

      case 'revenue_attribution':
        const campaignRevenue = campaigns.map(c => {
          const linkedDeals = deals.filter(d => c.deal_ids?.includes(d.id) && d.stage === 'won');
          const revenue = linkedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
          return {
            source: c.name,
            source_type: 'Campaign',
            deals_count: linkedDeals.length,
            revenue,
            avg_deal_size: linkedDeals.length > 0 ? revenue / linkedDeals.length : 0,
          };
        }).filter(r => r.deals_count > 0);
        
        data = campaignRevenue;
        break;
    }

    // Apply date filters
    if (startDate || endDate) {
      data = data.filter(row => {
        const date = row.created_date ? new Date(row.created_date) : null;
        if (!date) return true;
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      });
    }

    // Apply custom filters
    filters.forEach(filter => {
      if (!filter.field || filter.value === '') return;
      data = data.filter(row => {
        const val = row[filter.field];
        const filterVal = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return String(val).toLowerCase() === String(filterVal).toLowerCase();
          case 'not_equals':
            return String(val).toLowerCase() !== String(filterVal).toLowerCase();
          case 'greater_than':
            return Number(val) > Number(filterVal);
          case 'less_than':
            return Number(val) < Number(filterVal);
          case 'contains':
            return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
          default:
            return true;
        }
      });
    });

    const columns = (FIELD_OPTIONS[reportType] || [])
      .filter(f => selectedFields.includes(f.id))
      .map(f => ({ id: f.id, label: f.label }));

    setGeneratedReport({ data, columns });
  };

  const exportCSV = () => {
    if (!generatedReport) return;
    
    const { data, columns } = generatedReport;
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        let val = row[col.id];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
        return val;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportConfig.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate custom reports from your CRM and SEO data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="space-y-4">
          <ReportBuilder
            config={reportConfig}
            onChange={setReportConfig}
            onGenerate={generateReport}
          />
          
          {reportConfig.reportType && (
            <ReportFilters
              filters={filters}
              onChange={setFilters}
              reportType={reportConfig.reportType}
              campaigns={campaigns}
              websites={websites}
            />
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {!generatedReport ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FileBarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
              <p className="text-gray-500">Configure your report options and click Generate to see results</p>
            </div>
          ) : (
            <ReportTable
              data={generatedReport.data}
              columns={generatedReport.columns}
              onExport={exportCSV}
            />
          )}
        </div>
      </div>
    </div>
  );
}