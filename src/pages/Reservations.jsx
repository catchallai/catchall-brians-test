import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import ReservationModal from '@/components/sales/ReservationModal';
import ReservationCard from '@/components/sales/ReservationCard';
import EmptyState from '@/components/ui/EmptyState';
import ReservationCalendarView from '@/components/sales/ReservationCalendarView';
import ReservationPaymentTracker from '@/components/sales/ReservationPaymentTracker';

export default function Reservations() {
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const queryClient = useQueryClient();

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

  const createReservationMutation = useMutation({
    mutationFn: async (data) => {
      const reservation = editingReservation
        ? await base44.entities.SalesReservation.update(editingReservation.id, data)
        : await base44.entities.SalesReservation.create(data);

      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reservations'] });
      setShowReservationModal(false);
      setEditingReservation(null);
    },
  });

  const getContactName = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const getDealName = (dealId) => {
    const deal = deals.find((d) => d.id === dealId);
    return deal ? deal.title : null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Sales Reservations
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track product holds, demos, and scheduled meetings
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingReservation(null);
            setShowReservationModal(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </Button>
      </div>

      {/* Payment & Calendar */}
      {reservations.length > 0 && (
        <>
          <ReservationPaymentTracker reservations={reservations} />
          <ReservationCalendarView reservations={reservations} />
        </>
      )}

      {/* Reservations Grid */}
      {reservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No reservations"
          description="Create reservations to track product holds, demos, and scheduled meetings."
          actionLabel="Create Reservation"
          onAction={() => setShowReservationModal(true)}
        />
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Reservations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                contactName={getContactName(reservation.contact_id)}
                dealName={getDealName(reservation.deal_id)}
                onEdit={() => {
                  setEditingReservation(reservation);
                  setShowReservationModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <ReservationModal
        open={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setEditingReservation(null);
        }}
        reservation={editingReservation}
        contacts={contacts}
        deals={deals}
        onSave={(data) => createReservationMutation.mutate(data)}
        isLoading={createReservationMutation.isPending}
      />
    </div>
  );
}
