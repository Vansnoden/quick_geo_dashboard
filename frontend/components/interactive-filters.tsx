'use client';


import { Slider } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { InteractiveFilterDef } from '@/lib/definitions';
import { DASHBOARD_CHART_DISTINCT_VALS, DASHBOARD_RANGE_BOUNDS } from '@/lib/constants';
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
        // opt.toLowerCase().includes(searchTerm.toLowerCase())
        String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = multiple
    ? (value as string[]).map(v => ({ value: String(v), label: String(v) }))
    : value !== undefined && value !== null && value !== ''
        ? [{ value: String(value), label: String(value) }]
        : [];

    const removeOption = (optionToRemove: string) => {
        if (multiple) {
            const newValue = (value as string[]).filter(v => String(v) !== String(optionToRemove));
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
                        ? (value as string[]).map(String).includes(String(option))
                        : String(value) === String(option);
                
                         return (
                            <div
                                key={option}
                                className={`px-3 py-2 cursor-pointer hover:bg-purple-50 transition-colors ${
                                    isSelected ? 'bg-purple-100 text-purple-700' : ''
                                }`}
                                onClick={() => {
                                    const optStr = String(option);
                                    if (multiple) {
                                        const newValue = isSelected
                                            ? (value as string[]).filter(v => String(v) !== optStr)
                                            : [...((value as string[]) || []), optStr];
                                        onChange(newValue);
                                    } else {
                                        onChange(optStr);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }
                                }}
                            >
                                <span className="text-sm">{String(option)}</span>
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
    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            const [newMin, newMax] = newValue;
            onChange(newMin, newMax);
        }
    };

    const handleClear = () => {
        onChange(undefined, undefined);
    };

    // Determine the current range for the slider
    const currentMin = value.min !== undefined ? value.min : min;
    const currentMax = value.max !== undefined ? value.max : max;

    return (
        <div className="space-y-3">
            <Slider
                value={[currentMin, currentMax]}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                min={min}
                max={max}
                step={step}
                disabled={min === max} // Disable if no range
                disableSwap
                getAriaLabel={() => 'Range filter'}
                valueLabelFormat={(value) => value}
                sx={{
                    color: '#8b5cf6', // purple-600
                    '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                        backgroundColor: '#fff',
                        border: '2px solid #8b5cf6',
                        '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 6px rgba(139,92,246,0.2)',
                        },
                    },
                    '& .MuiSlider-track': {
                        height: 4,
                    },
                    '& .MuiSlider-rail': {
                        height: 4,
                        backgroundColor: '#e2e8f0',
                    },
                }}
            />
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                    Range: {currentMin} – {currentMax}
                </div>
                {(value.min !== undefined || value.max !== undefined) && (
                    <button
                        onClick={handleClear}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Clear range"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
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
        	try {
       			setLoading(prev => ({ ...prev, [filter.column]: true }));
        
			const response = await fetch(DASHBOARD_RANGE_BOUNDS(Number(dashboardId)), {
			    method: 'POST',
			    headers: { 'Content-Type': 'application/json' },
			    body: JSON.stringify({ column: filter.column })
			});
        
        		if (response.ok) {
			    const bounds = await response.json();
			    setRangeBounds(prev => ({
				...prev,
				[filter.column]: { min: bounds.min, max: bounds.max }
			    }));
			} else {
			    console.error(`Failed to fetch range bounds for ${filter.column}`);
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
