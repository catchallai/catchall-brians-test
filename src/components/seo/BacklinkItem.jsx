import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link2 } from "lucide-react";

export default function BacklinkItem({ backlink }) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    lost: "bg-red-100 text-red-700",
    broken: "bg-amber-100 text-amber-700",
  };

  const typeColors = {
    dofollow: "bg-emerald-100 text-emerald-700",
    nofollow: "bg-gray-100 text-gray-600",
    ugc: "bg-blue-100 text-blue-700",
    sponsored: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all">
      <div className="p-2 rounded-lg bg-violet-50">
        <Link2 className="w-4 h-4 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">{backlink.source_domain}</h4>
          <Badge className={`${statusColors[backlink.status]} text-xs border-0`}>
            {backlink.status}
          </Badge>
          {backlink.link_type && (
            <Badge className={`${typeColors[backlink.link_type]} text-xs border-0`}>
              {backlink.link_type}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mb-2">{backlink.source_url}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>DA: <span className="font-medium text-gray-600">{backlink.domain_authority || '-'}</span></span>
          {backlink.anchor_text && (
            <span>Anchor: <span className="font-medium text-gray-600">"{backlink.anchor_text}"</span></span>
          )}
        </div>
      </div>
      <a 
        href={backlink.source_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </a>
    </div>
  );
}