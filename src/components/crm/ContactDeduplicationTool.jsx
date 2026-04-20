import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, Merge, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ContactDeduplicationTool({ contacts, onDeduped }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mergeCandidate, setMergeCandidate] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [merging, setMerging] = useState(false);

  const duplicates = useMemo(() => {
    const seen = {};
    const dups = [];

    contacts.forEach((contact) => {
      const key = `${contact.first_name}|${contact.last_name}|${contact.email}`.toLowerCase();
      if (seen[key]) {
        dups.push({ contact, duplicateOf: seen[key] });
      } else {
        seen[key] = contact;
      }
    });

    return dups.filter(
      (d) =>
        !searchTerm ||
        d.contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  const handleMerge = async () => {
    if (!mergeCandidate || !mergeTarget) {
      return;
    }
    setMerging(true);

    try {
      // Update candidate to point to target
      await base44.entities.Contact.update(mergeCandidate.id, {
        duplicate_of_id: mergeTarget.id,
      });

      toast.success(
        `Merged ${mergeCandidate.first_name} ${mergeCandidate.last_name} into primary contact`
      );
      onDeduped?.();
      setMergeCandidate(null);
      setMergeTarget(null);
    } catch (err) {
      toast.error('Failed to merge contacts');
    } finally {
      setMerging(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          Duplicate Detection ({duplicates.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicates.length > 0 ? (
          <>
            <Input
              placeholder="Search duplicates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {dup.contact.first_name} {dup.contact.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dup.contact.email}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Duplicate
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={mergeCandidate?.id === dup.contact.id ? 'default' : 'outline'}
                        onClick={() => setMergeCandidate(dup.contact)}
                        className="text-xs"
                      >
                        {mergeCandidate?.id === dup.contact.id ? '✓ Select' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mergeCandidate && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Merging:{' '}
                  <span className="text-blue-600">
                    {mergeCandidate.first_name} {mergeCandidate.last_name}
                  </span>
                </p>
                <div className="flex gap-2 items-center">
                  <select
                    value={mergeTarget?.id || ''}
                    onChange={(e) => {
                      const target = contacts.find((c) => c.id === e.target.value);
                      setMergeTarget(target);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Select primary contact to keep...</option>
                    {contacts
                      .filter(
                        (c) =>
                          c.id !== mergeCandidate.id &&
                          (c.email === mergeCandidate.email ||
                            (c.first_name === mergeCandidate.first_name &&
                              c.last_name === mergeCandidate.last_name))
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} ({c.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleMerge}
                    disabled={!mergeTarget || merging}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Merge className="w-4 h-4" />
                    {merging ? 'Merging...' : 'Confirm Merge'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMergeCandidate(null);
                      setMergeTarget(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>✓ No duplicates detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
