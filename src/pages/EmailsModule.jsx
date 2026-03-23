import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Mail } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';

export default function EmailsModule() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Emails" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Emails
              </h1>
              <p className="text-sm text-gray-500 mt-1">Email communications</p>
            </div>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
              <Plus className="w-4 h-4" />
              Send Email
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <EmptyState
            icon={Mail}
            title="No emails yet"
            description="Start sending emails to track communications."
          />
        </div>
      </div>
    </div>
  );
}
