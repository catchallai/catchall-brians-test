import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn, LogOut, AlertCircle } from "lucide-react";
import { useToast } from '@/components/ui/toast-provider';

export default function CheckoutSystem({ equipment }) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    checked_out_to: '',
    expected_return_date: '',
    notes: ''
  });
  const [checkinData, setCheckinData] = useState({
    condition_at_return: 'Good',
    notes: ''
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activeCheckout } = useQuery({
    queryKey: ['active-checkout', equipment.id],
    queryFn: async () => {
      const checkouts = await base44.entities.EquipmentCheckout.filter({
        equipment_id: equipment.id,
        status: 'checked_out'
      });
      return checkouts[0] || null;
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.EquipmentCheckout.create({
        ...data,
        equipment_id: equipment.id,
        checked_out_by: user?.email,
        checkout_date: new Date().toISOString(),
        condition_at_checkout: equipment.condition,
        status: 'checked_out'
      });
      
      await base44.entities.Equipment.update(equipment.id, {
        checkout_status: 'checked_out',
        current_holder: data.checked_out_to
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-checkout'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowCheckoutModal(false);
      toast.success('Equipment checked out');
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.EquipmentCheckout.update(activeCheckout.id, {
        actual_return_date: new Date().toISOString(),
        condition_at_return: data.condition_at_return,
        notes: data.notes,
        status: 'returned'
      });
      
      await base44.entities.Equipment.update(equipment.id, {
        checkout_status: 'available',
        current_holder: null,
        condition: data.condition_at_return
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-checkout'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowCheckinModal(false);
      toast.success('Equipment checked in');
    }
  });

  const isOverdue = activeCheckout && activeCheckout.expected_return_date && 
    new Date(activeCheckout.expected_return_date) < new Date();

  return (
    <>
      <Card className={`border-l-4 ${activeCheckout ? (isOverdue ? 'border-l-red-500' : 'border-l-yellow-500') : 'border-l-green-500'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
              <Badge className={activeCheckout ? (isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') : 'bg-green-100 text-green-800'}>
                {activeCheckout ? (isOverdue ? 'Overdue' : 'Checked Out') : 'Available'}
              </Badge>
            </div>
            {activeCheckout ? (
              <Button onClick={() => setShowCheckinModal(true)} variant="outline" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Check In
              </Button>
            ) : (
              <Button onClick={() => setShowCheckoutModal(true)} size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Check Out
              </Button>
            )}
          </div>
          
          {activeCheckout && (
            <div className="mt-3 pt-3 border-t text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Checked out to:</span> {activeCheckout.checked_out_to}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Expected return:</span> {new Date(activeCheckout.expected_return_date).toLocaleDateString()}
              </p>
              {isOverdue && (
                <div className="flex items-center gap-1 text-red-600 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">OVERDUE</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Check Out To (Email)</Label>
              <Input
                value={checkoutData.checked_out_to}
                onChange={(e) => setCheckoutData({...checkoutData, checked_out_to: e.target.value})}
                placeholder="user@example.com"
                type="email"
              />
            </div>
            <div>
              <Label>Expected Return Date</Label>
              <Input
                type="date"
                value={checkoutData.expected_return_date}
                onChange={(e) => setCheckoutData({...checkoutData, expected_return_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={checkoutData.notes}
                onChange={(e) => setCheckoutData({...checkoutData, notes: e.target.value})}
                placeholder="Purpose, special instructions..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCheckoutModal(false)}>Cancel</Button>
              <Button onClick={() => checkoutMutation.mutate(checkoutData)}>Check Out</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkin Modal */}
      <Dialog open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Condition at Return</Label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={checkinData.condition_at_return}
                onChange={(e) => setCheckinData({...checkinData, condition_at_return: e.target.value})}
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={checkinData.notes}
                onChange={(e) => setCheckinData({...checkinData, notes: e.target.value})}
                placeholder="Any damage, issues, or observations..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCheckinModal(false)}>Cancel</Button>
              <Button onClick={() => checkinMutation.mutate(checkinData)}>Check In</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}