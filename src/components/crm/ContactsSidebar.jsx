import React from 'react';
import { ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const NAVIGATION_ITEMS = [
  'Calls',
  'Contacts',
  'Companies',
  'Deals',
  'Emails',
  'Invoices',
  'Marketing Events',
  'Notes',
  'Orders',
  'Postal Mail',
  'Products',
  'Quotes',
  'Subscriptions',
  'Ticket',
];

export default function ContactsSidebar({ activeFilter, onFilterChange }) {
  const [selectedItem, setSelectedItem] = React.useState('Calls');

  const handleSelect = (item) => {
    setSelectedItem(item);
    onFilterChange(item);
  };

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-col p-4">
      {/* Module Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between gap-2 mb-6"
          >
            <span className="font-medium">{selectedItem}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {NAVIGATION_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item}
              onClick={() => handleSelect(item)}
              className={selectedItem === item ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : ''}
            >
              {item}
            </DropdownMenuItem>
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