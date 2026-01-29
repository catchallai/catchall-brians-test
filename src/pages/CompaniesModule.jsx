import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, ChevronDown, ChevronLeft, ChevronRight, Download, Globe, MapPin, Users, Eye, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import CompanyModal from '@/components/modals/CompanyModal';
import CompanyDetailPanel from '@/components/crm/CompanyDetailPanel';
import ImportDialog from '@/components/ui/ImportDialog';
import { exportToCSV } from '@/components/utils/exportData';

export default function CompaniesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({
    industry: null,
    size: null,
    owner: null,
    tier: null,
    country: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [failedLogos, setFailedLogos] = useState(new Set());

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allCompanies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = await base44.entities.Company.create(data);
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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const getContactCount = (companyId) => allContacts.filter(c => c.company_id === companyId).length;

  const getCompanyContacts = (companyId) => allContacts.filter(c => c.company_id === companyId);

  const getPrimaryContact = (companyId) => {
    const companyContacts = getCompanyContacts(companyId);
    return companyContacts.length > 0 ? companyContacts[0] : null;
  };

  const formatRevenue = (value) => {
    if (!value) return null;
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

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
    aviation: 'Aviation',
    other: 'Other',
  };

  const filteredCompanies = useMemo(() => {
    return allCompanies.filter(company => {
      const matchesSearch = !searchTerm || 
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = !filters.industry || company.industry === filters.industry;
      const matchesSize = !filters.size || company.size === filters.size;
      const matchesTier = !filters.tier || company.tier === filters.tier;
      const matchesCountry = !filters.country || company.country?.toLowerCase().includes(filters.country.toLowerCase());
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'tier1' && company.tier === 'Tier 1') ||
        (activeTab === 'tier2' && company.tier === 'Tier 2') ||
        (activeTab === 'tier3' && company.tier === 'Tier 3');
      
      return matchesSearch && matchesIndustry && matchesSize && matchesTier && matchesCountry && matchesTab;
    });
  }, [allCompanies, searchTerm, filters, activeTab]);

  const handleExport = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'website', label: 'Website' },
      { key: 'industry', label: 'Industry' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'phone', label: 'Phone' },
      { key: 'tier', label: 'Tier' },
      { key: 'annual_revenue', label: 'Annual Revenue' }
    ];
    exportToCSV(filteredCompanies, 'companies', columns);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null) || searchTerm;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Companies" />

      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowImportDialog(true)} variant="outline" className="gap-2" size="sm">
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button onClick={() => { setEditingCompany(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
                  <Plus className="w-4 h-4" />
                  New Company
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 sm:px-6">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800">
              <TabsTrigger value="all" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                All companies
              </TabsTrigger>
              <TabsTrigger value="tier1" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 1
              </TabsTrigger>
              <TabsTrigger value="tier2" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 2
              </TabsTrigger>
              <TabsTrigger value="tier3" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 3
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-2 items-center text-sm">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Industry
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'technology')}>Technology</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'aviation')}>Aviation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'finance')}>Finance</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'healthcare')}>Healthcare</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Company size
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '1-10')}>1-10 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '11-50')}>11-50 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '51-200')}>51-200 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '201+')}>201+ employees</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Company owner
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'me')}>Me</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'team')}>Team</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Tier
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier1')}>Tier 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier2')}>Tier 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier3')}>Tier 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Country
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'us')}>United States</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'uk')}>United Kingdom</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'ca')}>Canada</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'other')}>Other</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Advanced filters
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>More options</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm('');
                setFilters({ industry: null, size: null, owner: null, tier: null, country: null });
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No matches for the current filters."
              description="Expecting to see a new record? Try again in a few seconds as the system catches up."
              actionLabel="Add Company"
              onAction={() => { setEditingCompany(null); setShowModal(true); }}
            />
          ) : (
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
                      onClick={() => handleEdit(company)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-600 dark:text-gray-400">Prev</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-gray-600 dark:text-gray-400">Next</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {pageSize} per page
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPageSize(10)}>10</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(25)}>25</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(50)}>50</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button onClick={handleExport} variant="outline" size="sm" className="h-8 gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CompanyModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingCompany(null); }}
        company={editingCompany}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCompany && (
            <CompanyDetailPanel companyId={selectedCompany.id} />
          )}
        </SheetContent>
      </Sheet>

      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
        entityName="Company"
        requiredFields={['name']}
        optionalFields={['website', 'industry', 'city', 'country', 'phone', 'tier', 'annual_revenue', 'description']}
      />
    </div>
  );
}