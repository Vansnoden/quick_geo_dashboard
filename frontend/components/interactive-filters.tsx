'use client';

import { useEffect, useState, useRef } from 'react';
import { InteractiveFilterDef } from '@/lib/definitions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/lib/constants';
import { 
    ChevronDownIcon, 
    XMarkIcon,
    FunnelIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Props {
    dashboardId: string;
    filters: InteractiveFilterDef[];
    onFilterChange: (filterValues: Record<string, any>) => void;
}

// Custom Select Component
const CustomSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder,
    loading,
    multiple = false 
}: { 
    options: string[];
    value: string | string[];
    onChange: (value: any) => void;
    placeholder: string;
    loading?: boolean;
    multiple?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = multiple ? (value as string[]).map(v => ({ value: v, label: v }))
    : value ? [{ value: value as string, label: value as string }] : [];

    const removeOption = (optionToRemove: string) => {
        if (multiple) {
            const newValue = (value as string[]).filter(v => v !== optionToRemove);
            onChange(newValue);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Select trigger */}
            <div
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={`w-full min-h-[38px] px-3 py-2 bg-white border border-gray-300 rounded-lg 
                    cursor-pointer flex items-center justify-between hover:border-purple-400 transition-colors ${
                    loading ? 'opacity-50 cursor-wait' : ''
                }`}>
                <div className="flex flex-wrap gap-1 flex-1">
                    {multiple ? (
                        selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span
                                key={opt.value}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs"
                                onClick={(e) => e.stopPropagation()}>
                                {opt.label}
                                <button
                                    onClick={() => removeOption(opt.value)}
                                    className="hover:text-purple-900">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </span>
                        ))
                        ) : (
                            <span className="text-gray-400 text-sm">{placeholder}</span>
                        )
                        ) : (
                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                            {value || placeholder}
                        </span>
                    )}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                    </div>
                </div>

                {/* Options list */}
                <div className="overflow-y-auto max-h-60">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => {
                        const isSelected = multiple 
                        ? (value as string[]).includes(option)
                        : value === option;
                
                         return (
                            <div
                                key={option}
                                className={`px-3 py-2 cursor-pointer hover:bg-purple-50 transition-colors ${
                                    isSelected ? 'bg-purple-100 text-purple-700' : ''
                                }`}
                                onClick={() => {
                                    if (multiple) {
                                        const newValue = isSelected
                                        ? (value as string[]).filter(v => v !== option)
                                        : [...(value as string[]), option];
                                        onChange(newValue);
                                    } else {
                                        onChange(option);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }
                                }}
                            >
                                <span className="text-sm">{option}</span>
                            </div>
                        );
                    })
                    ) : (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                            No options found
                        </div>
                    )}
                </div>
            </div>
        )}
        </div>
    );
};

// Custom Range Slider Component
const RangeSlider = ({
    min,
    max,
    value,
    onChange,
    step = 1
}: {
    min: number;
    max: number;
    value: { min?: number; max?: number };
    onChange: (min: number | undefined, max: number | undefined) => void;
    step?: number;
}) => {
    const [localMin, setLocalMin] = useState(value.min?.toString() || '');
    const [localMax, setLocalMax] = useState(value.max?.toString() || '');

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = e.target.value === '' ? undefined : Number(e.target.value);
        setLocalMin(e.target.value);
        onChange(newMin, value.max);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = e.target.value === '' ? undefined : Number(e.target.value);
        setLocalMax(e.target.value);
        onChange(value.min, newMax);
    };

    const handleClear = () => {
        setLocalMin('');
        setLocalMax('');
        onChange(undefined, undefined);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Min</label>
                    <input
                        type="number"
                        value={localMin}
                        onChange={handleMinChange}
                        placeholder={`${min}`}
                        step={step}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                            focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Max</label>
                    <input
                        type="number"
                        value={localMax}
                        onChange={handleMaxChange}
                        placeholder={`${max}`}
                        step={step}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none 
                            focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                {(localMin || localMax) && (
                <button
                    onClick={handleClear}
                    className="self-end mb-1 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear range"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
                )}
            </div>
      
            {/* Visual range indicator */}
            {(value.min !== undefined || value.max !== undefined) && (
            <div className="relative h-1 bg-gray-200 rounded-full">
                <div
                    className="absolute h-full bg-purple-500 rounded-full"
                    style={{
                        left: value.min !== undefined ? `${((value.min - min) / (max - min)) * 100}%` : '0%',
                        right: value.max !== undefined ? `${100 - ((value.max - min) / (max - min)) * 100}%` : '0%'
                    }}
                />
                </div>
            )}
        </div>
    );
};

// Main Component
export default function InteractiveFilters({ dashboardId, filters, onFilterChange }: Props) {
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({});
    const [rangeBounds, setRangeBounds] = useState<Record<string, { min: number; max: number }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<Record<string, string>>({});
    const [expanded, setExpanded] = useState(true);

    // Fetch distinct values and range bounds
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
        } else if (filter.type === 'range') {
            // Fetch min/max for range filter
            try {
                setLoading(prev => ({ ...prev, [filter.column]: true }));
          
                // Fetch min value
                const minResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ 
                        column: filter.column,
                        sort: 'asc',
                        limit: 1
                    })
                });
          
                // Fetch max value
                const maxResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        column: filter.column,
                        sort: 'desc',
                        limit: 1
                    })
                });
          
                if (minResponse.ok && maxResponse.ok) {
                    const min = await minResponse.json();
                    const max = await maxResponse.json();
                    setRangeBounds(prev => ({
                        ...prev,
                        [filter.column]: { 
                            min: min[0] || 0, 
                            max: max[0] || 100 
                        }
                    }));
                }
            } catch (error) {
                console.error(`Failed to fetch range bounds for ${filter.column}:`, error);
            } finally {
                setLoading(prev => ({ ...prev, [filter.column]: false }));
            }
        }
    });
    }, [dashboardId, filters]);

    const handleChange = (column: string, value: any) => {
        const newValues = { ...filterValues, [column]: value };
        setFilterValues(newValues);
        onFilterChange(newValues);
    };

    const handleRangeChange = (column: string, min: number | undefined, max: number | undefined) => {
        const newValues = { 
            ...filterValues, 
            [`${column}_min`]: min,
            [`${column}_max`]: max
        };
        setFilterValues(newValues);
        onFilterChange(newValues);
    };

    const clearAllFilters = () => {
        setFilterValues({});
        onFilterChange({});
    };

    const activeFilterCount = Object.keys(filterValues).filter(key => {
        const val = filterValues[key];
        if (key.endsWith('_min') || key.endsWith('_max')) return false;
        return val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0);
    }).length;

    return (
        <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
            {/* Header with collapse toggle and clear button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Interactive Filters</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
        
                {activeFilterCount > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {activeFilterCount} active
                    </span>
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        Clear all
                    </button>
                 </div>
            )}
        </div>

        {/* Filter content */}
        {expanded && (
            <div className="space-y-4">
                {filters.map((filter) => (
                <div key={filter.column} className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700">
                        {filter.label}
                    </label>
              
                    {error[filter.column] && (
                        <p className="text-xs text-red-500">Error: {error[filter.column]}</p>
                    )}
              
                    {filter.type === 'dropdown' && (
                    <CustomSelect
                        options={distinctValues[filter.column] || []}
                        value={filterValues[filter.column] || ''}
                        onChange={(val) => handleChange(filter.column, val)}
                        placeholder="Select an option..."
                        loading={loading[filter.column]}
                    />
                )}
              
                {filter.type === 'multiselect' && (
                    <CustomSelect
                        multiple
                        options={distinctValues[filter.column] || []}
                        value={filterValues[filter.column] || []}
                        onChange={(val) => handleChange(filter.column, val)}
                        placeholder="Select options..."
                        loading={loading[filter.column]}
                    />
                )}
              
                {filter.type === 'range' && rangeBounds[filter.column] && (
                <RangeSlider
                    min={rangeBounds[filter.column].min}
                    max={rangeBounds[filter.column].max}
                    value={{
                        min: filterValues[`${filter.column}_min`],
                        max: filterValues[`${filter.column}_max`]
                    }}
                    onChange={(min, max) => handleRangeChange(filter.column, min, max)}
                />
                )}
                </div>
            ))}
            </div>
        )}
        </div>
    );
}
