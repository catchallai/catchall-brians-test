import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Layout } from 'lucide-react';

const categoryColors = {
  newsletter: 'bg-blue-100 text-blue-700',
  promotional: 'bg-pink-100 text-pink-700',
  follow_up: 'bg-amber-100 text-amber-700',
  welcome: 'bg-emerald-100 text-emerald-700',
  announcement: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700',
};

const layoutLabels = {
  minimal: 'Minimal',
  branded: 'Branded',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
};

export default function EmailTemplateCard({ template, onClick }) {
  return (
    <Card
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
            {template.name}
          </h3>
          <p className="text-sm text-gray-500 truncate mt-0.5">{template.subject}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={`${categoryColors[template.category]} text-xs border-0`}>
              {template.category?.replace('_', ' ')}
            </Badge>
            {template.layout && template.layout !== 'minimal' && (
              <Badge variant="outline" className="text-xs gap-1">
                <Layout className="w-3 h-3" />
                {layoutLabels[template.layout] || template.layout}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
