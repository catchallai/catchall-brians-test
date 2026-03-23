const TABS = [
  { id: 'all', label: 'All contacts', icon: '👥' },
  { id: 'open-opportunities', label: 'Open opportunities', icon: '🎯' },
  { id: 'need-follow-up', label: 'Need follow up', icon: '⏰' },
  { id: 'in-progress', label: 'In progress', icon: '⚡' },
];

export default function ContactsViewTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 flex gap-6 px-6 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-3 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{tab.icon}</span>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
