import React from 'react';
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Link2, Settings, FileText, MapPin, Globe } from "lucide-react";

const actions = [
  { 
    page: 'Keywords', 
    icon: Search, 
    label: 'Keywords', 
    color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100'
  },
  { 
    page: 'Backlinks', 
    icon: Link2, 
    label: 'Backlinks', 
    color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
  },
  { 
    page: 'SEOAudit', 
    icon: Settings, 
    label: 'SEO Audit', 
    color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
  },
  { 
    page: 'ContentStrategy', 
    icon: FileText, 
    label: 'Content Strategy', 
    color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
  },
  { 
    page: 'Listings', 
    icon: MapPin, 
    label: 'Listings', 
    color: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100'
  },
  { 
    page: 'SEOTools', 
    icon: Globe, 
    label: 'SEO Tools', 
    color: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
  }
];

export default function QuickActionsGrid({ keywords, backlinks }) {
  const getSubtext = (page) => {
    switch(page) {
      case 'Keywords': return `${keywords.length} tracked`;
      case 'Backlinks': return `${backlinks.length} found`;
      case 'SEOAudit': return 'Run analysis';
      case 'ContentStrategy': return 'Plan content';
      case 'Listings': return 'Manage listings';
      case 'SEOTools': return 'Advanced tools';
      default: return '';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {actions.map((action) => (
        <Link key={action.page} to={createPageUrl(action.page)}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-4 h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2.5 rounded-xl transition-colors ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{action.label}</h3>
                <p className="text-xs text-gray-500">{getSubtext(action.page)}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}