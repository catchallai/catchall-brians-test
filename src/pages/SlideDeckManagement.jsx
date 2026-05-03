import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal, Trash2, Eye, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '@/utils';

export default function SlideDeckManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['slide-decks'],
    queryFn: () => base44.entities.PitchDeck.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PitchDeck.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slide-decks'] });
    },
  });

  const filteredDecks = decks.filter(
    (deck) =>
      deck.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Slide Deck Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage presentation decks</p>
        </div>
        <Button
          onClick={() => (window.location.href = createPageUrl('PitchDeckCreator'))}
          className="bg-violet-600 hover:bg-violet-700 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Deck
        </Button>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search decks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Grid */}
      {filteredDecks.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No slide decks yet</p>
          <Button
            onClick={() => (window.location.href = createPageUrl('PitchDeckCreator'))}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Deck
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{deck.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          (window.location.href = createPageUrl(
                            `PitchDeckCreator?id=${deck.id}`
                          ))
                        }
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          (window.location.href = createPageUrl(
                            `PitchDeckAnalyzer?id=${deck.id}`
                          ))
                        }
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(deck.id)}
                        className="text-red-600 gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {deck.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{deck.slides?.length || 0} slides</span>
                  <span>{new Date(deck.created_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}