import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, Clock } from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export default function SalesActivityFeed({ calls, reservations, contacts, deals }) {
  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const getDealName = (dealId) => {
    const deal = deals.find(d => d.id === dealId);
    return deal ? deal.title : null;
  };

  const getDateLabel = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
  };

  // Combine and sort activities
  const activities = [
    ...calls.map(c => ({
      type: 'call',
      date: c.call_date,
      data: c
    })),
    ...reservations.map(r => ({
      type: 'reservation',
      date: r.reservation_date,
      data: r
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No activity yet</p>
          ) : (
            activities.map((activity, i) => (
              <div key={i} className="flex gap-3 border-b last:border-0 pb-4 last:pb-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'call' ? 'bg-emerald-100' : 'bg-violet-100'
                }`}>
                  {activity.type === 'call' ? (
                    <Phone className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Calendar className="w-5 h-5 text-violet-600" />
                  )}
                </div>
                <div className="flex-1">
                  {activity.type === 'call' ? (
                    <>
                      <p className="font-medium text-sm">
                        {activity.data.call_type === 'outbound' ? 'Called' : 'Received call from'} {getContactName(activity.data.contact_id)}
                      </p>
                      {activity.data.notes && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.data.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                          {activity.data.call_status.replace('_', ' ')}
                        </Badge>
                        {activity.data.duration_minutes && (
                          <span className="text-xs text-gray-500">{activity.data.duration_minutes} min</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm">
                        {activity.data.title} - {getContactName(activity.data.contact_id)}
                      </p>
                      {activity.data.product_service && (
                        <p className="text-xs text-gray-600 mt-1">{activity.data.product_service}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs bg-violet-100 text-violet-700 border-0">
                          {activity.data.status}
                        </Badge>
                        {activity.data.value && (
                          <span className="text-xs text-gray-500">${activity.data.value.toLocaleString()}</span>
                        )}
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{getDateLabel(activity.date)} • {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}