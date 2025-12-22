import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown } from "lucide-react";

export default function BrandSwitcher() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const updateContextMutation = useMutation({
    mutationFn: (context) => base44.auth.updateMe({ current_context: context }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const currentContext = user?.current_context || { type: 'all', id: null };
  const currentBrand = brands.find(b => b.id === currentContext.id);
  const currentCompany = companies.find(c => c.id === currentContext.id);
  const currentOrganization = organizations.find(o => o.id === currentContext.id);

  const handleSwitch = (type, id, name) => {
    updateContextMutation.mutate({ type, id, name });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[150px]">
          <Building2 className="w-4 h-4" />
          <span className="truncate">
            {currentContext.type === 'brand' && currentBrand?.name}
            {currentContext.type === 'company' && currentCompany?.name}
            {currentContext.type === 'organization' && currentOrganization?.name}
            {currentContext.type === 'all' && 'All Data'}
          </span>
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleSwitch('all', null, 'All Data')}>
          {currentContext.type === 'all' && <Check className="w-4 h-4 mr-2" />}
          {currentContext.type !== 'all' && <div className="w-4 h-4 mr-2" />}
          All Data
        </DropdownMenuItem>

        {brands.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Brands</DropdownMenuLabel>
            {brands.map(brand => (
              <DropdownMenuItem
                key={brand.id}
                onClick={() => handleSwitch('brand', brand.id, brand.name)}
              >
                {currentContext.id === brand.id && <Check className="w-4 h-4 mr-2" />}
                {currentContext.id !== brand.id && <div className="w-4 h-4 mr-2" />}
                {brand.name}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {companies.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Companies</DropdownMenuLabel>
            {companies.map(company => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleSwitch('company', company.id, company.name)}
              >
                {currentContext.id === company.id && <Check className="w-4 h-4 mr-2" />}
                {currentContext.id !== company.id && <div className="w-4 h-4 mr-2" />}
                {company.name}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {organizations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Client Organizations</DropdownMenuLabel>
            {organizations.map(org => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch('organization', org.id, org.name)}
              >
                {currentContext.id === org.id && <Check className="w-4 h-4 mr-2" />}
                {currentContext.id !== org.id && <div className="w-4 h-4 mr-2" />}
                {org.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}