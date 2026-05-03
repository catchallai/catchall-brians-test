import IntegrationsManager from '@/components/settings/IntegrationsManager';

export default function Integrations() {
  return (
    <div className="p-6 lg:p-8 min-h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Connect and manage your favorite tools and services
        </p>
      </div>

      {/* Content */}
      <div className="mt-8">
        <IntegrationsManager />
      </div>
    </div>
  );
}