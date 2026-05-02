import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  onboarding: "bg-blue-100 text-blue-700",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-700",
};

function OrgChartNode({ employee, allEmployees, depth = 0, expandedIds, onToggle, onSelect, selectedId }) {
  const directReports = allEmployees.filter(e => e.manager_id === employee.id);
  const hasReports = directReports.length > 0;
  const isExpanded = expandedIds.has(employee.id);
  const isSelected = selectedId === employee.id;

  const initials = employee.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center">
      {/* Connector line from parent */}
      {depth > 0 && <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />}

      {/* Node card */}
      <div
        className={`relative group cursor-pointer rounded-xl border-2 p-3 w-44 text-center transition-all duration-200 shadow-sm hover:shadow-md
          ${isSelected
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300"
          }`}
        onClick={() => onSelect(employee)}
      >
        <Avatar className="w-10 h-10 mx-auto mb-2">
          <AvatarFallback className={`text-sm font-bold ${isSelected ? "bg-indigo-200 text-indigo-800" : "bg-indigo-100 text-indigo-700"}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{employee.full_name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{employee.job_title || "—"}</p>
        {employee.department && (
          <p className="text-xs text-indigo-500 truncate mt-0.5">{employee.department}</p>
        )}
        <Badge className={`mt-1.5 text-xs ${STATUS_COLORS[employee.status] || "bg-gray-100 text-gray-600"}`}>
          {employee.status}
        </Badge>

        {/* Toggle button */}
        {hasReports && (
          <button
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-7 h-7 rounded-full bg-indigo-600 text-white shadow flex items-center justify-center hover:bg-indigo-700 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggle(employee.id); }}
          >
            {isExpanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* Direct report count badge */}
      {hasReports && !isExpanded && (
        <div className="mt-5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {directReports.length} direct report{directReports.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Children */}
      {hasReports && isExpanded && (
        <div className="mt-4 flex flex-col items-center">
          {/* Horizontal connector line */}
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-6 items-start relative">
            {/* Top horizontal bar */}
            {directReports.length > 1 && (
              <div
                className="absolute top-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700"
                style={{ left: `${100 / (2 * directReports.length)}%`, right: `${100 / (2 * directReports.length)}%` }}
              />
            )}
            {directReports.map((child) => (
              <OrgChartNode
                key={child.id}
                employee={child}
                allEmployees={allEmployees}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedId={selectedId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgChartNode;