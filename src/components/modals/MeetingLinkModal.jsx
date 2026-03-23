import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export default function MeetingLinkModal({ open, onClose, meetingLink, onSave, isLoading }) {
  const [formData, setFormData] = useState(
    meetingLink || {
      name: '',
      description: '',
      duration_minutes: 30,
      link_slug: '',
      is_active: true,
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      },
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      confirmation_message: '',
    }
  );

  const toggleTimeSlot = (day, time) => {
    const daySlots = formData.availability[day] || [];
    const newSlots = daySlots.includes(time)
      ? daySlots.filter((t) => t !== time)
      : [...daySlots, time];

    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: newSlots,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meetingLink ? 'Edit Meeting Link' : 'Create Meeting Link'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Meeting Type Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Discovery Call"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                min="15"
                step="15"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this meeting for?"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">URL Slug</label>
            <Input
              value={formData.link_slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  link_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                })
              }
              placeholder="discovery-call"
            />
            <p className="text-xs text-gray-500 mt-1">
              yoursite.com/book/{formData.link_slug || 'slug'}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Availability</h4>
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="border rounded-lg p-3">
                  <div className="font-medium capitalize mb-2">{day}</div>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((time) => {
                      const isSelected = formData.availability[day]?.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTimeSlot(day, time)}
                          className={`px-3 py-1 rounded text-sm ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buffer Before (minutes)</label>
              <Input
                type="number"
                value={formData.buffer_before_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, buffer_before_minutes: parseInt(e.target.value) })
                }
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Buffer After (minutes)</label>
              <Input
                type="number"
                value={formData.buffer_after_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, buffer_after_minutes: parseInt(e.target.value) })
                }
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Confirmation Message</label>
            <Textarea
              value={formData.confirmation_message}
              onChange={(e) => setFormData({ ...formData, confirmation_message: e.target.value })}
              placeholder="Thank you for booking! You'll receive a calendar invite shortly."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {meetingLink ? 'Update' : 'Create'} Meeting Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
