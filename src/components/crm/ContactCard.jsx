import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, Phone } from "lucide-react";

export default function ContactCard({ contact, company, onClick }) {
  const statusColors = {
    lead: "bg-blue-100 text-blue-700 border-blue-200",
    prospect: "bg-amber-100 text-amber-700 border-amber-200",
    customer: "bg-emerald-100 text-emerald-700 border-emerald-200",
    churned: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Card 
      className="p-5 border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-gray-100">
          <AvatarImage src={contact.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
              {contact.first_name} {contact.last_name}
            </h3>
            <Badge className={`${statusColors[contact.status]} border text-xs font-medium`}>
              {contact.status}
            </Badge>
          </div>
          {contact.job_title && (
            <p className="text-sm text-gray-500 mb-2">{contact.job_title}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {contact.email}
              </span>
            )}
            {company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {company.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}