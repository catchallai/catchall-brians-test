import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings, Sparkles, Loader2, Search, Link2, TrendingUp, Globe, Clock } from "lucide-react";
import SEOScoreGauge from './SEOScoreGauge';
import WebsiteScreenshot from './WebsiteScreenshot';
import moment from 'moment';

export default function WebsiteCard({ 
  website, 
  keywords, 
  backlinks, 
  onEdit, 
  onAnalyze, 
  isAnalyzing,
  onScreenshotUpdate
}) {
  const top10Keywords = keywords.filter(k => k.current_position && k.current_position <= 10).length;
  
  const formatNumber = (num) => {
    if (!num) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all overflow-hidden">
      {/* Website Screenshot */}
      <WebsiteScreenshot 
        url={website.url}
        screenshotUrl={website.screenshot_url}
        onScreenshotCaptured={onScreenshotUpdate}
        className="h-32"
      />
      
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
              {website.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{website.name}</CardTitle>
              <a 
                href={website.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-600 flex items-center gap-1"
              >
                {website.url?.replace(/^https?:\/\//, '').slice(0, 30)}
                <ExternalLink className="w-3 h-3" />
              </a>
              {website.last_audit_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    Audited {moment(website.last_audit_date).fromNow()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={onAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
              onClick={onEdit}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-center mb-6">
          <SEOScoreGauge score={website.seo_score || 0} label="SEO Score" size="md" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Keywords</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{keywords.length}</p>
            <p className="text-xs text-emerald-600">{top10Keywords} in top 10</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Link2 className="w-3.5 h-3.5" />
              <span className="text-xs">Backlinks</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{backlinks.length}</p>
            <p className="text-xs text-gray-500">
              {backlinks.filter(b => b.status === 'active').length} active
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs">Traffic</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatNumber(website.organic_traffic)}</p>
            <p className="text-xs text-gray-500">monthly</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs">DA</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{website.domain_authority || '-'}</p>
            <p className="text-xs text-gray-500">domain auth</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}