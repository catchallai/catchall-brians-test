import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen, FileText, Users } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';

export default function Spaces() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spaces</h1>
          <p className="text-gray-500 mt-1">Organize your documentation and knowledge base</p>
        </div>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          New Space
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search spaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spaces</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
            </div>
            <FolderOpen className="w-8 h-8 text-violet-600" />
          </div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Collaborators</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={FolderOpen}
        title="No spaces yet"
        description="Create your first space to start organizing documentation and knowledge."
        actionLabel="Create Space"
        onAction={() => {}}
      />
    </div>
  );
}