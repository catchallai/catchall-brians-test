import {
  FileText,
  Target,
  Lightbulb,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Trophy,
  Rocket,
  Mail,
} from 'lucide-react';

const slideTemplates = [
  {
    id: 'cover',
    icon: FileText,
    title: 'Cover',
    description: 'Title slide with company name and tagline',
  },
  {
    id: 'problem',
    icon: Target,
    title: 'Problem',
    description: "The pain point you're addressing",
  },
  { id: 'solution', icon: Lightbulb, title: 'Solution', description: 'How your product solves it' },
  { id: 'market', icon: TrendingUp, title: 'Market', description: 'TAM, SAM, SOM analysis' },
  { id: 'product', icon: Rocket, title: 'Product', description: 'Product demo or features' },
  {
    id: 'business-model',
    icon: DollarSign,
    title: 'Business Model',
    description: 'Revenue streams and pricing',
  },
  { id: 'traction', icon: BarChart3, title: 'Traction', description: 'Growth metrics and KPIs' },
  { id: 'competition', icon: Trophy, title: 'Competition', description: 'Competitive landscape' },
  { id: 'team', icon: Users, title: 'Team', description: 'Founders and key team members' },
  { id: 'financials', icon: DollarSign, title: 'Financials', description: 'Revenue projections' },
  { id: 'ask', icon: Rocket, title: 'The Ask', description: 'Funding needs' },
  { id: 'contact', icon: Mail, title: 'Contact', description: 'Contact information' },
];

export default function SlideTemplates({ onAdd }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Slide</h3>
      <div className="grid grid-cols-2 gap-2">
        {slideTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onAdd(template)}
            className="flex flex-col items-start gap-2 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group text-left"
          >
            <template.icon className="w-4 h-4 text-gray-400 group-hover:text-violet-600" />
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">{template.title}</p>
              <p className="text-[10px] text-gray-500 line-clamp-1">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
