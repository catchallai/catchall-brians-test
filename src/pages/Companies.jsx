import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, Globe, Users, MapPin } from "lucide-react";
import CompanyModal from '@/components/modals/CompanyModal';
import EmptyState from '@/components/ui/EmptyState';

export default function Companies() {
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allCompanies = [], isLoading } = useQuery({
    queryKey: ['companies', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Company.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const companies = allCompanies;

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 500);
    },
    enabled: !!user?.current_business_id,
  });

  const contacts = allContacts;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = await base44.entities.Company.create({
        ...data,
        business_id: user?.current_business_id,
      });
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

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowModal(true);
  };

  const getContactCount = (companyId) => contacts.filter(c => c.company_id === companyId).length;

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
        <Button onClick={() => { setEditingCompany(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-5 glass-card rounded-2xl hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleEdit(company)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {company.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 text-xs">
                      {industryLabels[company.industry] || company.industry}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {company.website && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
                {(company.city || company.country) && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{getContactCount(company.id)} contacts</span>
                </div>
                {company.annual_revenue && (
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatRevenue(company.annual_revenue)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CompanyModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingCompany(null); }}
        company={editingCompany}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}