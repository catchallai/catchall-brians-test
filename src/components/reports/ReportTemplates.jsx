import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart2, TrendingUp, Users, Target, Link2, Globe, MapPin, Search } from "lucide-react";

const templates = [
  { 
    id: 'scratch', 
    name: 'Start from scratch', 
    description: 'Choose among over 200 widgets to build your own report.',
    icon: Plus, 
    color: 'bg-emerald-500',
    isPro: true
  },
  { 
    id: 'brand_performance', 
    name: 'AI Brand Performance', 
    description: 'See how your brand is represented in LLMs like ChatGPT and get actionable insights.',
    icon: TrendingUp, 
    color: 'bg-violet-100 text-violet-600'
  },
  { 
    id: 'visibility', 
    name: 'Visibility Overview', 
    description: 'Analyze how AI platforms perceive your brand, including mentions, sources, and topics.',
    icon: BarChart2, 
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'marketing', 
    name: 'Marketing Report', 
    description: 'Get insights on traffic, ads, and search performance from GA4, GSC, and Google Ads.',
    icon: Target, 
    color: 'bg-green-100 text-green-600'
  },
  { 
    id: 'traffic', 
    name: 'AI Traffic Report', 
    description: 'View GA4 insights on AI-driven traffic and use them to guide your AI SEO strategy.',
    icon: TrendingUp, 
    color: 'bg-amber-100 text-amber-600'
  },
  { 
    id: 'analytics', 
    name: 'Google Analytics 4', 
    description: 'Get key metrics such as sessions, events, and audience insights.',
    icon: BarChart2, 
    color: 'bg-orange-100 text-orange-600'
  },
  { 
    id: 'search_console', 
    name: 'Google Search Console', 
    description: "Get insights into your website's search performance.",
    icon: Search, 
    color: 'bg-teal-100 text-teal-600'
  },
  { 
    id: 'local_seo', 
    name: 'Local SEO Report', 
    description: 'Track your local business customer journey by unifying GA4, GSC, and GBP data in one view.',
    icon: MapPin, 
    color: 'bg-red-100 text-red-600'
  },
  { 
    id: 'gbp_insights', 
    name: 'Google Business Profile Insights', 
    description: 'Get detailed performance data, including ratings, impressions, and interactions.',
    icon: Globe, 
    color: 'bg-indigo-100 text-indigo-600'
  }
];

export default function ReportTemplates({ onSelect }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Ready-to-use templates</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.id}
              onClick={() => onSelect(template)}
              className={`min-w-[180px] max-w-[180px] cursor-pointer border-0 shadow-sm hover:shadow-md transition-all ${
                template.id === 'scratch' ? 'bg-emerald-500 text-white' : 'bg-white'
              }`}
            >
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  template.id === 'scratch' ? 'bg-white/20' : template.color
                }`}>
                  <Icon className={`w-5 h-5 ${template.id === 'scratch' ? 'text-white' : ''}`} />
                </div>
                <h3 className={`font-medium text-sm mb-1 ${template.id === 'scratch' ? 'text-white' : 'text-gray-900'}`}>
                  {template.name}
                </h3>
                <p className={`text-xs line-clamp-3 ${template.id === 'scratch' ? 'text-white/80' : 'text-gray-500'}`}>
                  {template.description}
                </p>
                {template.isPro && (
                  <span className="inline-block mt-2 text-xs bg-white/20 px-2 py-0.5 rounded">Pro</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}