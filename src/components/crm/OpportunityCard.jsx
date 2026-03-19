import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, DollarSign, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const stageConfig = {
  new_lead: {
    label: 'New Lead',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  },
  email_list: {
    label: 'Email List',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  media_inquiry: {
    label: 'Media Inquiry',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  reservation_request: {
    label: 'Reservation Request',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
  no_response: {
    label: 'No Response - Follow Up',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  },
  closed: {
    label: 'Closed',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  not_interested: {
    label: 'Not Interested',
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  },
};

export default function OpportunityCard({ opportunity, onEdit, onDelete }) {
  const stageInfo = stageConfig[opportunity.stage] || stageConfig.new_lead;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group" onClick={onEdit}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {opportunity.contact_name || 'No Name'}
          </h3>
          {opportunity.contact_phone && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Phone className="w-3 h-3" />
              {opportunity.contact_phone}
            </div>
          )}
        </div>

        {/* Email */}
        {opportunity.contact_email && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-3 h-3" />
            <span className="truncate">{opportunity.contact_email}</span>
          </div>
        )}

        {/* Source & Value */}
        <div className="space-y-1">
          {opportunity.source && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Opportunity Source:</span> {opportunity.source}
            </div>
          )}
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
            <DollarSign className="w-4 h-4" />
            {opportunity.value?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
