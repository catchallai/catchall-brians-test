import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
  Search, Mail, Phone, Building2
} from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';

const DEPARTMENTS = ['business_dev', 'sales', 'marketing', 'media', 'collaboration', 'assets', 'executive', 'admin'];

export default function UserDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['directory-users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['directory-departments'],
    queryFn: () => base44.entities.UserDepartment.list('-created_date', 1000),
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const userDept = departments.find(d => d.user_email === user.email);
    const matchesDept = deptFilter === 'all' || userDept?.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const getUserDepartment = (email) => {
    return departments.find(d => d.user_email === email);
  };

  const getDeptColor = (dept) => {
    const colors = {
      business_dev: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      media: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      collaboration: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      assets: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      executive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      admin: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[dept] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Directory</h1>
        <p className="text-gray-500 mt-1">Find team members and connect with colleagues</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-sm text-gray-500">Team Members</p>
          </CardContent>
        </Card>
        {DEPARTMENTS.map(dept => {
          const count = departments.filter(d => d.department === dept).length;
          return (
            <Card key={dept} className="glass-card rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-sm text-gray-500">{dept.replace(/_/g, ' ').toUpperCase()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept.replace(/_/g, ' ').toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description="Adjust your search or filters to find team members"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const userDept = getUserDepartment(user.email);
            return (
              <Card 
                key={user.id} 
                className="glass-card hover:shadow-lg transition-all hover:border-violet-200 dark:hover:border-violet-800 cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="w-16 h-16 mb-4">
                      <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-lg font-medium">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {user.full_name || 'Unknown User'}
                    </h3>
                    
                    {userDept && (
                      <Badge className={`${getDeptColor(userDept.department)} border-0 mt-2`}>
                        {userDept.department.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    
                    <div className="space-y-2 mt-4 w-full">
                      <a 
                        href={`mailto:${user.email}`}
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </a>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                      <p className="text-xs text-gray-500">
                        Joined {new Date(user.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Department Summary */}
      {filteredUsers.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DEPARTMENTS.map(dept => {
                const count = filteredUsers.filter(user => {
                  const userDept = getUserDepartment(user.email);
                  return userDept?.department === dept;
                }).length;
                return (
                  <div key={dept} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-xs text-gray-500 mt-1">{dept.replace(/_/g, ' ')}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}