'use client';

import { useEffect, useState, useRef } from 'react';
import { InteractiveFilterDef } from '@/app/lib/definitions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/app/lib/constants';
import {
        Box,
        Typography,
        Accordion,
        AccordionSummary,
        AccordionDetails,
        FormControl,
        InputLabel,
        Select,
        MenuItem,
        Checkbox,
        ListItemText,
        TextField,
        Chip,
        IconButton,
        Button,
        CircularProgress,
        Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';

interface Props {
        dashboardId: string;
        filters: InteractiveFilterDef[];
        onFilterChange: (filterValues: Record<string, any>) => void;
}

export default function InteractiveFilters({ dashboardId, filters, onFilterChange }: Props) {
        const [filterValues, setFilterValues] = useState<Record<string, any>>({});
        const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({});
        const [rangeBounds, setRangeBounds] = useState<Record<string, { min: number; max: number }>>({});
        const [loading, setLoading] = useState<Record<string, boolean>>({});
        const [error, setError] = useState<Record<string, string>>({});

        // Fetch distinct values and range bounds
        useEffect(() => {
                filters.forEach(async (filter) => {
                        if (filter.type === 'dropdown' || filter.type === 'multiselect') {
                                setLoading(prev => ({ ...prev, [filter.column]: true }));
                                try {
                                        const url = DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId));
                                        const response = await fetch(url, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ column: filter.column })
                                        });
                                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                        const values = await response.json();
                                        setDistinctValues(prev => ({ ...prev, [filter.column]: values }));
                                } catch (error) {
                                        setError(prev => ({ ...prev, [filter.column]: (error as Error).message }));
                                } finally {
                                        setLoading(prev => ({ ...prev, [filter.column]: false }));
                                }
                        } else if (filter.type === 'range') {
                                setLoading(prev => ({ ...prev, [filter.column]: true }));
                                try {
                                        const url = DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId));
                                        const [minRes, maxRes] = await Promise.all([
                                                fetch(url, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ column: filter.column, sort: 'asc', limit: 1 })
                                                }),
                                                fetch(url, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ column: filter.column, sort: 'desc', limit: 1 })
                                                })
                                        ]);
                                        if (minRes.ok && maxRes.ok) {
                                                const min = await minRes.json();
                                                const max = await maxRes.json();
                                                setRangeBounds(prev => ({
                                                        ...prev,
                                                        [filter.column]: { min: min[0] || 0, max: max[0] || 100 }
                                                }));
                                        }
                                } catch (error) {
                                        console.error(error);
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
                const newValues = { ...filterValues, [`${column}_min`]: min, [`${column}_max`]: max };
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
                <Box>
                        <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                                <FilterAltIcon />
                                                <Typography>Interactive Filters</Typography>
                                                {activeFilterCount > 0 && (
                                                        <Chip label={`${activeFilterCount} active`} size="small" color="primary" />
                                                )}
                                        </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                        {activeFilterCount > 0 && (
                                                <Box display="flex" justifyContent="flex-end" mb={2}>
                                                        <Button size="small" onClick={clearAllFilters} startIcon={<ClearIcon />}>
                                                                Clear all
                                                        </Button>
                                                </Box>
                                        )}
                                        <Box display="flex" flexDirection="column" gap={2}>
                                                {filters.map((filter) => (
                                                        <Box key={filter.column}>
                                                                {filter.type === 'dropdown' && (
                                                                        <FormControl fullWidth size="small" disabled={loading[filter.column]}>
                                                                                <InputLabel>{filter.label}</InputLabel>
                                                                                <Select
                                                                                        value={filterValues[filter.column] || ''}
                                                                                        onChange={(e) => handleChange(filter.column, e.target.value)}
                                                                                        label={filter.label}
                                                                                >
                                                                                        <MenuItem value="">None</MenuItem>
                                                                                        {distinctValues[filter.column]?.map(opt => (
                                                                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                                                        ))}
                                                                                </Select>
                                                                        </FormControl>
                                                                )}
                                                                {filter.type === 'multiselect' && (
                                                                        <FormControl fullWidth size="small" disabled={loading[filter.column]}>
                                                                                <InputLabel>{filter.label}</InputLabel>
                                                                                <Select
                                                                                        multiple
                                                                                        value={filterValues[filter.column] || []}
                                                                                        onChange={(e) => handleChange(filter.column, e.target.value)}
                                                                                        label={filter.label}
                                                                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                                                                >
                                                                                        {distinctValues[filter.column]?.map(opt => (
                                                                                                <MenuItem key={opt} value={opt}>
                                                                                                        <Checkbox checked={(filterValues[filter.column] || []).indexOf(opt) > -1} />
                                                                                                        <ListItemText primary={opt} />
                                                                                                </MenuItem>
                                                                                        ))}
                                                                                </Select>
                                                                        </FormControl>
                                                                )}
                                                                {filter.type === 'range' && rangeBounds[filter.column] && (
                                                                        <Box display="flex" gap={1} alignItems="center">
                                                                                <TextField
                                                                                        label="Min"
                                                                                        type="number"
                                                                                        size="small"
                                                                                        value={filterValues[`${filter.column}_min`] || ''}
                                                                                        onChange={(e) => handleRangeChange(filter.column, e.target.value ? Number(e.target.value) : undefined, filterValues[`${filter.column}_max`])}
                                                                                        placeholder={String(rangeBounds[filter.column].min)}
                                                                                        fullWidth
                                                                                />
                                                                                <Typography>–</Typography>
                                                                                <TextField
                                                                                        label="Max"
                                                                                        type="number"
                                                                                        size="small"
                                                                                        value={filterValues[`${filter.column}_max`] || ''}
                                                                                        onChange={(e) => handleRangeChange(filter.column, filterValues[`${filter.column}_min`], e.target.value ? Number(e.target.value) : undefined)}
                                                                                        placeholder={String(rangeBounds[filter.column].max)}
                                                                                        fullWidth
                                                                                />
                                                                        </Box>
                                                                )}
                                                                {loading[filter.column] && <CircularProgress size={20} />}
                                                                {error[filter.column] && (
                                                                        <Alert severity="error" icon={false}>{error[filter.column]}</Alert>
                                                                )}
                                                        </Box>
                                                ))}
                                        </Box>
                                </AccordionDetails>
                        </Accordion>
                </Box>
        );
}
