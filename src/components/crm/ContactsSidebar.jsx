import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const NAVIGATION_ITEMS = [
  { label: 'Calls', page: 'CallsModule' },
  { label: 'Contacts', page: 'Contacts' },
  { label: 'Companies', page: 'CompaniesModule' },
  { label: 'Deals', page: 'DealsModule' },
  { label: 'Emails', page: 'EmailsModule' },
  { label: 'Invoices', page: 'InvoicesModule' },
  { label: 'Marketing Events', page: 'MarketingEventsModule' },
  { label: 'Notes', page: 'NotesModule' },
  { label: 'Orders', page: 'OrdersModule' },
  { label: 'Postal Mail', page: 'PostalMailModule' },
  { label: 'Products', page: 'ProductsModule' },
  { label: 'Quotes', page: 'QuotesModule' },
  { label: 'Subscriptions', page: 'SubscriptionsModule' },
  { label: 'Ticket', page: 'TicketsModule' },
];

export default function ContactsSidebar({ activeModule = 'Calls' }) {
  const selectedItem = NAVIGATION_ITEMS.find((item) => item.label === activeModule);

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-col p-4">
      {/* Module Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between gap-2 mb-6">
            <span className="font-medium">{selectedItem?.label || 'Calls'}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {NAVIGATION_ITEMS.map((item) => (
            <Link key={item.label} to={createPageUrl(item.page)}>
              <DropdownMenuItem
                className={
                  selectedItem?.label === item.label
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : ''
                }
              >
                {item.label}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Placeholder for module-specific content */}
      <nav className="flex-1 text-sm text-gray-500 dark:text-gray-400">
        <p className="p-4 text-center">Select a module to see options</p>
      </nav>
    </div>
  );
}
