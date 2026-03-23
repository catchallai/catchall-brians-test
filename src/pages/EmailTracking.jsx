import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Eye, MousePointer, Reply, AlertCircle, Search } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';

export default function EmailTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: trackingData = [], isLoading } = useQuery({
    queryKey: ['email-tracking'],
    queryFn: () => base44.entities.EmailTracking.list('-sent_date', 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const getContact = (contactId) => contacts.find((c) => c.id === contactId);

  const filteredData = trackingData.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContact(email.contact_id)?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'opened' && email.opened) ||
      (statusFilter === 'unopened' && !email.opened) ||
      (statusFilter === 'clicked' && email.clicked) ||
      (statusFilter === 'replied' && email.replied) ||
      (statusFilter === 'bounced' && email.bounced);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: trackingData.length,
    opened: trackingData.filter((e) => e.opened).length,
    clicked: trackingData.filter((e) => e.clicked).length,
    replied: trackingData.filter((e) => e.replied).length,
  };

  const openRate = stats.total > 0 ? ((stats.opened / stats.total) * 100).toFixed(1) : 0;
  const clickRate = stats.total > 0 ? ((stats.clicked / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Tracking</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor email opens, clicks, and engagement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{openRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{clickRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Reply className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Replies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.replied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by subject or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="unopened">Unopened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      {isLoading ? (
        <div>Loading...</div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No tracked emails"
          description="Emails sent with tracking will appear here"
        />
      ) : (
        <div className="space-y-3">
          {filteredData.map((email) => {
            const contact = getContact(email.contact_id);
            return (
              <Card key={email.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {email.subject}
                        </h3>
                        {email.opened && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <Eye className="w-3 h-3 mr-1" />
                            Opened
                          </Badge>
                        )}
                        {email.clicked && (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <MousePointer className="w-3 h-3 mr-1" />
                            Clicked
                          </Badge>
                        )}
                        {email.replied && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Reply className="w-3 h-3 mr-1" />
                            Replied
                          </Badge>
                        )}
                        {email.bounced && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Bounced
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        To: {contact?.email || 'Unknown'}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Sent</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(email.sent_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {email.opened && (
                          <>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Opens</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {email.opened_count || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">First Opened</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(email.first_opened_date), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Last Opened</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(email.last_opened_date), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {email.clicked_links?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Clicked Links:
                          </p>
                          <div className="space-y-1">
                            {email.clicked_links.map((link, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                              >
                                <MousePointer className="w-3 h-3" />
                                <span className="truncate flex-1">{link.url}</span>
                                <Badge variant="outline" className="text-xs">
                                  {link.click_count} {link.click_count === 1 ? 'click' : 'clicks'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
