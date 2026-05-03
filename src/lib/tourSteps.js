export const tourSteps = {
  features: [
    {
      id: 'features-intro',
      title: 'Welcome to Features',
      text: 'Discover and manage all available features in your platform.',
      attachTo: { element: '[data-tour="features-header"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Exit' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'features-tiers',
      title: 'Feature Tiers',
      text: 'Features are organized by subscription tier: Starter, Growth, and Enterprise.',
      attachTo: { element: '[data-tour="features-tiers"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'features-toggle',
      title: 'Enable Features',
      text: 'Toggle individual features on or off to control what\'s available to your team.',
      attachTo: { element: '[data-tour="features-toggle"]', on: 'left' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    }
  ],
  crm: [
    {
      id: 'crm-intro',
      title: 'CRM Pipeline',
      text: 'Manage your sales pipeline and track deals through each stage.',
      attachTo: { element: '[data-tour="crm-header"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Exit' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'crm-stages',
      title: 'Pipeline Stages',
      text: 'Deals move through stages like Lead, Qualified, Proposal, Negotiation, Won, and Lost.',
      attachTo: { element: '[data-tour="crm-stages"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'crm-kanban',
      title: 'Drag & Drop Deals',
      text: 'Drag deals between columns to update their status in your pipeline.',
      attachTo: { element: '[data-tour="crm-kanban"]', on: 'left' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'crm-metrics',
      title: 'Pipeline Analytics',
      text: 'View real-time metrics including total pipeline value and conversion rates.',
      attachTo: { element: '[data-tour="crm-metrics"]', on: 'top' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    }
  ],
  seo: [
    {
      id: 'seo-intro',
      title: 'SEO Dashboard',
      text: 'Monitor your website\'s SEO performance and track keyword rankings.',
      attachTo: { element: '[data-tour="seo-header"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Exit' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'seo-score',
      title: 'SEO Score',
      text: 'Track your overall SEO health with a comprehensive score (0-100).',
      attachTo: { element: '[data-tour="seo-score"]', on: 'bottom' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'seo-keywords',
      title: 'Keyword Rankings',
      text: 'Monitor target keywords and their search rankings across time.',
      attachTo: { element: '[data-tour="seo-keywords"]', on: 'left' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Next', classes: 'shepherd-button-primary' }
      ]
    },
    {
      id: 'seo-backlinks',
      title: 'Backlink Analysis',
      text: 'Analyze your backlink profile to identify opportunities for improvement.',
      attachTo: { element: '[data-tour="seo-backlinks"]', on: 'left' },
      buttons: [
        { action: () => {}, text: 'Back', classes: 'shepherd-button-secondary' },
        { action: () => {}, text: 'Finish', classes: 'shepherd-button-primary' }
      ]
    }
  ]
};