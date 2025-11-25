import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Target, 
  Search, 
  Mail, 
  Calendar,
  FileText,
  Sparkles,
  Radio
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
  { label: 'Add Contact', icon: UserPlus, page: 'Contacts', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
  { label: 'Create Deal', icon: Target, page: 'Deals', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
  { label: 'Run SEO Audit', icon: Search, page: 'SEOAudit', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
  { label: 'Send Email', icon: Mail, page: 'EmailMarketing', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
  { label: 'Schedule Post', icon: Calendar, page: 'SocialCalendar', color: 'text-pink-600 bg-pink-50 hover:bg-pink-100' },
  { label: 'View Reports', icon: FileText, page: 'Reports', color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100' },
  { label: 'Social Listening', icon: Radio, page: 'SocialListening', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
  { label: 'AI Analysis', icon: Sparkles, page: 'SEODashboard', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
];

export default function QuickActions() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Link key={action.label} to={createPageUrl(action.page)}>
              <Button 
                variant="ghost" 
                className={`w-full h-auto py-3 flex flex-col gap-1.5 ${action.color} transition-colors`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}