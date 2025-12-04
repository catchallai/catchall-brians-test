import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, MapPin, Clock, Eye, MousePointer, ChevronRight, Building2, Briefcase } from "lucide-react";

export default function VisitorProfilesCard() {
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  // SyberJet visitor profiles - high-value aviation prospects
  const allVisitors = [
    {
      id: 1,
      sessionId: 'SJ-2024-8847',
      country: 'United States',
      city: 'Scottsdale, AZ',
      company: 'Desert Aviation Holdings',
      industry: 'Private Aviation',
      pagesViewed: 12,
      timeOnSite: '18m 42s',
      lastPage: '/ownership',
      firstVisit: false,
      visitCount: 4,
      leadScore: 92,
      device: 'Desktop',
      browser: 'Safari',
      referrer: 'google.com',
      entryPage: '/sj30i',
      journey: [
        { page: '/sj30i', time: '4m 12s', scrollDepth: 95 },
        { page: '/performance', time: '3m 28s', scrollDepth: 100 },
        { page: '/interior', time: '2m 45s', scrollDepth: 88 },
        { page: '/ownership', time: '8m 17s', scrollDepth: 100 },
      ]
    },
    {
      id: 2,
      sessionId: 'SJ-2024-8846',
      country: 'United Arab Emirates',
      city: 'Dubai',
      company: 'Al Futtaim Group',
      industry: 'Conglomerate',
      pagesViewed: 8,
      timeOnSite: '12m 15s',
      lastPage: '/contact',
      firstVisit: true,
      visitCount: 1,
      leadScore: 85,
      device: 'iPad',
      browser: 'Safari',
      referrer: 'linkedin.com',
      entryPage: '/',
      journey: [
        { page: '/', time: '1m 30s', scrollDepth: 75 },
        { page: '/sj30i', time: '4m 45s', scrollDepth: 100 },
        { page: '/performance', time: '2m 20s', scrollDepth: 90 },
        { page: '/contact', time: '3m 40s', scrollDepth: 100 },
      ]
    },
    {
      id: 3,
      sessionId: 'SJ-2024-8845',
      country: 'Switzerland',
      city: 'Geneva',
      company: 'Swiss Private Bank',
      industry: 'Financial Services',
      pagesViewed: 6,
      timeOnSite: '9m 30s',
      lastPage: '/interior',
      firstVisit: false,
      visitCount: 2,
      leadScore: 78,
      device: 'Desktop',
      browser: 'Chrome',
      referrer: 'Direct',
      entryPage: '/performance',
      journey: [
        { page: '/performance', time: '3m 10s', scrollDepth: 100 },
        { page: '/sj30i', time: '2m 55s', scrollDepth: 85 },
        { page: '/interior', time: '3m 25s', scrollDepth: 92 },
      ]
    },
    {
      id: 4,
      sessionId: 'SJ-2024-8844',
      country: 'United Kingdom',
      city: 'London',
      company: 'Unknown',
      industry: 'Unknown',
      pagesViewed: 3,
      timeOnSite: '2m 45s',
      lastPage: '/sj30i',
      firstVisit: true,
      visitCount: 1,
      leadScore: 45,
      device: 'Mobile',
      browser: 'Chrome',
      referrer: 'twitter.com',
      entryPage: '/',
      journey: [
        { page: '/', time: '0m 45s', scrollDepth: 40 },
        { page: '/sj30i', time: '2m 00s', scrollDepth: 55 },
      ],
      daysAgo: 2
    },
    {
      id: 5,
      sessionId: 'SJ-2024-8820',
      country: 'Germany',
      city: 'Munich',
      company: 'BMW Group',
      industry: 'Automotive',
      pagesViewed: 10,
      timeOnSite: '14m 20s',
      lastPage: '/ownership',
      firstVisit: false,
      visitCount: 3,
      leadScore: 88,
      device: 'Desktop',
      browser: 'Firefox',
      referrer: 'google.de',
      entryPage: '/sj30i',
      journey: [
        { page: '/sj30i', time: '5m 10s', scrollDepth: 100 },
        { page: '/performance', time: '4m 30s', scrollDepth: 95 },
        { page: '/ownership', time: '4m 40s', scrollDepth: 100 },
      ],
      daysAgo: 35
    },
    {
      id: 6,
      sessionId: 'SJ-2024-8795',
      country: 'Singapore',
      city: 'Singapore',
      company: 'Temasek Holdings',
      industry: 'Investment',
      pagesViewed: 15,
      timeOnSite: '22m 15s',
      lastPage: '/contact',
      firstVisit: true,
      visitCount: 1,
      leadScore: 95,
      device: 'Desktop',
      browser: 'Chrome',
      referrer: 'bloomberg.com',
      entryPage: '/',
      journey: [
        { page: '/', time: '2m 00s', scrollDepth: 80 },
        { page: '/sj30i', time: '6m 15s', scrollDepth: 100 },
        { page: '/performance', time: '5m 00s', scrollDepth: 100 },
        { page: '/interior', time: '4m 00s', scrollDepth: 90 },
        { page: '/contact', time: '5m 00s', scrollDepth: 100 },
      ],
      daysAgo: 42
    },
    {
      id: 7,
      sessionId: 'SJ-2024-8760',
      country: 'Canada',
      city: 'Toronto',
      company: 'Rogers Communications',
      industry: 'Telecommunications',
      pagesViewed: 7,
      timeOnSite: '11m 30s',
      lastPage: '/performance',
      firstVisit: false,
      visitCount: 2,
      leadScore: 72,
      device: 'Desktop',
      browser: 'Edge',
      referrer: 'Direct',
      entryPage: '/sj30i',
      journey: [
        { page: '/sj30i', time: '4m 20s', scrollDepth: 85 },
        { page: '/interior', time: '3m 10s', scrollDepth: 75 },
        { page: '/performance', time: '4m 00s', scrollDepth: 90 },
      ],
      daysAgo: 55
    },
    {
      id: 8,
      sessionId: 'SJ-2024-8710',
      country: 'Australia',
      city: 'Sydney',
      company: 'Macquarie Group',
      industry: 'Financial Services',
      pagesViewed: 9,
      timeOnSite: '16m 45s',
      lastPage: '/ownership',
      firstVisit: true,
      visitCount: 1,
      leadScore: 82,
      device: 'iPad',
      browser: 'Safari',
      referrer: 'linkedin.com',
      entryPage: '/',
      journey: [
        { page: '/', time: '1m 45s', scrollDepth: 70 },
        { page: '/sj30i', time: '5m 30s', scrollDepth: 100 },
        { page: '/performance', time: '4m 30s', scrollDepth: 95 },
        { page: '/ownership', time: '5m 00s', scrollDepth: 100 },
      ],
      daysAgo: 75
    },
    {
      id: 9,
      sessionId: 'SJ-2024-8680',
      country: 'Japan',
      city: 'Tokyo',
      company: 'Mitsubishi Corporation',
      industry: 'Conglomerate',
      pagesViewed: 11,
      timeOnSite: '19m 10s',
      lastPage: '/contact',
      firstVisit: false,
      visitCount: 5,
      leadScore: 91,
      device: 'Desktop',
      browser: 'Chrome',
      referrer: 'google.co.jp',
      entryPage: '/performance',
      journey: [
        { page: '/performance', time: '4m 50s', scrollDepth: 100 },
        { page: '/sj30i', time: '5m 20s', scrollDepth: 100 },
        { page: '/interior', time: '4m 00s', scrollDepth: 85 },
        { page: '/contact', time: '5m 00s', scrollDepth: 100 },
      ],
      daysAgo: 85
    },
  ];

  // Filter visitors based on date range
  const visitors = allVisitors.filter(v => {
    const days = parseInt(dateRange);
    return (v.daysAgo || 0) <= days;
  });

  const getLeadScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-violet-500" />
            Visitor Profiles
          </CardTitle>
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList className="h-8">
              <TabsTrigger value="30" className="text-xs px-2 h-6">30 Days</TabsTrigger>
              <TabsTrigger value="60" className="text-xs px-2 h-6">60 Days</TabsTrigger>
              <TabsTrigger value="90" className="text-xs px-2 h-6">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-xs text-gray-500 mt-1">{visitors.length} visitor{visitors.length !== 1 ? 's' : ''} in last {dateRange} days</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visitors.map((visitor) => (
            <div 
              key={visitor.id}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedVisitor?.id === visitor.id 
                  ? 'border-violet-300 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-700' 
                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedVisitor(selectedVisitor?.id === visitor.id ? null : visitor)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{visitor.sessionId}</span>
                    <Badge className={`text-xs ${getLeadScoreColor(visitor.leadScore)}`}>
                      Score: {visitor.leadScore}
                    </Badge>
                    {visitor.firstVisit && (
                      <Badge variant="outline" className="text-xs">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{visitor.city}, {visitor.country}</span>
                  </div>
                  {visitor.company !== 'Unknown' && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{visitor.company}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-xs">{visitor.industry}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="w-3 h-3" />
                    {visitor.pagesViewed} pages
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {visitor.timeOnSite}
                  </div>
                </div>
              </div>

              {/* Expanded Journey View */}
              {selectedVisitor?.id === visitor.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Device:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{visitor.device}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Browser:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{visitor.browser}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Referrer:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{visitor.referrer}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Visits:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{visitor.visitCount}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs font-medium text-gray-500 mb-2">Session Journey</p>
                  <div className="space-y-2">
                    {visitor.journey.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-medium text-violet-600">
                          {idx + 1}
                        </div>
                        <div className="flex-1 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{step.page}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{step.time}</span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {step.scrollDepth}%
                            </span>
                          </div>
                        </div>
                        {idx < visitor.journey.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}