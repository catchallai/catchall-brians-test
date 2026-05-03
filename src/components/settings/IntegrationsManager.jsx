import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ExternalLink, Lock } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, companies, and deals with HubSpot',
    icon: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
    status: 'connected',
    category: 'CRM',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect and sync data with Salesforce CRM',
    icon: 'https://www.salesforce.com/content/dam/web/en_us/www/images/icons/salesforce-icon.png',
    status: 'available',
    category: 'CRM',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track website traffic and user behavior',
    icon: 'https://www.gstatic.com/images/branding/product/1x/analytics_512dp.png',
    status: 'connected',
    category: 'Analytics',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and alerts to Slack',
    icon: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    status: 'available',
    category: 'Communication',
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for messaging',
    icon: 'https://www.microsoft.com/favicon.ico',
    status: 'available',
    category: 'Communication',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with thousands of apps via Zapier',
    icon: 'https://zapier.com/zapier/images/zapier-logo.png',
    status: 'available',
    category: 'Automation',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and manage billing',
    icon: 'https://www.stripe.com/favicon.ico',
    status: 'available',
    category: 'Payments',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Sync LinkedIn data and manage outreach',
    icon: 'https://static-exp1.licdn.com/sc/h/1bt1dvyjukccvjjc13jonifo7',
    status: 'connected',
    category: 'Social',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Monitor mentions and manage social presence',
    icon: 'https://abs.twimg.com/favicon.ico',
    status: 'available',
    category: 'Social',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram business account',
    icon: 'https://www.instagram.com/favicon.ico',
    status: 'connected',
    category: 'Social',
  },
  {
    id: 'meta',
    name: 'Meta',
    description: 'Connect Meta (Facebook) business assets',
    icon: 'https://www.meta.com/favicon.ico',
    status: 'available',
    category: 'Social',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Manage email campaigns and subscribers',
    icon: 'https://mailchimp.com/favicon.ico',
    status: 'available',
    category: 'Email',
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sync tasks and project management',
    icon: 'https://luna.assets.asana.biz/assets/img/favicon.ico',
    status: 'available',
    category: 'Project Management',
  },
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Manage projects and workflows on Monday.com',
    icon: 'https://monday.com/favicon.ico',
    status: 'available',
    category: 'Project Management',
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'Connect and manage ClickUp tasks and projects',
    icon: 'https://clickup.com/favicon.ico',
    status: 'available',
    category: 'Project Management',
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    description: 'Integrate with Jira and Confluence',
    icon: 'https://www.atlassian.com/favicon.ico',
    status: 'available',
    category: 'Project Management',
  },
];

const CATEGORIES = [...new Set(INTEGRATIONS.map(i => i.category))].sort();

export default function IntegrationsManager() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = selectedCategory === 'All' 
    ? INTEGRATIONS 
    : INTEGRATIONS.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Integrations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect and manage your favorite tools and services
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'All' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('All')}
          size="sm"
        >
          All Integrations
        </Button>
        {CATEGORIES.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            size="sm"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIntegrations.map(integration => (
          <Card key={integration.id} className="glass-card flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <img
                  src={integration.icon}
                  alt={integration.name}
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E';
                  }}
                />
                {integration.status === 'connected' ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Available</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-xs">{integration.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                {integration.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  size="sm"
                  className="flex-1"
                >
                  {integration.status === 'connected' ? 'Manage' : 'Connect'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  title="Learn more"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No integrations found in this category.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}