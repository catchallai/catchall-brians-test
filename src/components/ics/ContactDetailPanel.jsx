import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  MessageSquare,
  Video,
  Phone,
  Users,
  Edit2,
  Mail,
  Briefcase,
  Calendar,
} from 'lucide-react';
import PresenceIndicator from './PresenceIndicator';

export default function ContactDetailPanel({
  contact,
  presence,
  darkMode,
  isOpen,
  onClose,
  onDirectMessage,
  onVideoCall,
  onGroupMessage,
  onScheduleCall,
  isOwnProfile,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  if (!isOpen || !contact) {
    return null;
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(null);
    } else {
      setEditData({ ...contact });
    }
    setIsEditing(!isEditing);
  };

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 w-96 shadow-xl z-40 overflow-hidden flex flex-col ${
        darkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarFallback
                  className={`text-lg font-semibold ${
                    darkMode ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {contact.full_name?.[0]?.toUpperCase() || contact.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isOwnProfile && presence && (
                <PresenceIndicator presence={presence} size="sm" showLabel={false} />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {contact.full_name || 'User'}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {contact.email}
              </p>
              {!isOwnProfile && presence?.custom_status && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {presence.status_emoji} {presence.custom_status}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!isOwnProfile && (
            <>
              <Button size="sm" className="gap-2" onClick={() => onDirectMessage(contact)}>
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => onVideoCall(contact)}
              >
                <Video className="w-4 h-4" />
                Video Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => onGroupMessage(contact)}
              >
                <Users className="w-4 h-4" />
                Add to Group
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => onScheduleCall(contact)}
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </Button>
            </>
          )}
          {isOwnProfile && (
            <Button size="sm" className="gap-2 col-span-2" onClick={handleEditToggle}>
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Contact Information
            </h3>
            <div className="space-y-3">
              {isOwnProfile && isEditing ? (
                <>
                  <div>
                    <label
                      className={`text-xs font-medium block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Full Name
                    </label>
                    <Input
                      value={editData.full_name || ''}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className={darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs font-medium block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Email
                    </label>
                    <Input
                      value={editData.email}
                      disabled
                      className={darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Mail className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <a
                      href={`mailto:${contact.email}`}
                      className={`text-sm ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                    >
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone
                        className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {contact.phone}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Job Title */}
          {(contact.job_title || (isOwnProfile && isEditing)) && (
            <div>
              <h3
                className={`font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Briefcase className="w-4 h-4" />
                Job Title
              </h3>
              {isOwnProfile && isEditing ? (
                <Input
                  value={editData.job_title || ''}
                  onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                  placeholder="Enter job title"
                  className={darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              ) : (
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {contact.job_title || 'Not specified'}
                </p>
              )}
            </div>
          )}

          {/* Bio/Status */}
          {(contact.bio || (isOwnProfile && isEditing)) && (
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                About
              </h3>
              {isOwnProfile && isEditing ? (
                <Textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  className={`h-20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                />
              ) : (
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {contact.bio || 'No information provided'}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          {!isOwnProfile && presence && (
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Status
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    presence.status === 'online'
                      ? 'bg-green-500'
                      : presence.status === 'away'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                  }`}
                />
                <span
                  className={`text-sm capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {presence.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit Save Footer */}
      {isOwnProfile && isEditing && (
        <div
          className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'} flex gap-2`}
        >
          <Button variant="outline" onClick={handleEditToggle} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Handle save - could integrate with mutation
              handleEditToggle();
            }}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
