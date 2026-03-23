import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

export default function ReportTable({ data, columns, onExport }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) {
        return 1;
      }
      if (bVal === null || bVal === undefined) {
        return -1;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-violet-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-violet-600" />
    );
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (
      key.includes('revenue') ||
      key.includes('value') ||
      key.includes('budget') ||
      key.includes('spent') ||
      key === 'avg_deal_size'
    ) {
      return `$${Number(value).toLocaleString()}`;
    }
    if (key.includes('roi')) {
      return `${Number(value).toFixed(1)}%`;
    }
    if (key.includes('date')) {
      return new Date(value).toLocaleDateString();
    }
    return value;
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h4 className="font-medium text-gray-900">Report Results</h4>
          <p className="text-sm text-gray-500">{data.length} records</p>
        </div>
        <Button variant="outline" onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {getSortIcon(col.id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-400">
                  No data matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{formatValue(row[col.id], col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
