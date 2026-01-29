import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function TicketModal({ open, onClose, onSave, ticket, isLoading }) {
  const [formData, setFormData] = useState({
    ticket_name: '',
    pipeline: 'Support Pipeline',
    status: 'New',
    ticket_description: '',
    source: '',
    owner_name: '',
    priority: 'Medium',
    create_date: new Date().toISOString().split('T')[0],
    associated_contacts: [],
    associated_companies: [],
    associated_deals: []
  });

  const [showAssociations, setShowAssociations] = useState({
    contacts: false,
    companies: false,
    deals: false
  });

  useEffect(() => {
    if (ticket) {
      setFormData(ticket);
    } else {
      const ticketNumber = `T-${Date.now()}`;
      setFormData({
        ticket_name: '',
        ticket_number: ticketNumber,
        pipeline: 'Support Pipeline',
        status: 'New',
        ticket_description: '',
        source: '',
        owner_name: '',
        priority: 'Medium',
        create_date: new Date().toISOString().split('T')[0],
        associated_contacts: [],
        associated_companies: [],
        associated_deals: []
      });
    }
  }, [ticket, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Ticket</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="ticket_name">
              Ticket name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ticket_name"
              value={formData.ticket_name}
              onChange={(e) => handleChange('ticket_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pipeline">
              Pipeline <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.pipeline} onValueChange={(value) => handleChange('pipeline', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Support Pipeline">Support Pipeline</SelectItem>
                <SelectItem value="Sales Pipeline">Sales Pipeline</SelectItem>
                <SelectItem value="Technical Pipeline">Technical Pipeline</SelectItem>
                <SelectItem value="Billing Pipeline">Billing Pipeline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Ticket status <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Waiting on Contact">Waiting on Contact</SelectItem>
                <SelectItem value="Waiting on Us">Waiting on Us</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket_description">Ticket description</Label>
            <Textarea
              id="ticket_description"
              value={formData.ticket_description}
              onChange={(e) => handleChange('ticket_description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={formData.source} onValueChange={(value) => handleChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Chat">Chat</SelectItem>
                <SelectItem value="Web Form">Web Form</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_name">Ticket owner</Label>
            <Input
              id="owner_name"
              value={formData.owner_name}
              onChange={(e) => handleChange('owner_name', e.target.value)}
              placeholder="Enter owner name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_date">Create date</Label>
            <Input
              id="create_date"
              type="date"
              value={formData.create_date}
              onChange={(e) => handleChange('create_date', e.target.value)}
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="text-base font-semibold">Associate Ticket with</Label>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAssociations(prev => ({ ...prev, contacts: !prev.contacts }))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Contacts
              </button>
              {showAssociations.contacts && (
                <div className="ml-4 text-sm text-gray-500">
                  Contact association coming soon
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAssociations(prev => ({ ...prev, companies: !prev.companies }))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Companies
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAssociations(prev => ({ ...prev, deals: !prev.deals }))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Deals
              </button>
            </div>

            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add more
            </button>
          </div>

          <DialogFooter className="pt-4 border-t flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              disabled={isLoading}
            >
              Create and add another
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}