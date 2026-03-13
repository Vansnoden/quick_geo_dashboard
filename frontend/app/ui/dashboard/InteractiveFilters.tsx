'use client';

import { useEffect, useState } from 'react';
import { InteractiveFilterDef } from '@/app/lib/definitions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/app/lib/constants';


interface Props {
  dashboardId: string;
  filters: InteractiveFilterDef[];
  onFilterChange: (filterValues: Record<string, any>) => void;
}

export default function InteractiveFilters({ dashboardId, filters, onFilterChange }: Props) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  // Fetch distinct values for dropdown/multiselect filters
  useEffect(() => {
    filters.forEach(async (filter) => {
      if (filter.type === 'dropdown' || filter.type === 'multiselect') {
        setLoading(prev => ({ ...prev, [filter.column]: true }));
        setError(prev => ({ ...prev, [filter.column]: '' }));
        
        try {
          const url = DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId));
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column: filter.column })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const values = await response.json();
          setDistinctValues(prev => ({ ...prev, [filter.column]: values }));
        } catch (error) {
          console.error(`Failed to fetch distinct values for ${filter.column}:`, error);
          setError(prev => ({ ...prev, [filter.column]: error.message }));
        } finally {
          setLoading(prev => ({ ...prev, [filter.column]: false }));
        }
      }
    });
  }, [dashboardId, filters]);

  const handleChange = (column: string, value: any) => {
    const newValues = { ...filterValues, [column]: value };
    setFilterValues(newValues);
    
    // Convert to FilterCondition format for the parent
    // This is important - the parent expects a format that can be converted to FilterCondition
    onFilterChange(newValues);
  };

  const handleRangeChange = (column: string, min: string, max: string) => {
    // Store as simple values, not objects
    const newValues = { 
      ...filterValues, 
      [`${column}_min`]: min ? Number(min) : undefined,
      [`${column}_max`]: max ? Number(max) : undefined
    };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700">Interactive Filters</h3>
      {filters.map((filter) => (
        <div key={filter.column} className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">{filter.label}</label>
          
          {error[filter.column] && (
            <p className="text-xs text-red-500">Error: {error[filter.column]}</p>
          )}
          
          {filter.type === 'dropdown' && (
            <select
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              value={filterValues[filter.column] || ''}
              onChange={(e) => handleChange(filter.column, e.target.value)}
            >
              <option value="">All</option>
              {loading[filter.column] ? (
                <option disabled>Loading...</option>
              ) : (
                distinctValues[filter.column]?.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))
              )}
            </select>
          )}
          
          {filter.type === 'multiselect' && (
            <select
              multiple
              className="w-full rounded-md border border-gray-300 p-2 text-sm min-h-25"
              value={filterValues[filter.column] || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleChange(filter.column, selected);
              }}
            >
              {loading[filter.column] ? (
                <option disabled>Loading...</option>
              ) : (
                distinctValues[filter.column]?.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))
              )}
            </select>
          )}
          
          {filter.type === 'range' && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 rounded-md border border-gray-300 p-2 text-sm"
                value={filterValues[`${filter.column}_min`] || ''}
                onChange={(e) => handleRangeChange(
                  filter.column, 
                  e.target.value, 
                  filterValues[`${filter.column}_max`] || ''
                )}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 rounded-md border border-gray-300 p-2 text-sm"
                value={filterValues[`${filter.column}_max`] || ''}
                onChange={(e) => handleRangeChange(
                  filter.column,
                  filterValues[`${filter.column}_min`] || '',
                  e.target.value
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

