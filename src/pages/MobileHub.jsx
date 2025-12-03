import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell, Search, Plus, TrendingUp, TrendingDown, Users, Target, MessageSquare,
  Calendar, BarChart3, Send, Image, Twitter, Linkedin, Facebook, Instagram,
  Phone, Mail, Building2, DollarSign, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Home, Radio, FileText, Settings, Loader2, RefreshCw,
  Smartphone, Zap, Eye, Heart, Share2, MessageCircle
} from "lucide-react";

export default function MobileHub() {
  const [activeTab, setActiveTab] = useState('home');
  const [showComposer, setShowComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'linkedin']);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-mobile'],
    queryFn: () => base44.entities.Contact.list('-created_date', 10),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-mobile'],
    queryFn: () => base44.entities.Deal.list('-created_date', 10),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-mobile'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false }, '-created_date', 20),
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['mentions-mobile'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 15),
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduled-posts-mobile'],
    queryFn: () => base44.entities.ScheduledPost.filter({ status: 'scheduled' }, '-scheduled_time', 10),
  });

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts-mobile'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 10),
  });

  const markNotificationRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-mobile'] }),
  });

  const createPost = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ScheduledPost.create({
        content: data.content,
        platforms: data.platforms,
        status: 'scheduled',
        scheduled_time: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts-mobile'] });
      setShowComposer(false);
      setPostContent('');
    },
  });

  // Quick stats
  const totalDealsValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const newContactsToday = contacts.filter(c => {
    const today = new Date().toDateString();
    return new Date(c.created_date).toDateString() === today;
  }).length;

  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'twitter': return 'bg-gray-900';
      case 'linkedin': return 'bg-blue-600';
      case 'facebook': return 'bg-blue-500';
      case 'instagram': return 'bg-gradient-to-br from-purple-600 to-orange-400';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-violet-100 text-violet-600 font-medium">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {user?.full_name || 'Welcome'}
              </p>
              <p className="text-xs text-gray-500">CatchAll Mobile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab('alerts')}>
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </Button>
            <Button 
              size="icon" 
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowComposer(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="home" className="mt-0 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/80">Pipeline Value</p>
                      <p className="text-xl font-bold">${(totalDealsValue / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-white/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/80">New Contacts</p>
                      <p className="text-xl font-bold">{newContactsToday}</p>
                    </div>
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => setShowComposer(true)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20"
                  >
                    <Send className="w-5 h-5 text-violet-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Post</span>
                  </button>
                  <Link to={createPageUrl('Contacts')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">CRM</span>
                  </Link>
                  <Link to={createPageUrl('SocialListening')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <Radio className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Listen</span>
                  </Link>
                  <Link to={createPageUrl('TrafficAnalytics')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Stats</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Mentions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Mentions</h3>
                  <Link to={createPageUrl('SocialListening')} className="text-xs text-violet-600">View All</Link>
                </div>
                <div className="space-y-3">
                  {mentions.slice(0, 3).map((mention) => {
                    const PlatformIcon = platformIcons[mention.platform] || MessageSquare;
                    return (
                      <div key={mention.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg ${getPlatformColor(mention.platform)} flex items-center justify-center shrink-0`}>
                          <PlatformIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            @{mention.author || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">{mention.content}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {mention.likes || 0}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {mention.comments || 0}
                            </span>
                            <Badge 
                              className={`text-xs ${
                                mention.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                                mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {mention.sentiment || 'neutral'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {mentions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No recent mentions</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Posts */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled Posts</h3>
                  <Link to={createPageUrl('SocialCalendar')} className="text-xs text-violet-600">View All</Link>
                </div>
                <div className="space-y-2">
                  {scheduledPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex -space-x-1">
                        {post.platforms?.slice(0, 2).map((platform) => {
                          const Icon = platformIcons[platform] || MessageSquare;
                          return (
                            <div key={platform} className={`w-6 h-6 rounded-full ${getPlatformColor(platform)} flex items-center justify-center ring-2 ring-white dark:ring-gray-800`}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{post.content}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.scheduled_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {scheduledPosts.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No scheduled posts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crm" className="mt-0 space-y-4">
            {/* CRM Quick Access */}
            <div className="flex gap-2 mb-4">
              <Link to={createPageUrl('Contacts')} className="flex-1">
                <Card className="h-full">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto text-violet-600 mb-2" />
                    <p className="text-sm font-medium">Contacts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to={createPageUrl('Deals')} className="flex-1">
                <Card className="h-full">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                    <p className="text-sm font-medium">Deals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{deals.length}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Contacts */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Contacts</h3>
                <div className="space-y-2">
                  {contacts.slice(0, 5).map((contact) => (
                    <Link 
                      key={contact.id} 
                      to={createPageUrl('Contacts') + `?id=${contact.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-violet-100 text-violet-600">
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                      </div>
                      <div className="flex gap-1">
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Phone className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Deals */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Active Deals</h3>
                <div className="space-y-2">
                  {deals.slice(0, 5).map((deal) => (
                    <Link 
                      key={deal.id} 
                      to={createPageUrl('Deals') + `?id=${deal.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {deal.title}
                        </p>
                        <p className="text-xs text-gray-500">{deal.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">${(deal.value || 0).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-4">
            {/* Connected Accounts */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Connected Accounts</h3>
                <div className="space-y-2">
                  {socialAccounts.map((account) => {
                    const PlatformIcon = platformIcons[account.platform] || MessageSquare;
                    return (
                      <div key={account.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className={`w-10 h-10 rounded-lg ${getPlatformColor(account.platform)} flex items-center justify-center`}>
                          <PlatformIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">@{account.account_name}</p>
                          <p className="text-xs text-gray-500">{account.followers?.toLocaleString() || 0} followers</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                      </div>
                    );
                  })}
                  {socialAccounts.length === 0 && (
                    <div className="text-center py-6">
                      <Share2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No accounts connected</p>
                      <Link to={createPageUrl('SocialMedia')}>
                        <Button size="sm" className="mt-2">Connect Account</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Compose Button */}
            <Button 
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowComposer(true)}
            >
              <Send className="w-4 h-4" />
              Create New Post
            </Button>

            {/* Social Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Eye className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">12.4K</p>
                  <p className="text-xs text-gray-500">Reach</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">892</p>
                  <p className="text-xs text-gray-500">Engagements</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">+8.2%</p>
                  <p className="text-xs text-gray-500">Growth</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0 space-y-4">
            {/* Notifications */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <Badge variant="outline">{notifications.length} unread</Badge>
                </div>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="flex gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl cursor-pointer"
                      onClick={() => markNotificationRead.mutate(notification.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        notification.type === 'alert' ? 'bg-red-100' :
                        notification.type === 'success' ? 'bg-emerald-100' :
                        'bg-blue-100'
                      }`}>
                        {notification.type === 'alert' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : notification.type === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-0 space-y-4">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500">Visitors</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">8,492</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12.3%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-violet-600" />
                    <span className="text-xs text-gray-500">Page Views</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24.1K</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+8.7%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">Conversions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">142</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+5.2%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-gray-500">Avg. Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">3:42</p>
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <TrendingDown className="w-3 h-3" />
                    <span>-2.1%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Analytics</h3>
                <div className="space-y-2">
                  <Link to={createPageUrl('TrafficAnalytics')} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                      <span className="font-medium text-sm">Traffic Analytics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link to={createPageUrl('SEODashboard')} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-sm">SEO Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link to={createPageUrl('SocialMedia')} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-sm">Social Analytics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'home' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'crm' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">CRM</span>
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'social' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-500'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs font-medium">Social</span>
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative ${
              activeTab === 'alerts' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-500'
            }`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className="text-xs font-medium">Alerts</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'stats' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </div>

      {/* Post Composer Sheet */}
      <Sheet open={showComposer} onOpenChange={setShowComposer}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Create Post</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {/* Platform Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post to:</p>
              <div className="flex gap-2">
                {['twitter', 'linkedin', 'facebook', 'instagram'].map((platform) => {
                  const Icon = platformIcons[platform];
                  const isSelected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        } else {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        }
                      }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isSelected 
                          ? `${getPlatformColor(platform)} text-white ring-2 ring-offset-2 ring-violet-500` 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <Textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Image className="w-5 h-5" />
                  </Button>
                </div>
                <span className={`text-sm ${postContent.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>
                  {postContent.length}/280
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
                disabled={!postContent.trim() || selectedPlatforms.length === 0 || createPost.isPending}
                onClick={() => createPost.mutate({ content: postContent, platforms: selectedPlatforms })}
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post Now
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}