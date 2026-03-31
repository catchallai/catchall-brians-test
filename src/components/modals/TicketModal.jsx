import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Trash2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

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
    contact_ids: [],
    company_ids: [],
    deal_ids: [],
  });

  const [showAssociations, setShowAssociations] = useState({
    contacts: false,
    companies: false,
    deals: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    contact: '',
    company: '',
    deal: '',
  });

  // Fetch data for associations
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
    enabled: open,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: open,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list(),
    enabled: open,
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        ...ticket,
        contact_ids: ticket.contact_ids || [],
        company_ids: ticket.company_ids || [],
        deal_ids: ticket.deal_ids || [],
      });
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
        contact_ids: [],
        company_ids: [],
        deal_ids: [],
      });
    }
  }, [ticket, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addAssociation = (type, id) => {
    const field = `${type}_ids`;
    if (!formData[field].includes(id)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], id],
      }));
    }
  };

  const removeAssociation = (type, id) => {
    const field = `${type}_ids`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== id),
    }));
  };

  const getFilteredItems = (items, searchTerm, nameField) => {
    if (!searchTerm) {
      return items.slice(0, 5);
    }
    return items
      .filter((item) => item[nameField]?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" windowControls={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Ticket</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
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
            <Select
              value={formData.pipeline}
              onValueChange={(value) => handleChange('pipeline', value)}
            >
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
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
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
            <Select
              value={formData.source}
              onValueChange={(value) => handleChange('source', value)}
            >
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
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange('priority', value)}
            >
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

          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-semibold">Associate Ticket with</Label>

            {/* Contacts Association */}
            <div className="space-y-2">
              {formData.contact_ids.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formData.contact_ids.map((contactId) => {
                    const contact = contacts.find((c) => c.id === contactId);
                    return contact ? (
                      <div
                        key={contactId}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2 rounded"
                      >
                        <span className="text-sm">
                          {contact.first_name} {contact.last_name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAssociation('contact', contactId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  setShowAssociations((prev) => ({ ...prev, contacts: !prev.contacts }))
                }
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Contacts
              </button>
              {showAssociations.contacts && (
                <div className="ml-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerms.contact}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({ ...prev, contact: e.target.value }))
                      }
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {getFilteredItems(contacts, searchTerms.contact, 'first_name').map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        addAssociation('contact', contact.id);
                        setShowAssociations((prev) => ({ ...prev, contacts: false }));
                        setSearchTerms((prev) => ({ ...prev, contact: '' }));
                      }}
                      className="w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      {contact.first_name} {contact.last_name}
                      {contact.email && (
                        <span className="text-gray-500 ml-2">({contact.email})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Companies Association */}
            <div className="space-y-2">
              {formData.company_ids.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formData.company_ids.map((companyId) => {
                    const company = companies.find((c) => c.id === companyId);
                    return company ? (
                      <div
                        key={companyId}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2 rounded"
                      >
                        <span className="text-sm">{company.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAssociation('company', companyId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  setShowAssociations((prev) => ({ ...prev, companies: !prev.companies }))
                }
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Companies
              </button>
              {showAssociations.companies && (
                <div className="ml-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerms.company}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({ ...prev, company: e.target.value }))
                      }
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {getFilteredItems(companies, searchTerms.company, 'name').map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => {
                        addAssociation('company', company.id);
                        setShowAssociations((prev) => ({ ...prev, companies: false }));
                        setSearchTerms((prev) => ({ ...prev, company: '' }));
                      }}
                      className="w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Deals Association */}
            <div className="space-y-2">
              {formData.deal_ids.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formData.deal_ids.map((dealId) => {
                    const deal = deals.find((d) => d.id === dealId);
                    return deal ? (
                      <div
                        key={dealId}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2 rounded"
                      >
                        <span className="text-sm">{deal.title}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAssociation('deal', dealId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAssociations((prev) => ({ ...prev, deals: !prev.deals }))}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Deals
              </button>
              {showAssociations.deals && (
                <div className="ml-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search deals..."
                      value={searchTerms.deal}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({ ...prev, deal: e.target.value }))
                      }
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {getFilteredItems(deals, searchTerms.deal, 'title').map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => {
                        addAssociation('deal', deal.id);
                        setShowAssociations((prev) => ({ ...prev, deals: false }));
                        setSearchTerms((prev) => ({ ...prev, deal: '' }));
                      }}
                      className="w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      {deal.title}
                      {deal.value && <span className="text-gray-500 ml-2">(${deal.value})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="outline" disabled={isLoading}>
              Create and add another
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
