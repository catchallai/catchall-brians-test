import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, Globe, Users, MapPin, Eye, Upload, Grid3x3, List, Download } from "lucide-react";
import CompanyModal from '@/components/modals/CompanyModal';
import CompanyDetailPanel from '@/components/crm/CompanyDetailPanel';
import ImportDialog from '@/components/ui/ImportDialog';
import EmptyState from '@/components/ui/EmptyState';
import { exportToCSV } from '@/components/utils/exportData';

export default function Companies() {
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [failedLogos, setFailedLogos] = useState(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allCompanies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const companies = allCompanies;

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const contacts = allContacts;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = await base44.entities.Company.create(data);
      
      // Auto-enrich company data from internet
      try {
        await base44.functions.invoke('enrichCompanyData', {
          company_id: company.id,
          company_name: company.name,
          website: company.website
        });
      } catch (err) {
        console.log('Auto-enrichment skipped:', err);
      }
      
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      setEditingCompany(null);
    },
  });

  const handleSave = (data) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company, viewOnly = false) => {
    if (viewOnly) {
      setSelectedCompany(company);
      setShowDetailPanel(true);
    } else {
      setEditingCompany(company);
      setShowModal(true);
    }
  };

  const handleImport = async (data) => {
    const requiredFields = ['name'];
    let successCount = 0;

    for (const row of data) {
      try {
        const companyData = {};
        Object.keys(row).forEach(key => {
          if (row[key]) companyData[key] = row[key];
        });

        if (!companyData.name) continue;

        await base44.entities.Company.create(companyData);
        successCount++;
      } catch (err) {
        console.error('Failed to import company:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['companies'] });
    return { successCount, totalRows: data.length };
  };

  const handleExport = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'website', label: 'Website' },
      { key: 'industry', label: 'Industry' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'phone', label: 'Phone' },
      { key: 'annual_revenue', label: 'Annual Revenue' },
      { key: 'description', label: 'Description' }
    ];
    exportToCSV(filteredCompanies, 'companies', columns);
  };

  const getContactCount = (companyId) => contacts.filter(c => c.company_id === companyId).length;

  const getCompanyContacts = (companyId) => contacts.filter(c => c.company_id === companyId);

  const getPrimaryContact = (companyId) => {
    const companyContacts = getCompanyContacts(companyId);
    return companyContacts.length > 0 ? companyContacts[0] : null;
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.website?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industryLabels = {
    technology: 'Technology',
    healthcare: 'Healthcare',
    finance: 'Finance',
    retail: 'Retail',
    manufacturing: 'Manufacturing',
    education: 'Education',
    real_estate: 'Real Estate',
    consulting: 'Consulting',
    marketing: 'Marketing',
    other: 'Other',
  };

  const formatRevenue = (value) => {
    if (!value) return null;
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{companies.length} companies total</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Button onClick={() => { setEditingCompany(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-initial">
             <Plus className="w-4 h-4" />
             Add Company
           </Button>
           <Button onClick={() => setShowImportDialog(true)} variant="outline" className="gap-2 flex-1 sm:flex-initial">
             <Upload className="w-4 h-4" />
             Import
           </Button>
           <Button onClick={handleExport} variant="outline" className="gap-2 flex-1 sm:flex-initial">
             <Download className="w-4 h-4" />
             Export
           </Button>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {Object.entries(industryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="gap-1"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="gap-1"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Company List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Start organizing your business relationships by adding companies."
          actionLabel="Add Company"
          onAction={() => { setEditingCompany(null); setShowModal(true); }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-5 glass-card rounded-2xl hover:shadow-lg transition-all group relative"
            >
              <div className="flex items-start gap-4">
                {company.logo_url && !failedLogos.has(company.id) ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                    onError={() => setFailedLogos(prev => new Set(prev).add(company.id))}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {company.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-violet-600 transition-colors">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <Badge variant="secondary" className="mt-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                      {industryLabels[company.industry] || company.industry}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {company.website && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Globe className="w-4 h-4" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
                {(company.city || company.country) && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                </div>

                {(() => {
                const primaryContact = getPrimaryContact(company.id);
                return (
                  <>
                    {primaryContact && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Primary Contact</p>
                        <p className="font-medium text-gray-900 dark:text-white">{primaryContact.first_name} {primaryContact.last_name}</p>
                        {primaryContact.job_title && <p className="text-xs text-gray-600 dark:text-gray-300">{primaryContact.job_title}</p>}
                        {primaryContact.email && <p className="text-xs text-violet-600 dark:text-violet-400 truncate">{primaryContact.email}</p>}
                        {primaryContact.phone && <p className="text-xs text-gray-600 dark:text-gray-300">{primaryContact.phone}</p>}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{getContactCount(company.id)} contacts</span>
                      </div>
                      {company.annual_revenue && (
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatRevenue(company.annual_revenue)}
                        </span>
                      )}
                    </div>
                  </>
                );
                })()}
              
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(company, true)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(company);
                  }}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Website</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Contacts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {company.logo_url && !failedLogos.has(company.id) ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                            onError={() => setFailedLogos(prev => new Set(prev).add(company.id))}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {company.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{company.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {company.industry ? (
                        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                          {industryLabels[company.industry] || company.industry}
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {[company.city, company.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline truncate block max-w-xs">
                          {company.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {getContactCount(company.id)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {company.annual_revenue ? formatRevenue(company.annual_revenue) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(company, true)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(company)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      <CompanyModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingCompany(null); }}
        company={editingCompany}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Panel */}
      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCompany && (
            <CompanyDetailPanel companyId={selectedCompany.id} />
          )}
        </SheetContent>
      </Sheet>

      {/* Import Modal */}
      <ImportAviationDataModal open={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}