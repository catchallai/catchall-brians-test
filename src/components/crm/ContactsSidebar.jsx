import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { label: 'Contacts', icon: '👥', subItems: ['All Contacts', 'Active', 'Inactive'] },
  { label: 'Deals', icon: '🤝', subItems: null },
  { label: 'Invoices', icon: '📄', subItems: null },
  { label: 'Opportunities', icon: '🎯', subItems: null },
  { label: 'Team Events', icon: '📅', subItems: null },
  { label: 'Teams', icon: '👫', subItems: null },
];

export default function ContactsSidebar({ activeFilter, onFilterChange }) {
  const [expandedItems, setExpandedItems] = React.useState({ Contacts: true });

  const toggleExpand = (label) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => {
                onFilterChange(item.label);
                if (item.subItems) toggleExpand(item.label);
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-l-4 border-transparent hover:border-violet-500"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.label}</span>
              </span>
              {item.subItems && (
                <span className="text-gray-400">
                  {expandedItems[item.label] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              )}
            </button>

            {/* Sub Items */}
            {item.subItems && expandedItems[item.label] && (
              <div className="bg-gray-50 dark:bg-slate-800/50">
                {item.subItems.map((subItem) => (
                  <button
                    key={subItem}
                    onClick={() => onFilterChange(subItem)}
                    className={`w-full px-4 py-2 text-left text-sm pl-12 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors ${
                      activeFilter === subItem
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {subItem}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}