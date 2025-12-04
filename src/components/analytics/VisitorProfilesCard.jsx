import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, MapPin, Clock, Eye, MousePointer, ChevronRight, Building2, Briefcase } from "lucide-react";

export default function VisitorProfilesCard() {
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  // Generate realistic visitor data
  const generateVisitors = () => {
    const companies = [
      { company: 'Desert Aviation Holdings', industry: 'Private Aviation', city: 'Scottsdale, AZ', country: 'United States' },
      { company: 'Al Futtaim Group', industry: 'Conglomerate', city: 'Dubai', country: 'United Arab Emirates' },
      { company: 'Swiss Private Bank', industry: 'Financial Services', city: 'Geneva', country: 'Switzerland' },
      { company: 'Unknown', industry: 'Unknown', city: 'London', country: 'United Kingdom' },
      { company: 'BMW Group', industry: 'Automotive', city: 'Munich', country: 'Germany' },
      { company: 'Temasek Holdings', industry: 'Investment', city: 'Singapore', country: 'Singapore' },
      { company: 'Rogers Communications', industry: 'Telecommunications', city: 'Toronto', country: 'Canada' },
      { company: 'Macquarie Group', industry: 'Financial Services', city: 'Sydney', country: 'Australia' },
      { company: 'Mitsubishi Corporation', industry: 'Conglomerate', city: 'Tokyo', country: 'Japan' },
      { company: 'Berkshire Partners', industry: 'Private Equity', city: 'Boston, MA', country: 'United States' },
      { company: 'LVMH', industry: 'Luxury Goods', city: 'Paris', country: 'France' },
      { company: 'Ambani Group', industry: 'Conglomerate', city: 'Mumbai', country: 'India' },
      { company: 'Samsung C&T', industry: 'Construction', city: 'Seoul', country: 'South Korea' },
      { company: 'Aramco', industry: 'Energy', city: 'Riyadh', country: 'Saudi Arabia' },
      { company: 'Credit Suisse', industry: 'Banking', city: 'Zurich', country: 'Switzerland' },
      { company: 'Blackstone', industry: 'Investment', city: 'New York, NY', country: 'United States' },
      { company: 'KKR & Co', industry: 'Private Equity', city: 'San Francisco, CA', country: 'United States' },
      { company: 'Softbank', industry: 'Technology', city: 'Tokyo', country: 'Japan' },
      { company: 'Unknown', industry: 'Unknown', city: 'Miami, FL', country: 'United States' },
      { company: 'Carlyle Group', industry: 'Private Equity', city: 'Washington, DC', country: 'United States' },
      { company: 'Unknown', industry: 'Unknown', city: 'Hong Kong', country: 'Hong Kong' },
      { company: 'Volkswagen AG', industry: 'Automotive', city: 'Wolfsburg', country: 'Germany' },
      { company: 'Shell', industry: 'Energy', city: 'The Hague', country: 'Netherlands' },
      { company: 'Unknown', industry: 'Unknown', city: 'Monaco', country: 'Monaco' },
      { company: 'Tata Group', industry: 'Conglomerate', city: 'Mumbai', country: 'India' },
    ];
    
    const devices = ['Desktop', 'iPad', 'Mobile'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const referrers = ['google.com', 'linkedin.com', 'Direct', 'bloomberg.com', 'twitter.com', 'facebook.com', 'bing.com'];
    const pages = ['/', '/sj30i', '/performance', '/interior', '/ownership', '/contact', '/gallery', '/specs'];
    
    const visitors = [];
    let sessionNum = 8900;
    
    // Generate ~45 visitors for 30 days, ~75 for 60 days, ~120 for 90 days
    for (let i = 0; i < 120; i++) {
      const companyData = companies[i % companies.length];
      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const pagesViewed = Math.floor(Math.random() * 12) + 2;
      const timeMinutes = Math.floor(Math.random() * 20) + 2;
      const timeSeconds = Math.floor(Math.random() * 60);
      const leadScore = companyData.company === 'Unknown' 
        ? Math.floor(Math.random() * 40) + 30 
        : Math.floor(Math.random() * 30) + 65;
      
      const journey = [];
      const journeyLength = Math.min(pagesViewed, 4);
      for (let j = 0; j < journeyLength; j++) {
        journey.push({
          page: pages[Math.floor(Math.random() * pages.length)],
          time: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s`,
          scrollDepth: Math.floor(Math.random() * 40) + 60
        });
      }
      
      visitors.push({
        id: i + 1,
        sessionId: `SJ-2024-${sessionNum - i}`,
        ...companyData,
        pagesViewed,
        timeOnSite: `${timeMinutes}m ${timeSeconds}s`,
        lastPage: pages[Math.floor(Math.random() * pages.length)],
        firstVisit: Math.random() > 0.6,
        visitCount: Math.floor(Math.random() * 5) + 1,
        leadScore,
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        entryPage: pages[Math.floor(Math.random() * pages.length)],
        journey,
        daysAgo
      });
    }
    
    return visitors.sort((a, b) => a.daysAgo - b.daysAgo);
  };
  
  const allVisitors = generateVisitors();

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
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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