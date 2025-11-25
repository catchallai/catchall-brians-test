import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Mail, CheckSquare, Tag, Bell, UserPlus, ArrowRight } from "lucide-react";

const triggerLabels = {
  deal_stage_change: 'Deal Stage Changed',
  contact_created: 'Contact Created',
  contact_status_change: 'Contact Status Changed',
  activity_completed: 'Activity Completed',
  email_opened: 'Email Opened',
  email_clicked: 'Email Clicked',
  lead_score_threshold: 'Lead Score Threshold',
};

const actionIcons = {
  create_task: CheckSquare,
  send_email: Mail,
  update_contact: UserPlus,
  update_deal: Zap,
  assign_owner: UserPlus,
  add_tag: Tag,
  notify: Bell,
};

const actionLabels = {
  create_task: 'Create Task',
  send_email: 'Send Email',
  update_contact: 'Update Contact',
  update_deal: 'Update Deal',
  assign_owner: 'Assign Owner',
  add_tag: 'Add Tag',
  notify: 'Send Notification',
};

export default function AutomationRuleCard({ rule, onToggle, onClick }) {
  const ActionIcon = actionIcons[rule.action_type] || Zap;

  return (
    <Card 
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            rule.is_active ? 'bg-violet-100' : 'bg-gray-100'
          }`}>
            <Zap className={`w-5 h-5 ${rule.is_active ? 'text-violet-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
            {rule.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{rule.description}</p>
            )}
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {triggerLabels[rule.trigger_type]}
                {rule.trigger_value && `: ${rule.trigger_value}`}
              </Badge>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <Badge className="text-xs bg-violet-100 text-violet-700 border-0 flex items-center gap-1">
                <ActionIcon className="w-3 h-3" />
                {actionLabels[rule.action_type]}
              </Badge>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Run {rule.run_count || 0} times
            </p>
          </div>
        </div>
        
        <Switch
          checked={rule.is_active}
          onCheckedChange={(checked) => {
            onToggle(rule.id, checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Card>
  );
}