import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Globe,
  MapPin,
  Phone,
  DollarSign,
  Building2,
  Target,
  Sparkles,
  TrendingUp,
  Newspaper,
  DollarSign as FundingIcon,
  UserCheck,
  Link2,
} from 'lucide-react';

export default function CompanyDetailPanel({ companyId }) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await base44.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('enrichCompanyIntelligence', {
        company_id: company.id,
        company_name: company.name,
        website: company.website,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
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

  const { data: relatedCompanies = [] } = useQuery({
    queryKey: ['related-companies', companyId],
    queryFn: async () => {
      if (!company?.related_company_ids || company.related_company_ids.length === 0) return [];
      const allCompanies = await base44.entities.Company.list('-created_date', 500);
      return allCompanies.filter((c) => company.related_company_ids.includes(c.id));
    },
    enabled: !!company?.related_company_ids,
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
            {company.logo_url && !logoFailed ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {company.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
              {company.industry && (
                <Badge className="mt-2 bg-violet-100 text-violet-700">{company.industry}</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {company.website && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Globe className="w-4 h-4" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-600"
                >
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

          {company.ai_enriched && (
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-3 h-3 text-violet-500" />
              AI enriched{' '}
              {company.ai_enriched_date
                ? new Date(company.ai_enriched_date).toLocaleDateString()
                : ''}
            </div>
          )}

          <Button
            onClick={() => enrichMutation.mutate()}
            disabled={enrichMutation.isPending}
            variant="outline"
            size="sm"
            className="mt-4 w-full"
          >
            {enrichMutation.isPending ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Enriching with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {company.ai_enriched ? 'Refresh' : 'Enrich'} Company Intelligence
              </>
            )}
          </Button>
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
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-xs">
                      {contact.first_name?.[0]}
                      {contact.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact.job_title || contact.email}</p>
                  </div>
                  <Badge
                    className={
                      contact.status === 'customer'
                        ? 'bg-green-100 text-green-700'
                        : contact.status === 'prospect'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }
                  >
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
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {deal.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {deal.stage?.replace('_', ' ')}
                    </p>
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

      {/* Industry Trends */}
      {company.industry_trends && company.industry_trends.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Industry Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {company.industry_trends.map((trend, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent News */}
      {company.recent_news && company.recent_news.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-500" />
              Recent News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.recent_news.map((news, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {news.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{news.summary}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{news.date}</p>
                    {news.url && (
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline"
                      >
                        Read more →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Rounds */}
      {company.funding_rounds && company.funding_rounds.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FundingIcon className="w-5 h-5 text-emerald-500" />
              Funding History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.funding_rounds.map((round, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {round.round_type}
                    </p>
                    <p className="text-xs text-gray-500">{round.date}</p>
                    {round.investors && round.investors.length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {round.investors.join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${(round.amount / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Competitors */}
      {company.key_competitors && company.key_competitors.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-red-500" />
              Key Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {company.key_competitors.map((competitor, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                >
                  {competitor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Companies */}
      {relatedCompanies.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-500" />
              Related Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedCompanies.map((related) => (
                <div
                  key={related.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {related.logo_url ? (
                    <img
                      src={related.logo_url}
                      alt={related.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                      {related.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {related.name}
                    </p>
                    {related.industry && (
                      <p className="text-xs text-gray-500">{related.industry}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
