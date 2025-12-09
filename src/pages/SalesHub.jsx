import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, Calendar, Users, DollarSign, TrendingUp, 
  Plus, PhoneCall, Clock, CheckCircle, AlertCircle,
  PhoneIncoming, PhoneOutgoing, PhoneMissed
} from "lucide-react";
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import ReservationModal from '@/components/sales/ReservationModal';
import SalesCallCard from '@/components/sales/SalesCallCard';
import ReservationCard from '@/components/sales/ReservationCard';
import SalesActivityFeed from '@/components/sales/SalesActivityFeed';
import FollowUpPanel from '@/components/sales/FollowUpPanel';
import EmptyState from '@/components/ui/EmptyState';

export default function SalesHub() {
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const queryClient = useQueryClient();

  const { data: salesCalls = [] } = useQuery({
    queryKey: ['sales-calls'],
    queryFn: () => base44.entities.SalesCall.list('-call_date', 100),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['sales-reservations'],
    queryFn: () => base44.entities.SalesReservation.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['sales-followups'],
    queryFn: () => base44.entities.SalesFollowUp.list('-scheduled_date', 100),
  });

  const createCallMutation = useMutation({
    mutationFn: (data) => editingCall 
      ? base44.entities.SalesCall.update(editingCall.id, data)
      : base44.entities.SalesCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
      setShowCallLogger(false);
      setEditingCall(null);
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: (data) => editingReservation
      ? base44.entities.SalesReservation.update(editingReservation.id, data)
      : base44.entities.SalesReservation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reservations'] });
      setShowReservationModal(false);
      setEditingReservation(null);
    },
  });

  const generateFollowUpsMutation = useMutation({
    mutationFn: async () => {
      const callsNeedingFollowup = salesCalls.filter(c => 
        c.next_action && c.call_status === 'completed'
      ).slice(0, 5);

      const reservationsNeedingFollowup = reservations.filter(r => 
        r.status === 'pending' || r.status === 'confirmed'
      ).slice(0, 5);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these sales activities and generate smart follow-up actions:

Recent Calls Needing Follow-up:
${callsNeedingFollowup.map(c => `
- Contact: ${getContactName(c.contact_id)}
- Call date: ${c.call_date}
- Duration: ${c.duration_minutes} min
- Sentiment: ${c.sentiment}
- Notes: ${c.notes}
- Next action: ${c.next_action}
`).join('\n')}

Active Reservations:
${reservationsNeedingFollowup.map(r => `
- Contact: ${getContactName(r.contact_id)}
- Title: ${r.title}
- Type: ${r.reservation_type}
- Date: ${r.reservation_date}
- Value: $${r.value}
- Status: ${r.status}
- Payment: ${r.payment_status}
`).join('\n')}

For each item, generate follow-up actions with:
1. follow_up_type (email/call/task/meeting)
2. priority (low/medium/high/urgent)
3. suggested_days_from_now (how many days from today)
4. action_description (what to do)
5. personalized_message (tailored message template with contact name placeholder)
6. reasoning (why this timing and approach)
7. sales_stage (prospecting/qualification/proposal/negotiation/closing/retention)

Consider:
- Call sentiment and outcomes
- Reservation urgency and value
- Payment status
- Time since last contact
- Next actions mentioned`,
        response_json_schema: {
          type: "object",
          properties: {
            follow_ups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_type: { type: "string" },
                  source_id: { type: "string" },
                  contact_id: { type: "string" },
                  follow_up_type: { type: "string" },
                  priority: { type: "string" },
                  suggested_days_from_now: { type: "number" },
                  action_description: { type: "string" },
                  personalized_message: { type: "string" },
                  reasoning: { type: "string" },
                  sales_stage: { type: "string" }
                }
              }
            }
          }
        }
      });

      const followUpPromises = analysis.follow_ups.map(async (fu) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + fu.suggested_days_from_now);

        const sourceData = fu.source_type === 'call'
          ? callsNeedingFollowup.find(c => c.id === fu.source_id)
          : reservationsNeedingFollowup.find(r => r.id === fu.source_id);

        return base44.entities.SalesFollowUp.create({
          contact_id: fu.contact_id,
          deal_id: sourceData?.deal_id,
          call_id: fu.source_type === 'call' ? fu.source_id : undefined,
          reservation_id: fu.source_type === 'reservation' ? fu.source_id : undefined,
          follow_up_type: fu.follow_up_type,
          priority: fu.priority,
          scheduled_date: scheduledDate.toISOString(),
          ai_suggested_time: scheduledDate.toISOString(),
          action_description: fu.action_description,
          ai_suggested_message: fu.personalized_message,
          reasoning: fu.reasoning,
          sales_stage: fu.sales_stage,
          status: 'pending'
        });
      });

      await Promise.all(followUpPromises);
      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: (id) => base44.entities.SalesFollowUp.update(id, {
      status: 'completed',
      completed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  const sendFollowUpEmailMutation = useMutation({
    mutationFn: async (followUp) => {
      const contact = contacts.find(c => c.id === followUp.contact_id);
      if (!contact?.email) {
        throw new Error('Contact email not found');
      }

      await base44.integrations.Core.SendEmail({
        to: contact.email,
        subject: `Follow-up: ${followUp.action_description}`,
        body: followUp.ai_suggested_message
      });

      await base44.entities.SalesFollowUp.update(followUp.id, {
        sent: true,
        status: 'completed',
        completed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  // Calculate stats
  const today = new Date();
  const todayCalls = salesCalls.filter(c => {
    const callDate = new Date(c.call_date);
    return callDate.toDateString() === today.toDateString();
  });

  const completedCalls = salesCalls.filter(c => c.call_status === 'completed');
  const activeReservations = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
  const totalReservationValue = activeReservations.reduce((sum, r) => sum + (r.value || 0), 0);

  const callStats = {
    total: salesCalls.length,
    today: todayCalls.length,
    completed: completedCalls.length,
    missed: salesCalls.filter(c => c.call_status === 'no_answer' || c.call_type === 'missed').length,
  };

  const reservationStats = {
    total: reservations.length,
    active: activeReservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    value: totalReservationValue,
  };

  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const getDealName = (dealId) => {
    const deal = deals.find(d => d.id === dealId);
    return deal ? deal.title : null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Hub</h1>
          <p className="text-gray-500 mt-1">Manage calls, contacts, and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => { setEditingCall(null); setShowCallLogger(true); }}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Phone className="w-4 h-4" />
            Log Call
          </Button>
          <Button 
            onClick={() => { setEditingReservation(null); setShowReservationModal(true); }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Calls</p>
                <p className="text-2xl font-bold text-gray-900">{callStats.today}</p>
              </div>
              <PhoneCall className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{callStats.total}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Reservations</p>
                <p className="text-2xl font-bold text-gray-900">{reservationStats.active}</p>
              </div>
              <Calendar className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reservation Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${reservationStats.value.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="calls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
          <TabsTrigger value="calls">Call Log</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="followups" className="space-y-4">
          <FollowUpPanel
            followUps={followUps}
            contacts={contacts}
            onGenerate={() => generateFollowUpsMutation.mutate()}
            onComplete={(id) => completeFollowUpMutation.mutate(id)}
            onSend={(followUp) => sendFollowUpEmailMutation.mutate(followUp)}
            isGenerating={generateFollowUpsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          {salesCalls.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No calls logged"
              description="Start logging your sales calls to track conversations and follow-ups."
              actionLabel="Log First Call"
              onAction={() => setShowCallLogger(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salesCalls.map(call => (
                <SalesCallCard
                  key={call.id}
                  call={call}
                  contactName={getContactName(call.contact_id)}
                  dealName={getDealName(call.deal_id)}
                  onEdit={() => { setEditingCall(call); setShowCallLogger(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          {reservations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No reservations"
              description="Create reservations to track product holds, demos, and scheduled meetings."
              actionLabel="Create Reservation"
              onAction={() => setShowReservationModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map(reservation => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  contactName={getContactName(reservation.contact_id)}
                  dealName={getDealName(reservation.deal_id)}
                  onEdit={() => { setEditingReservation(reservation); setShowReservationModal(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <SalesActivityFeed
            calls={salesCalls}
            reservations={reservations}
            contacts={contacts}
            deals={deals}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CallLoggerModal
        open={showCallLogger}
        onClose={() => { setShowCallLogger(false); setEditingCall(null); }}
        call={editingCall}
        contacts={contacts}
        deals={deals}
        onSave={(data) => createCallMutation.mutate(data)}
        isLoading={createCallMutation.isPending}
      />

      <ReservationModal
        open={showReservationModal}
        onClose={() => { setShowReservationModal(false); setEditingReservation(null); }}
        reservation={editingReservation}
        contacts={contacts}
        deals={deals}
        onSave={(data) => createReservationMutation.mutate(data)}
        isLoading={createReservationMutation.isPending}
      />
    </div>
  );
}