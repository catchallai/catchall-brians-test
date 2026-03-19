import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  ArrowRight,
  Star,
  LayoutDashboard,
  Users,
  Building2,
  Target,
  Calendar,
  Search,
  Link2,
  FileSearch,
  Megaphone,
  FileBarChart,
  Mail,
  Zap,
  Globe,
  Share2,
  HelpCircle,
  Radio,
  MapPin,
  Newspaper,
  FileText,
  BarChart3,
  PenTool,
  Activity,
  TrendingUp,
  Smartphone,
  Settings,
} from 'lucide-react';

const AVAILABLE_PAGES = [
  { page: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-violet-500' },
  { page: 'Contacts', label: 'Contacts', icon: Users, color: 'bg-blue-500' },
  { page: 'Companies', label: 'Companies', icon: Building2, color: 'bg-indigo-500' },
  { page: 'Deals', label: 'Deals', icon: Target, color: 'bg-orange-500' },
  { page: 'Activities', label: 'Activities', icon: Calendar, color: 'bg-cyan-500' },
  { page: 'SEODashboard', label: 'SEO Dashboard', icon: Search, color: 'bg-green-500' },
  { page: 'SEOTools', label: 'SEO Tools', icon: Globe, color: 'bg-emerald-500' },
  { page: 'Keywords', label: 'Keywords', icon: Target, color: 'bg-lime-500' },
  { page: 'Backlinks', label: 'Backlinks', icon: Link2, color: 'bg-teal-500' },
  { page: 'SEOAudit', label: 'SEO Audit', icon: FileSearch, color: 'bg-sky-500' },
  { page: 'ContentStrategy', label: 'Content Strategy', icon: FileText, color: 'bg-blue-500' },
  { page: 'TrafficAnalytics', label: 'Traffic Analytics', icon: BarChart3, color: 'bg-purple-500' },
  { page: 'SocialMedia', label: 'Social Media', icon: Share2, color: 'bg-pink-500' },
  { page: 'SocialListening', label: 'Social Listening', icon: Radio, color: 'bg-rose-500' },
  { page: 'SocialCalendar', label: 'Social Calendar', icon: Calendar, color: 'bg-fuchsia-500' },
  { page: 'CompetitorAnalysis', label: 'Competitors', icon: Users, color: 'bg-red-500' },
  { page: 'Campaigns', label: 'Campaigns', icon: Megaphone, color: 'bg-amber-500' },
  { page: 'EmailMarketing', label: 'Email Marketing', icon: Mail, color: 'bg-yellow-500' },
  { page: 'Reports', label: 'Reports', icon: FileBarChart, color: 'bg-slate-500' },
  {
    page: 'MarketingHub',
    label: 'Marketing Hub',
    icon: TrendingUp,
    color: 'bg-gradient-to-r from-pink-500 to-violet-500',
  },
  { page: 'ContentStudio', label: 'Content Studio', icon: PenTool, color: 'bg-violet-500' },
  { page: 'LocalSEO', label: 'Local SEO', icon: MapPin, color: 'bg-red-500' },
  { page: 'MediaOutreach', label: 'Media Outreach', icon: Mail, color: 'bg-blue-500' },
  { page: 'Automation', label: 'Automation', icon: Zap, color: 'bg-amber-500' },
  { page: 'MobileHub', label: 'Mobile Hub', icon: Smartphone, color: 'bg-purple-500' },
  { page: 'Settings', label: 'Settings', icon: Settings, color: 'bg-gray-500' },
];

export default function FavoriteLinksManager({ favorites = [], onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const addFavorite = () => {
    const pageInfo = AVAILABLE_PAGES.find((p) => p.page === selectedPage);
    if (!pageInfo) return;

    const newFavorite = {
      page: pageInfo.page,
      label: customLabel || pageInfo.label,
      icon: pageInfo.icon.name || pageInfo.page,
      color: pageInfo.color,
    };

    const updated = [...favorites, newFavorite];
    onUpdate(updated);
    setShowAddModal(false);
    setSelectedPage('');
    setCustomLabel('');
  };

  const removeFavorite = (index) => {
    const updated = favorites.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const getIconComponent = (iconName) => {
    const pageInfo = AVAILABLE_PAGES.find((p) => p.page === iconName || p.icon.name === iconName);
    return pageInfo?.icon || Star;
  };

  const availableToAdd = AVAILABLE_PAGES.filter((p) => !favorites.some((f) => f.page === p.page));

  return (
    <>
      {/* Favorite Links Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {favorites.map((link, index) => {
          const Icon = getIconComponent(link.icon || link.page);
          return (
            <div key={index} className="relative group">
              <Link
                to={createPageUrl(link.page)}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${link.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                    {link.label}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors hidden sm:block" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFavorite(index);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Add Favorite</span>
        </button>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Add Favorite Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Page</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableToAdd.map((p) => {
                    const Icon = p.icon;
                    return (
                      <SelectItem key={p.page} value={p.page}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded ${p.color} flex items-center justify-center`}
                          >
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          {p.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custom Label (optional)</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={
                  selectedPage
                    ? AVAILABLE_PAGES.find((p) => p.page === selectedPage)?.label
                    : 'Enter custom label...'
                }
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={addFavorite} disabled={!selectedPage} className="gap-2">
                <Plus className="w-4 h-4" />
                Add to Favorites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
