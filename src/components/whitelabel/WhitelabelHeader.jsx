import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function WhitelabelHeader() {
  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const result = await base44.entities.CompanySettings.list();
      return result[0] || null;
    },
  });

  const companyName = settings?.company_name || 'CatchAll';
  const tagline = settings?.tagline || 'Business Intelligence Platform';
  const logo = settings?.logo_url;

  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt={companyName} className="h-8 object-contain" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
          {companyName.charAt(0)}
        </div>
      )}
      <div>
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">{companyName}</h2>
        {tagline && <p className="text-xs text-gray-500 dark:text-gray-400">{tagline}</p>}
      </div>
    </div>
  );
}