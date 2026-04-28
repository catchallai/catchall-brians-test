import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, FileText } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Proposal',
    category: 'general',
    description: 'Professional proposal with pricing and terms',
    content: `PROPOSAL FOR [CLIENT_NAME]

Executive Summary
[Brief overview of solution and benefits]

Scope of Work
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

Pricing
[Itemized pricing]

Timeline
[Project timeline and milestones]

Terms & Conditions
[Payment terms and conditions]`,
  },
  {
    id: 'service',
    name: 'Service Agreement',
    category: 'service',
    description: 'Service-based engagement proposal',
    content: `SERVICE PROPOSAL FOR [CLIENT_NAME]

Services to be Provided
[Description of services]

Service Terms
- Duration: [X months/years]
- Deliverables: [List deliverables]
- Support: [Support level]

Pricing
Monthly Fee: $[Amount]
Setup Fee: $[Amount]

Service Level Agreement
- Response Time: [Time]
- Uptime Guarantee: [Percentage]
- Support Hours: [Hours]`,
  },
  {
    id: 'quick',
    name: 'Quick Quote',
    category: 'quote',
    description: 'Simple one-page quote',
    content: `QUOTE FOR [CLIENT_NAME]

Project: [Project Name]
Date: [Date]

Services
[Service 1]: $[Amount]
[Service 2]: $[Amount]

Total: $[Total Amount]

Valid Until: [Date]

Thank you for considering our proposal!`,
  },
];

export default function ProposalTemplateLibrary({ onSelectTemplate }) {
  const [templates] = useState(DEFAULT_TEMPLATES);

  const handleSelect = (template) => {
    onSelectTemplate?.(template);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">
                {template.category}
              </Badge>
              <Button size="sm" className="w-full gap-2" onClick={() => handleSelect(template)}>
                <Copy className="w-4 h-4" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
