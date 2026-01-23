import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, Globe, MapPin, Phone, DollarSign, Building2, Mail, Briefcase 
} from "lucide-react";

export default function CompanyDetailPanel({ companyId }) {
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await base44.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['company-contacts', companyId],
    queryFn: () => base44.entities.Contact.filter({ company_id: companyId }, '-created_date', 100),
    enabled: !!companyId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['company-deals', companyId],
    queryFn: () => base44.entities.Deal.filter({ company_id: companyId }, '-created_date', 50),
    enabled: !!companyId,
  });

  if (loadingCompany) {
    return <Skeleton className="h-64" />;
  }

  if (!company) return null;

  const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
              {company.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
              {company.industry && (
                <Badge className="mt-2 bg-violet-100 text-violet-700">
                  {company.industry}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {company.website && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Globe className="w-4 h-4" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                {company.phone}
              </div>
            )}
            {(company.city || company.country) && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                {[company.city, company.country].filter(Boolean).join(', ')}
              </div>
            )}
            {company.size && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building2 className="w-4 h-4" />
                {company.size} employees
              </div>
            )}
          </div>

          {company.description && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{company.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</p>
            <p className="text-xs text-gray-500">Contacts</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{deals.length}</p>
            <p className="text-xs text-gray-500">Deals</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${(totalDealValue / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500">Pipeline Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts at Company */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Contacts ({contacts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No contacts yet</p>
          ) : (
            <div className="space-y-2">
              {contacts.slice(0, 10).map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-xs">
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact.job_title || contact.email}</p>
                  </div>
                  <Badge className={
                    contact.status === 'customer' ? 'bg-green-100 text-green-700' :
                    contact.status === 'prospect' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }>
                    {contact.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Deals */}
      {deals.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{deal.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{deal.stage?.replace('_', ' ')}</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${(deal.value / 1000).toFixed(0)}k
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}