import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  Eye,
  Upload,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import CompanyModal from '@/components/modals/CompanyModal';
import CompanyDetailPanel from '@/components/crm/CompanyDetailPanel';
import ImportDialog from '@/components/ui/ImportDialog';
import { exportToCSV } from '@/components/utils/exportData';
import { toast } from 'sonner';

export default function CompaniesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({
    industry: null,
    size: null,
    owner: null,
    tier: null,
    country: null,
    city: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [failedLogos, setFailedLogos] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('asc');

  const queryClient = useQueryClient();

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
      const companyData = { ...data };

      // If no website provided, find it automatically
      if (!companyData.website && companyData.name) {
        try {
          const result = await base44.functions.invoke('findCompanyWebsite', {
            company_name: companyData.name,
          });
          if (result.data?.website) {
            companyData.website = result.data.website;
          }
        } catch (err) {
          console.warn('Website lookup failed:', err);
        }
      }

      const company = await base44.entities.Company.create(companyData);
      try {
        await base44.functions.invoke('enrichCompanyData', {
          company_id: company.id,
          company_name: company.name,
          website: company.website,
        });
      } catch (err) {
        console.warn('Auto-enrichment skipped:', err);
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      setEditingCompany(null);
    },
  });

  const syncAllLogosMutation = useMutation({
    mutationFn: async () => {
      const companiesWithoutLogos = allCompanies.filter((c) => c.website && !c.logo_url);
      let syncedCount = 0;

      for (const company of companiesWithoutLogos) {
        try {
          const domain = company.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          const logoUrls = [
            `https://logo.clearbit.com/${domain}`,
            `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          ];

          // Test if Clearbit logo exists using Image object
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
              await base44.entities.Company.update(company.id, { logo_url: logoUrls[0] });
              syncedCount++;
              resolve();
            };
            img.onerror = async () => {
              // Fallback to Google favicon
              await base44.entities.Company.update(company.id, { logo_url: logoUrls[1] });
              syncedCount++;
              resolve();
            };
            img.src = logoUrls[0];
          });
        } catch (_err) {
          console.warn(`Failed to sync logo for ${company.name}`);
        }
      }

      return syncedCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`Successfully synced ${count} company logos`);
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
    // Get existing companies to check for duplicates
    const existingCompanies = await base44.entities.Company.list('-created_date', 1000);
    const existingNames = new Set(
      existingCompanies.map((c) => c.name?.toLowerCase()).filter(Boolean)
    );

    let successCount = 0;
    const duplicateCompanies = [];
    const failedCompanies = [];

    for (const row of data) {
      try {
        const companyData = {};
        Object.keys(row).forEach((key) => {
          if (row[key]) {
            companyData[key] = row[key];
          }
        });

        if (!companyData.name) {
          failedCompanies.push({ name: 'Unknown', reason: 'Missing company name' });
          continue;
        }

        // Check for duplicate
        if (existingNames.has(companyData.name.toLowerCase())) {
          duplicateCompanies.push(companyData.name);
          continue;
        }

        await base44.entities.Company.create(companyData);
        successCount++;
      } catch (err) {
        console.error('Failed to import company:', err);
        failedCompanies.push({ name: row.name || 'Unknown', reason: err.message });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    return { successCount, totalRows: data.length, duplicateCompanies, failedCompanies };
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const getContactCount = (companyId) =>
    allContacts.filter((c) => c.company_id === companyId).length;

  const formatRevenue = (value) => {
    if (!value) {
      return null;
    }
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
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
    const filtered = allCompanies.filter((company) => {
      const matchesSearch =
        !searchTerm ||
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesIndustry = !filters.industry || company.industry === filters.industry;
      const matchesSize = !filters.size || company.size === filters.size;
      const matchesTier = !filters.tier || company.tier === filters.tier;
      const matchesCountry =
        !filters.country || company.country?.toLowerCase().includes(filters.country.toLowerCase());
      const matchesCity =
        !filters.city || company.city?.toLowerCase().includes(filters.city.toLowerCase());

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'tier1' && company.tier === 'Tier 1') ||
        (activeTab === 'tier2' && company.tier === 'Tier 2') ||
        (activeTab === 'tier3' && company.tier === 'Tier 3');

      return (
        matchesSearch &&
        matchesIndustry &&
        matchesSize &&
        matchesTier &&
        matchesCountry &&
        matchesCity &&
        matchesTab
      );
    });

    return filtered.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [allCompanies, searchTerm, filters, activeTab, sortOrder]);

  const handleExport = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'website', label: 'Website' },
      { key: 'industry', label: 'Industry' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'phone', label: 'Phone' },
      { key: 'tier', label: 'Tier' },
      { key: 'annual_revenue', label: 'Annual Revenue' },
    ];
    exportToCSV(filteredCompanies, 'companies', columns);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== null) || searchTerm;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Companies" />

      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Companies
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => syncAllLogosMutation.mutate()}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                  disabled={syncAllLogosMutation.isPending}
                >
                  {syncAllLogosMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync All Logos
                </Button>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  onClick={() => {
                    setEditingCompany(null);
                    setShowModal(true);
                  }}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  New Company
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 sm:px-6">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800">
              <TabsTrigger
                value="all"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
                All companies
              </TabsTrigger>
              <TabsTrigger
                value="tier1"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
                Tier 1
              </TabsTrigger>
              <TabsTrigger
                value="tier2"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
                Tier 2
              </TabsTrigger>
              <TabsTrigger
                value="tier3"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
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
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'technology')}>
                Technology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'aviation')}>
                Aviation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'finance')}>
                Finance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'healthcare')}>
                Healthcare
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleFilterChange('size', '1-10')}>
                1-10 employees
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '11-50')}>
                11-50 employees
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '51-200')}>
                51-200 employees
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '201+')}>
                201+ employees
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'me')}>
                Me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'team')}>
                Team
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'Tier 1')}>
                Tier 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'Tier 2')}>
                Tier 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'Tier 3')}>
                Tier 3
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'us')}>
                United States
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'uk')}>
                United Kingdom
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'ca')}>
                Canada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'other')}>
                Other
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <Input
              placeholder="Filter by city..."
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value || null)}
              className="h-8 w-32 text-xs"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  industry: null,
                  size: null,
                  owner: null,
                  tier: null,
                  country: null,
                  city: null,
                });
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-96 rounded-xl" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-6 sm:p-8">
              <EmptyState
                icon={Building2}
                title="No matches for the current filters."
                description="Expecting to see a new record? Try again in a few seconds as the system catches up."
                actionLabel="Add Company"
                onAction={() => {
                  setEditingCompany(null);
                  setShowModal(true);
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center gap-2">
                        Company
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Industry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Website
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Contacts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-900">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {company.logo_url && !failedLogos.has(company.id) ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                              onError={() =>
                                setFailedLogos((prev) => new Set(prev).add(company.id))
                              }
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {company.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {company.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {company.industry ? (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs"
                          >
                            {industryLabels[company.industry] || company.industry}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {company.tier || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {[company.city, company.country].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 dark:text-violet-400 hover:underline truncate block max-w-xs"
                          >
                            {company.website}
                          </a>
                        ) : (
                          '-'
                        )}
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
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(company)}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        onClose={() => {
          setShowModal(false);
          setEditingCompany(null);
        }}
        company={editingCompany}
        onSave={handleSave}
        onDelete={(id) => deleteMutation.mutate(id)}
        isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      />

      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCompany && <CompanyDetailPanel companyId={selectedCompany.id} />}
        </SheetContent>
      </Sheet>

      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
        entityName="Company"
        requiredFields={['name']}
        optionalFields={[
          'website',
          'industry',
          'city',
          'country',
          'phone',
          'tier',
          'annual_revenue',
          'description',
        ]}
        onImportComplete={(result) => {
          if (result.successCount > 0) {
            toast.success(`Successfully imported ${result.successCount} companies`);
          }
          if (result.duplicateCompanies?.length > 0) {
            toast.warning(
              `${result.duplicateCompanies.length} duplicate companies skipped: ${result.duplicateCompanies.join(', ')}`
            );
          }
          if (result.failedCompanies?.length > 0) {
            toast.error(`${result.failedCompanies.length} companies failed`);
            console.warn('Failed companies:', result.failedCompanies);
          }
        }}
      />
    </div>
  );
}
