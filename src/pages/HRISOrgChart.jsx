import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrgChartNode from "@/components/hris/OrgChartNode";
import {
  Search,
  Users,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  X,
  Network,
  Building2,
} from "lucide-react";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  onboarding: "bg-blue-100 text-blue-700",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-700",
};

export default function HRISOrgChart() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [scale, setScale] = useState(1);
  const [focusedRootId, setFocusedRootId] = useState(null);
  const chartRef = useRef(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const departments = useMemo(
    () => [...new Set(employees.map(e => e.department).filter(Boolean))],
    [employees]
  );

  // Filter employees — if dept filter active, only show that dept's hierarchy
  const filteredEmployees = useMemo(() => {
    if (deptFilter === "all") return employees;
    // Include the employee + their full ancestor chain so the tree renders correctly
    const inDept = new Set(employees.filter(e => e.department === deptFilter).map(e => e.id));
    // Also include all managers in the chain for context
    const result = new Set(inDept);
    inDept.forEach(id => {
      let emp = employees.find(e => e.id === id);
      while (emp?.manager_id) {
        result.add(emp.manager_id);
        emp = employees.find(e => e.id === emp.manager_id);
      }
    });
    return employees.filter(e => result.has(e.id));
  }, [employees, deptFilter]);

  // Find roots (no manager, or manager not in filteredEmployees set)
  const filteredIds = useMemo(() => new Set(filteredEmployees.map(e => e.id)), [filteredEmployees]);
  const roots = useMemo(
    () => filteredEmployees.filter(e => !e.manager_id || !filteredIds.has(e.manager_id)),
    [filteredEmployees, filteredIds]
  );

  // Search highlight
  const searchMatches = useMemo(() => {
    if (!search.trim()) return new Set();
    const q = search.toLowerCase();
    return new Set(
      employees
        .filter(e =>
          e.full_name?.toLowerCase().includes(q) ||
          e.job_title?.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q)
        )
        .map(e => e.id)
    );
  }, [search, employees]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(employees.map(e => e.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // Count direct reports for a given employee
  const directReportCount = (id) => employees.filter(e => e.manager_id === id).length;

  // Total chain count (recursive)
  const totalReportCount = (id) => {
    const direct = employees.filter(e => e.manager_id === id);
    return direct.reduce((acc, e) => acc + 1 + totalReportCount(e.id), 0);
  };

  const displayedRoots = focusedRootId
    ? filteredEmployees.filter(e => e.id === focusedRootId)
    : roots;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Left sidebar — controls + employee detail */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Org Chart</h1>
          </div>
          <p className="text-xs text-gray-400">{employees.filter(e => e.status === "active").length} active · {employees.length} total</p>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setFocusedRootId(null); }}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />{d}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Top-level people (roots) for quick nav */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Level</p>
          {roots.map(emp => (
            <button
              key={emp.id}
              onClick={() => setFocusedRootId(focusedRootId === emp.id ? null : emp.id)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors text-sm
                ${focusedRootId === emp.id
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-semibold">
                  {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{emp.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{emp.job_title || emp.department || "—"}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{totalReportCount(emp.id)}</span>
            </button>
          ))}
        </div>

        {/* Selected employee detail panel */}
        {selectedEmployee && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-indigo-50 dark:bg-indigo-900/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-indigo-200 text-indigo-800 font-bold text-sm">
                    {selectedEmployee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{selectedEmployee.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedEmployee.job_title || "—"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              {selectedEmployee.department && (
                <div className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{selectedEmployee.department}</div>
              )}
              {selectedEmployee.email && (
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{selectedEmployee.email}</div>
              )}
              {selectedEmployee.phone && (
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{selectedEmployee.phone}</div>
              )}
              {selectedEmployee.location && (
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{selectedEmployee.location}</div>
              )}
              {selectedEmployee.manager_name && (
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />Reports to: <span className="font-medium">{selectedEmployee.manager_name}</span></div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge className={`text-xs ${STATUS_COLORS[selectedEmployee.status] || "bg-gray-100 text-gray-600"}`}>
                {selectedEmployee.status}
              </Badge>
              <span className="text-xs text-gray-400">{directReportCount(selectedEmployee.id)} direct reports</span>
            </div>
          </div>
        )}
      </div>

      {/* Main chart canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 gap-3">
          {focusedRootId && (
            <button
              onClick={() => setFocusedRootId(null)}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to full org
            </button>
          )}
          {search && searchMatches.size > 0 && (
            <span className="text-sm text-indigo-600 font-medium">{searchMatches.size} match{searchMatches.size !== 1 ? "es" : ""}</span>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={expandAll} className="h-7 text-xs">Expand All</Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-7 text-xs">Collapse All</Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setScale(s => Math.max(0.4, +(s - 0.1).toFixed(1)))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setScale(s => Math.min(1.6, +(s + 0.1).toFixed(1)))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => setScale(1)}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 overflow-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                <p>Loading org chart...</p>
              </div>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No employees yet</p>
                <p className="text-sm mt-1">Add employees with manager relationships to build your org chart.</p>
              </div>
            </div>
          ) : (
            <div
              ref={chartRef}
              style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}
            >
              <div className="flex gap-12 justify-center flex-wrap items-start">
                {displayedRoots.map(root => (
                  <OrgChartNode
                    key={root.id}
                    employee={root}
                    allEmployees={filteredEmployees}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggle={toggleExpand}
                    onSelect={setSelectedEmployee}
                    selectedId={selectedEmployee?.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}