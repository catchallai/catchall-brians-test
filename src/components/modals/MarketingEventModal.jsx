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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

export default function MarketingEventModal({ open, onClose, onSave, event, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'webinar',
    format: 'virtual',
    status: 'draft',
    start_date: '',
    end_date: '',
    timezone: 'UTC',
    location: '',
    venue_name: '',
    address: '',
    meeting_url: '',
    description: '',
    capacity: '',
    organizer_name: '',
    organizer_email: '',
    speakers: [],
    agenda: '',
    registration_required: true,
    registration_open_date: '',
    registration_close_date: '',
    cost: 0,
    currency: 'USD',
    tags: [],
    notes: '',
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        name: '',
        event_type: 'webinar',
        format: 'virtual',
        status: 'draft',
        start_date: '',
        end_date: '',
        timezone: 'UTC',
        location: '',
        venue_name: '',
        address: '',
        meeting_url: '',
        description: '',
        capacity: '',
        organizer_name: '',
        organizer_email: '',
        speakers: [],
        agenda: '',
        registration_required: true,
        registration_open_date: '',
        registration_close_date: '',
        cost: 0,
        currency: 'USD',
        tags: [],
        notes: '',
      });
    }
  }, [event, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSpeaker = () => {
    setFormData((prev) => ({
      ...prev,
      speakers: [...(prev.speakers || []), { name: '', title: '', bio: '' }],
    }));
  };

  const removeSpeaker = (index) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }));
  };

  const handleSpeakerChange = (index, field, value) => {
    const newSpeakers = [...(formData.speakers || [])];
    newSpeakers[index][field] = value;
    setFormData((prev) => ({ ...prev, speakers: newSpeakers }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      cost: parseFloat(formData.cost) || 0,
    };
    onSave(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Marketing Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => handleChange('event_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="product_launch">Product Launch</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => handleChange('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                    placeholder="Max attendees"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Speakers</Label>
                {(formData.speakers || []).map((speaker, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Speaker name"
                        value={speaker.name}
                        onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Title"
                        value={speaker.title}
                        onChange={(e) => handleSpeakerChange(index, 'title', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpeaker(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpeaker}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Speaker
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => handleChange('agenda', e.target.value)}
                  rows={3}
                  placeholder="Event schedule and topics"
                />
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              {(formData.format === 'virtual' || formData.format === 'hybrid') && (
                <div className="space-y-2">
                  <Label htmlFor="meeting_url">Meeting URL</Label>
                  <Input
                    id="meeting_url"
                    value={formData.meeting_url}
                    onChange={(e) => handleChange('meeting_url', e.target.value)}
                    placeholder="Zoom, Teams, or other platform link"
                  />
                </div>
              )}

              {(formData.format === 'in_person' || formData.format === 'hybrid') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="venue_name">Venue Name</Label>
                    <Input
                      id="venue_name"
                      value={formData.venue_name}
                      onChange={(e) => handleChange('venue_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">City/Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizer_name">Organizer Name</Label>
                  <Input
                    id="organizer_name"
                    value={formData.organizer_name}
                    onChange={(e) => handleChange('organizer_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer_email">Organizer Email</Label>
                  <Input
                    id="organizer_email"
                    type="email"
                    value={formData.organizer_email}
                    onChange={(e) => handleChange('organizer_email', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_open_date">Registration Opens</Label>
                  <Input
                    id="registration_open_date"
                    type="datetime-local"
                    value={formData.registration_open_date}
                    onChange={(e) => handleChange('registration_open_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_close_date">Registration Closes</Label>
                  <Input
                    id="registration_close_date"
                    type="datetime-local"
                    value={formData.registration_close_date}
                    onChange={(e) => handleChange('registration_close_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : event ? 'Update' : 'Create'} Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
